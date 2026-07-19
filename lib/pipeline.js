// Server-only pipeline. Imported only by API route handlers, so it never reaches
// the client. Reads keys from process.env (OPENAI_API_KEY, APIFY_API_TOKEN).

// Strip anything that isn't printable ASCII. API keys are always ASCII, so this
// safely removes paste artifacts (a stray leading bullet, smart quote, or hidden
// char) that would otherwise blow up header construction with a ByteString error.
const clean = (v) => (v || '').replace(/[^\x21-\x7E]/g, '');
const OPENAI = clean(process.env.OPENAI_API_KEY);
const APIFY = clean(process.env.APIFY_API_TOKEN);

/* ------------------------- site extraction ------------------------- */
// Best-effort read of a URL: brand name, description, theme colour, and social
// handles. JS-heavy sites may yield little; we degrade gracefully.
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

export async function extractSite(url) {
  const clean = url.startsWith('http') ? url : `https://${url}`;
  let html = '';
  try {
    html = await (await fetch(clean, { headers: { 'User-Agent': UA }, redirect: 'follow' })).text();
  } catch (_) { /* leave html empty */ }

  const meta = (prop) => {
    const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
    const m = html.match(re) || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i'));
    return m ? m[1].trim() : '';
  };
  const host = new URL(clean).hostname.replace(/^www\./, '');
  const rootName = host.split('.')[0];
  const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '').trim();
  const social = (domain) => {
    const m = html.match(new RegExp(`https?://(?:www\\.)?${domain}\\.com/@?([A-Za-z0-9_.]+)`, 'i'));
    return m ? m[1] : '';
  };

  // Pull real CSS: inline <style> blocks plus the first few linked stylesheets.
  // Fonts and brand colours live here, not in the meta tags.
  let css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
  const cssHrefs = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi)]
    .map((t) => (t[0].match(/href=["']([^"']+)["']/) || [])[1])
    .filter(Boolean).slice(0, 3);
  for (const href of cssHrefs) {
    try {
      const abs = href.startsWith('http') ? href : new URL(href, clean).href;
      css += '\n' + (await (await fetch(abs, { headers: { 'User-Agent': UA } })).text()).slice(0, 200000);
    } catch (_) { /* skip */ }
  }
  const blob = html + '\n' + css;

  // Fonts: Google Fonts requests, @font-face names, and the first token of any font-family.
  const generic = /^(inherit|initial|unset|revert|sans-serif|serif|monospace|cursive|system-ui|ui-sans-serif|ui-serif|-apple-system|BlinkMacSystemFont|Arial|Helvetica|"Helvetica Neue"|Segoe UI|Roboto|Times|Georgia)$/i;
  const fonts = [];
  const addFont = (f) => {
    f = (f || '').replace(/['"]/g, '').trim();
    // skip CSS vars / functions and generic/system stacks
    if (f && !f.includes('(') && !generic.test(f) && !fonts.some((x) => x.toLowerCase() === f.toLowerCase())) fonts.push(f);
  };
  for (const m of blob.matchAll(/fonts\.googleapis\.com\/css2?\?([^"'>\s]+)/g)) {
    for (const fm of m[1].matchAll(/family=([^:&]+)/g)) addFont(decodeURIComponent(fm[1].replace(/\+/g, ' ')));
  }
  for (const m of blob.matchAll(/@font-face[^}]*?font-family\s*:\s*([^;}]+)/gi)) addFont(m[1].split(',')[0]);
  for (const m of blob.matchAll(/font-family\s*:\s*([^;{}]+)/gi)) addFont(m[1].split(',')[0]);

  // Colours: theme-color plus the most frequent hex values (minus plain black/white).
  const count = {};
  const bump = (c) => { c = c.toLowerCase(); count[c] = (count[c] || 0) + 1; };
  if (meta('theme-color') && /^#/.test(meta('theme-color'))) bump(meta('theme-color'));
  for (const m of css.matchAll(/#[0-9a-fA-F]{6}\b/g)) bump(m[0]);
  const colors = Object.entries(count).sort((a, b) => b[1] - a[1]).map((e) => e[0])
    .filter((c) => !['#ffffff', '#000000', '#fefefe', '#010101'].includes(c)).slice(0, 10);

  // Light or dark, from the ACTUAL page background (body/html/:root), not the screenshot.
  const lum = (c) => {
    c = (c || '').trim().toLowerCase();
    if (c === 'white') return 1; if (c === 'black') return 0;
    let r, g, b;
    let m = c.match(/^#([0-9a-f]{3})$/); if (m) { [r, g, b] = m[1].split('').map((h) => parseInt(h + h, 16)); }
    m = c.match(/^#([0-9a-f]{6})$/); if (m) { r = parseInt(m[1].slice(0, 2), 16); g = parseInt(m[1].slice(2, 4), 16); b = parseInt(m[1].slice(4, 6), 16); }
    m = c.match(/^rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/); if (m) { r = +m[1]; g = +m[2]; b = +m[3]; }
    if (r == null) return null;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };
  const bgMatch = css.match(/(?:body|html|:root)\s*{[^}]*?background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6}|rgba?\([^)]+\)|white|black)/i);
  const bgLum = lum((bgMatch && bgMatch[1]) || meta('theme-color'));
  const tone = bgLum == null ? 'light' : (bgLum < 0.4 ? 'dark' : 'light');

  let name = meta('og:site_name') || title.split(/[|\-–—]/)[0].trim() || rootName;
  // Bot / redirect / loading stubs give junk titles; fall back to the domain.
  if (!name || /redirect|loading|just a moment|attention required|access denied|error|%\{|not found|are you a robot/i.test(name) || name.length > 40) name = rootName;
  return {
    url: clean,
    host,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    description: meta('og:description') || meta('description') || '',
    themeColor: meta('theme-color') || '',
    ogImage: meta('og:image') || '',
    tiktokHandle: social('tiktok') || rootName,
    instagramHandle: social('instagram') || '',
    fonts: fonts.slice(0, 6),
    colors,
    tone,
  };
}

/* --------------------------- Apify research ------------------------ */
async function apifyRun(actor, input, secs = 120) {
  const url = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${APIFY}&timeout=${secs}`;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  if (!res.ok) throw new Error(`apify ${actor} ${res.status}`);
  return res.json();
}

export async function researchTikTok(handle) {
  try {
    const items = await apifyRun('clockworks~tiktok-scraper', {
      profiles: [handle], resultsPerPage: 12,
      shouldDownloadCovers: false, shouldDownloadVideos: false, shouldDownloadSubtitles: false, shouldDownloadSlideshowImages: false,
    }, 48);
    return items.map((it) => {
      const frames = Array.isArray(it.slideshowImageLinks)
        ? it.slideshowImageLinks.map((s) => s.tiktokLink || s.downloadLink).filter(Boolean)
        : [];
      const media = frames.length ? frames : [it.videoMeta?.originalCoverUrl || it.videoMeta?.coverUrl].filter(Boolean);
      return {
        caption: it.text || '',
        plays: it.playCount, likes: it.diggCount, comments: it.commentCount, shares: it.shareCount, saves: it.collectCount,
        music: it.musicMeta ? `${it.musicMeta.musicName || ''}${it.musicMeta.musicAuthor ? ` - ${it.musicMeta.musicAuthor}` : ''}`.trim() : '',
        hashtags: Array.isArray(it.hashtags) ? it.hashtags.map((h) => h.name).filter(Boolean).slice(0, 6) : [],
        isSlideshow: Boolean(it.isSlideshow),
        media, // real image URLs: slideshow frames, else the video cover
        handle: (it.authorMeta && it.authorMeta.name) || handle,
      };
    }).filter((p) => p.caption).slice(0, 12);
  } catch (_) { return []; }
}

export async function researchReddit(brandName) {
  try {
    const items = await apifyRun('trudax~reddit-scraper', {
      searches: [brandName], type: 'posts', sort: 'relevance',
      maxItems: 10, maxPostCount: 10, skipComments: true,
      searchPosts: true, searchComments: false, searchCommunities: false, searchUsers: false,
    }, 48);
    return items
      .filter((r) => r.title)
      .map((r) => ({
        title: r.title,
        community: r.communityName || r.parsedCommunityName || '',
        body: (r.body || '').slice(0, 240),
        upvotes: r.upVotes ?? r.score ?? 0,
        comments: r.numberOfComments ?? r.numComments ?? 0,
      }))
      .slice(0, 10);
  } catch (_) { return []; }
}

// Actually LOOK at their real posts. Fetches a few reference frames, asks a
// vision model what their content looks like and how they style on-screen text,
// so generation replicates their real look and each slideshow can be grounded in
// a DIFFERENT real post. Returns null on any failure (degrade gracefully).
export async function analyzeReferences(refs) {
  const picked = (refs || []).filter((r) => r.media && r.media.length).slice(0, 6);
  if (!picked.length) return null;
  try {
    const fetched = await Promise.all(picked.map(async (r) => {
      try {
        const res = await fetch(r.media[0]);
        if (!res.ok) return null;
        const buf = Buffer.from(await res.arrayBuffer());
        if (!buf.length || buf.length > 4_000_000) return null;
        const ct = res.headers.get('content-type') || 'image/jpeg';
        return { caption: r.caption, isSlideshow: r.isSlideshow, dataUrl: `data:${ct};base64,${buf.toString('base64')}` };
      } catch { return null; }
    }));
    const valid = fetched.filter(Boolean);
    if (!valid.length) return null;
    const content = [{ type: 'text', text: `These are ${valid.length} real posts from a brand's TikTok, in order. Tell me what their content ACTUALLY looks like so a designer can make new posts in the same style. Return ONLY JSON: {"stickerStyle":"how they style ON-SCREEN TEXT: font weight, case, colour, placement, boxed vs plain vs shadowed, size","visualSignature":"their overall photo and edit look in one concrete sentence","posts":[{"looks":"what THIS specific image shows: subject, setting, composition, colour, mood"} one per image in order]}. Be concrete and specific to what you SEE, never generic.` }];
    valid.forEach((v) => content.push({ type: 'image_url', image_url: { url: v.dataUrl } }));
    const raw = await chat('gpt-4o', [{ role: 'user', content }]);
    const json = JSON.parse(raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim());
    if (Array.isArray(json.posts)) json.posts.forEach((p, i) => { p.caption = valid[i]?.caption || ''; });
    return json;
  } catch { return null; }
}

/* --------------------------- synthesis ----------------------------- */
// Turns the real references into an original brand config. Copy is modeled on
// their patterns, never copied verbatim. Returns the config with image PROMPTS;
// images are generated separately.
const SHAPE = `{
  "name": string, "logo": "",
  "googleFont": string,
  "imageStyle": string,
  "stickerStyle": string,
  "tokens": { "red","redDark","gradient","ink","muted","line","surface","bg","card","navBg","onAccent","ctaBg","ctaText","radius","radiusLg","font" },
  "prepared": { "eyebrow": "A content engine, proposed for", "note": string },
  "hero": { "headline": string, "sub": string, "ctaPrimary": "See the week we built", "ctaSecondary": "Book 20 minutes" },
  "research": { "heading": string, "lead": string, "insights": [ { "stat": string, "title": string, "detail": string } x3 ] },
  "content": { "heading": string, "lead": string,
    "tiktoks": [ { "handle": string, "music": string, "hashtags": [string x3], "format": string, "caption": string,
      "slides": [ { "imagePrompt": string, "overlay": string, "sub": string } x4 ],
      "stats": { "likes": string, "comments": string, "saves": string, "shares": string } } x4 ],
    "videos": [ { "imagePrompt": string, "duration": "0:32", "title": string, "sub": string } x4 ],
    "reddits": [ { "subreddit": string, "posted": "6h", "author": string, "title": string, "thumbFromSlide": [tiktokIndex, slideIndex] or null,
      "upvotes": string, "commentCount": string, "body": string,
      "comments": [ { "author": string, "up": string, "text": string, "op": boolean } x2 ] } x3 ] },
  "scale": { "heading": "How your week actually runs", "lead": string,
    "steps": [ { "n": "01", "title": string, "detail": string } x4 ],
    "stats": [ { "value": string, "label": string } x4 ] },
  "cta": { "headline": string, "sub": string, "button": "Book the next 20 minutes" }
}`;

export async function synthesize({ site, tiktok, reddit, visualBrief }) {
  const sys = `You are an elite short-form creative director. You have made TikToks and Reddit threads with hundreds of millions of views. You study a brand's REAL posts, reverse-engineer why they work, then design a one-week slate of NEW content that is unmistakably in that brand's voice and design language, but sharper and more scroll-stopping than what they make today. This is a pitch a prospect must look at and think "these people get us, and they are better at this than we are."

The craft you must apply to every slideshow and video:
- HOOK like your life depends on the first frame. Use proven openers: a curiosity gap, a POV, a specific surprising number, a contrarian truth stated plainly, a "the thing nobody tells you about ___", a green-flag/red-flag, a "I tried ___ so you don't have to". Second person. Concrete, never vague.
- Give every slideshow a NARRATIVE ARC across its slides: slide 1 is the hook, the middle slides build tension or stack proof or twist, the last slide pays it off and lands a soft, native call to action. Each overlay should make the viewer need to swipe to the next.
- VARY the formats hard. Each slideshow must use a DIFFERENT recognizable format and you name it in "format" (for example: POV story, listicle / ranked tier, before vs after, myth-bust, day-in-the-life, "green flags", "things I wish I knew", receipts / screenshots energy, unpopular opinion). Never ship two slideshows in the same format.
- Voice: match how THIS brand actually talks in their real posts, do not import a generic ad voice. If they are playful, be playful. If they are premium and spare, be premium and spare.

Hard rules:
- Output ONLY valid JSON matching this exact shape (no markdown): ${SHAPE}
- Write ORIGINAL copy modeled on the patterns in their real posts. NEVER copy any caption, title, or sentence verbatim. No song lyrics, no copyrighted text.
- Never use em dashes or en dashes in any copy. Use commas or full stops instead.
- COLOURS: base the palette on the DETECTED COLORS provided. "red" is the accent and should be the brand's real primary colour from that list (the most saturated, brand-defining one). Do NOT pick a grey, and do NOT pick a generic web link-blue (around #06f, #007bff, #006dff) which is incidental UI chrome, not the brand colour. If the detected colours are only greys plus a link-blue, use the brand's real well-known colours from your knowledge instead (for example Nike is black, white with volt/orange accents). "imageStyle" must use this same corrected palette. Build "bg"/"card"/"ink"/"muted"/"line"/"surface"/"navBg" into a coherent light OR dark theme that matches the site. "onAccent" MUST contrast the accent (dark text on a light accent, light text on a dark accent). "gradient" and "ctaBg" are CSS linear-gradients derived from the accent. radius "16px", radiusLg "24px".
- FONT: match their real typography. Set "googleFont" to a single real Google Fonts family name, and set tokens.font to "'<googleFont>', system-ui, sans-serif" using that exact name. From the DETECTED FONTS: if one is itself a Google Font, use it exactly. If it is proprietary (a custom brand face), pick the closest free Google Font by character: geometric/rounded brand sans (Cereal, Circular, Gotham) -> Manrope, Poppins, or Plus Jakarta Sans; neo-grotesque (Helvetica-like) -> Inter or Work Sans; techy -> Space Grotesk; editorial serif -> Playfair Display, Fraunces, or DM Serif Display; friendly slab -> Bitter. Never invent a family that is not on Google Fonts.
- IMAGERY: write "imageStyle", one reusable visual-direction clause of about 20 to 30 words that gets appended to every image prompt so the slides look like this brand shot them. Encode their colour palette using the DETECTED COLORS, their photography or illustration style, the lighting, and the mood (for example: warm aspirational golden-hour travel photography; moody neon night-time music aesthetic; clean minimal studio product shots on soft brand-coloured backgrounds). It must read like a real brand campaign shoot: name the film or grade look, the lens feel, and the lighting, high production value and editorial. Keep each slide "imagePrompt" a clean SCENE description only, and do not repeat the style words inside it.
- GROUNDING beats format. Every hook, caption, and overlay must reference something specific to THIS brand pulled from their real posts (their actual products, campaigns, audience, topics, or phrasings, reworded and never copied). The named format is the container; the brand's real substance is the content. If a line could be pasted onto a competitor unchanged, it is too generic, rewrite it until it could only be this brand.
- research.insights: ground them in the ACTUAL posts and Reddit threads provided. Cite real patterns (what performs, what the sentiment is, where they're absent). Be specific, not generic.
- content.tiktoks: 4 photo SLIDESHOWS that REPLICATE their real TikTok posts, 4 slides each, each a DIFFERENT named format (set "format"). Ground EACH slideshow in a DIFFERENT real post from the analysis above (match its subject and look). The 4 slideshows must cover different subjects, products or campaigns with NO concept, phrase or hook repeated across them, and each set in a visually DISTINCT world (different setting, time of day, palette emphasis and composition) so they never look like one shoot. Reuse their REAL @handle in "handle". Set "music" to one of their actual sounds when given, else a realistic trending sound. Set "hashtags" to 3 realistic tags they would use. Set "stats" to realistic numbers in the RANGE of their real posts (short strings like "48.2K").
- "overlay" is the exact TikTok text-sticker line rendered INTO the slide image. Keep each line short enough to render cleanly (usually 2 to 7 common, correctly spellable words), but VARY THE FORM hard across all 16 slides: mix questions, plain statements, numbers or stats, list items, quotes or dialogue, and flat declaratives. Do NOT default to second-person "You/Your", and no two slideshows may open with the same word or use the same rhythm. "sub" is a shorter second line or empty.
- Each slide "imagePrompt" describes the ART-DIRECTED photographic SCENE ONLY (the text sticker is added separately, so no text in this scene): name the shot (close-up, wide, over-the-shoulder, POV, flat-lay), the light, the moment and the emotion, and match the real visual signature from the analysis. Leave room (usually the upper third) for the text sticker. No text, words or logos inside the scene.
- "stickerStyle": one short, specific clause for how to style the on-screen text sticker to match THEIR real posts (from the analysis: font weight, case, colour, boxed vs plain vs shadowed, placement). This is used to render the baked text.
- content.videos: 4 short-form video concepts, each a different angle, modeled on their real video posts. imagePrompt is an art-directed thumbnail scene (photographic, no text/logos); duration a short clip length like "0:32"; title/sub the on-card labels.
- content.reddits: 3 Reddit threads grounded in the REAL threads provided. Use real-looking subreddits (reuse the ones the real threads are in), realistic upvote and comment counts in the range of the real ones, and sentiment that matches what people actually say about them. Each thread has 2 short comments. Original text, never copied. thumbFromSlide may point at a generated slide image or be null for a text post.
- Keep it honest and specific to THIS brand.`;

  const user = `BRAND: ${site.name} (${site.host})
DESCRIPTION: ${site.description || '(none found)'}
THEME COLOUR: ${site.themeColor || '(none found)'}
DETECTED FONTS: ${(site.fonts && site.fonts.join(', ')) || '(none found — infer from the brand)'}
DETECTED COLORS: ${(site.colors && site.colors.join(', ')) || '(none found — infer from the brand)'}

THEIR REAL HANDLE: ${site.tiktokHandle || '(unknown)'}
THEIR REAL TIKTOK POSTS (${tiktok.length}) — replicate these formats, sounds and hook styles:
${tiktok.map((t, i) => `${i + 1}. ${t.isSlideshow ? '[PHOTO SLIDESHOW]' : '[VIDEO]'} "${t.caption.replace(/\s+/g, ' ').slice(0, 180)}"${t.music ? ` | sound: ${t.music}` : ''}${t.hashtags?.length ? ` | ${t.hashtags.map((h) => '#' + h).join(' ')}` : ''} | ${t.plays || 0} plays, ${t.likes || 0} likes, ${t.comments || 0} comments, ${t.saves || 0} saves`).join('\n') || '(none found — infer from the brand and description)'}

WHAT THEIR POSTS ACTUALLY LOOK LIKE (from analysing their real images):
${visualBrief ? `Visual signature: ${visualBrief.visualSignature || '(n/a)'}
Their on-screen TEXT style: ${visualBrief.stickerStyle || '(n/a)'}
Real posts seen (ground each of your 4 slideshows in a DIFFERENT one of these):
${(visualBrief.posts || []).map((p, i) => `${i + 1}. LOOKS: ${p.looks}${p.caption ? ` | CAPTION: ${p.caption.replace(/\s+/g, ' ').slice(0, 100)}` : ''}`).join('\n')}` : '(could not analyse their images; infer their visual style from the brand)'}

REAL REDDIT THREADS ABOUT THEM (${reddit.length}):
${reddit.map((r) => `- r/${r.community} (${r.upvotes || 0} upvotes, ${r.comments || 0} comments): ${r.title} :: ${r.body}`).join('\n') || '(none found)'}

Produce the JSON proposal now.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-5.6-sol',
      messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) throw new Error(`openai synth ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

/* --------------------------- refinement ---------------------------- */
// Applies a natural-language instruction to an existing config and returns the
// revised config in the same shape. Keeps structure and imagePrompts stable
// unless the instruction is explicitly about visuals.
export async function refine(config, instruction) {
  const sys = `You revise an existing social-content proposal config. Output ONLY the full revised config as valid JSON in the exact same shape you are given. Apply the user's instruction faithfully. Keep the same number of tiktoks and the same number of slides in each, and keep every imagePrompt field byte-for-byte UNLESS the instruction is explicitly about the visuals/images. Keep all copy original (never copy a brand's real posts verbatim). Never use em dashes or en dashes.`;
  const user = `CURRENT CONFIG:\n${JSON.stringify(config)}\n\nINSTRUCTION: ${instruction}\n\nReturn the full revised config JSON now.`;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-5.6-sol', messages: [{ role: 'system', content: sys }, { role: 'user', content: user }], response_format: { type: 'json_object' } }),
  });
  if (!res.ok) throw new Error(`openai refine ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

/* --------------------------- image gen ----------------------------- */
export async function generateImage(prompt, quality = 'medium') {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '1024x1536', quality, n: 1 }),
  });
  if (!res.ok) throw new Error(`openai image ${res.status}`);
  const data = await res.json();
  return `data:image/png;base64,${data.data[0].b64_json}`;
}

// Composes the full image prompt for a slideshow slide: the scene, the brand
// visual style, and the hook TEXT baked in as a real TikTok text sticker. Shared
// by the task (which generates) and generatePage (which keys imgMap), so both
// resolve to the exact same key.
export function slideImagePrompt(slide, config) {
  const imageStyle = typeof config === 'string' ? config : (config && config.imageStyle) || '';
  const stickerStyle = (config && typeof config === 'object' && config.stickerStyle) || 'bold clean white sans-serif on a semi-transparent rounded black box, upper third';
  const scene = (slide.imagePrompt || '').trim();
  const style = imageStyle ? `. ${imageStyle}` : '';
  const text = (slide.overlay || '').trim();
  const sub = (slide.sub || '').trim();
  const sticker = text
    ? `. Overlay this exact text on the photo as a TikTok text sticker, spelled EXACTLY: "${text}"${sub ? ` and a smaller second line: "${sub}"` : ''}. Match this text STYLE (font weight, case, colour, box or shadow): ${stickerStyle}. Place the sticker in the UPPER or MIDDLE of the frame and keep the lower fifth of the image completely clear (that space is reserved for the app UI). Large and legible. Render ONLY this text, correctly spelled, and no other words, letters, captions, watermarks or logos anywhere in the image.`
    : '. No text, words or logos anywhere in the image.';
  return `${scene}${style}${sticker}`;
}

/* --------------------------- bespoke page -------------------------- */
async function chat(model, messages) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages }),
  });
  if (!res.ok) throw new Error(`${model} ${res.status}: ${(await res.text()).slice(0, 180)}`);
  return (await res.json()).choices[0].message.content;
}

// Injected into every generated page: makes horizontal scroll-snap carousels
// (the TikTok slideshows) draggable with a mouse and adds prev/next arrows, so
// they are swipeable on desktop, not just trackpad/touch. Runtime auto-detects
// the carousels by computed style, so it does not depend on Sol's markup.
const CAROUSEL_JS = `<script>
(function(){
  function isH(el){try{var s=getComputedStyle(el);var snap=(s.scrollSnapType||'').indexOf('x')>-1;var ox=s.overflowX;return (snap||ox==='auto'||ox==='scroll')&&(el.scrollWidth-el.clientWidth>16);}catch(e){return false;}}
  function step(el,d){var c=el.firstElementChild;var w=c?c.getBoundingClientRect().width:el.clientWidth*0.85;var g=parseFloat(getComputedStyle(el).columnGap||getComputedStyle(el).gap)||14;el.scrollBy({left:d*(w+g),behavior:'smooth'});}
  function arrow(el,d){var b=document.createElement('button');b.type='button';b.textContent=d<0?'\\u2039':'\\u203a';b.style.cssText='position:absolute;top:50%;'+(d<0?'left:8px':'right:8px')+';transform:translateY(-50%);z-index:60;width:40px;height:40px;border-radius:50%;border:0;background:rgba(0,0,0,.5);color:#fff;font-size:22px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;';b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();step(el,d);});return b;}
  function enhance(el){if(el.__sw)return;el.__sw=1;el.style.cursor='grab';el.style.setProperty('scroll-behavior','auto');var down=false,sx=0,sl=0,moved=false;
    el.addEventListener('pointerdown',function(e){down=true;moved=false;sx=e.clientX;sl=el.scrollLeft;el.style.scrollSnapType='none';try{el.setPointerCapture(e.pointerId);}catch(_){}el.style.cursor='grabbing';});
    el.addEventListener('pointermove',function(e){if(!down)return;var dx=e.clientX-sx;if(Math.abs(dx)>4)moved=true;el.scrollLeft=sl-dx;});
    function up(){if(!down)return;down=false;el.style.cursor='grab';el.style.scrollSnapType='';}
    el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('pointerleave',up);
    el.addEventListener('click',function(e){if(moved){e.preventDefault();e.stopPropagation();}},true);
    var p=el.parentElement;if(p){if(getComputedStyle(p).position==='static')p.style.position='relative';p.appendChild(arrow(el,-1));p.appendChild(arrow(el,1));}
  }
  function run(){var a=document.querySelectorAll('div,ul,section');for(var i=0;i<a.length;i++){if(isH(a[i]))enhance(a[i]);}}
  if(document.readyState!=='loading')run();else document.addEventListener('DOMContentLoaded',run);
  window.addEventListener('load',run);setTimeout(run,700);
})();
</script>`;

// A full bespoke HTML page in the brand's real design language. Palette and
// light/dark are anchored in the CSS extraction (reliable); the live screenshot
// drives layout and composition only.
export async function generatePage(site, config, imgMap = {}) {
  const img = (p) => imgMap[p] || '';
  const style = config.imageStyle ? `. ${config.imageStyle}` : '';
  const tk = config.content?.tiktoks || [];
  const handle = site.tiktokHandle || '';
  const slideshows = tk.map((t) => ({
    handle: (t.handle || handle || site.name || '').replace(/^@/, ''),
    format: t.format || '',
    caption: t.caption || '',
    music: t.music || '',
    hashtags: Array.isArray(t.hashtags) ? t.hashtags : [],
    stats: t.stats || null,
    // The hook text is baked INTO each slide image, so only the image travels.
    slides: (t.slides || [])
      .map((sl) => ({ img: img(slideImagePrompt(sl, config)) }))
      .filter((sl) => sl.img),
  })).filter((s) => s.slides.length);
  const videos = (config.content?.videos || []).map((v) => ({
    cover: img(v.imagePrompt + style), duration: v.duration || '0:30', title: v.title || '', sub: v.sub || '',
  })).filter((v) => v.cover);
  const reddits = (config.content?.reddits || []).map((r) => {
    const rThumb = Array.isArray(r.thumbFromSlide) && tk[r.thumbFromSlide[0]]?.slides?.[r.thumbFromSlide[1]]?.imagePrompt;
    return {
      subreddit: r.subreddit, author: r.author, posted: r.posted, title: r.title, body: r.body,
      upvotes: r.upvotes, commentCount: r.commentCount, comments: r.comments || [], thumb: img(rThumb),
    };
  });
  const payload = {
    brand: config.name || site.name,
    hero: config.hero || {},
    insights: config.research?.insights || [],
    slideshows, videos, reddits,
    steps: config.scale?.steps || [],
    cta: config.cta || {},
  };

  const shot = `https://image.thum.io/get/width/1280/noanimate/${site.url}`;
  let brief = `Infer ${site.name}'s known layout.`;
  try {
    brief = await chat('gpt-4o', [{
      role: 'user',
      content: [
        { type: 'text', text: `Screenshot of ${site.name}'s site. Describe its LAYOUT and composition for rebuilding a page in the same style: section rhythm, how large the display type is, grid vs stacked, whitespace density, button shape, and how imagery is used (full-bleed, contained, cropped, corner radius). Also name the 2 to 3 dominant brand colours you see as hex. 130 words. Do NOT decide whether it is light or dark, that is provided separately.` },
        { type: 'image_url', image_url: { url: shot } },
      ],
    }]);
  } catch (_) { /* keep fallback */ }

  const dark = site.tone === 'dark';
  const sys = `You are a world-class front-end designer. Output ONE complete self-contained HTML5 document and NOTHING else (no markdown code fences).
- THEME: this is a ${dark ? 'DARK' : 'LIGHT'} site. The page background MUST be ${dark ? 'near-black or the brand dark surface' : 'white or a very light near-white'}. This is authoritative, never invert it.
- PALETTE: ${(site.colors && site.colors.length) ? `these colours were detected on their site: ${site.colors.join(', ')}` : `use ${site.name}'s well-known official brand colours from your knowledge, plus any colours named in the LAYOUT brief`}. Choose the brand ACCENT as the most brand-defining saturated colour, and treat any generic web link-blue (around #06f, #007bff, #006dff) or UI grey as incidental chrome, NOT the accent. If the detected colours look like UI chrome rather than the real brand colour, use ${site.name}'s well-known accent from your knowledge instead. Use the accent prominently and correctly for ${site.name}, and do not introduce off-brand colours.
- TYPE: load "${config.googleFont || 'Inter'}" from Google Fonts and use it throughout, matching the brand's weight and casing.
- LAYOUT to follow: ${brief}
- It must read like a real ${site.name} page, not a generic proposal template: match their layout, type scale, spacing, button style, and imagery treatment.
- CONTENT SECTION is the centrepiece, make it rich and beautiful. Lay the slideshows out as a row of REAL TIKTOK PHONE MOCKUPS. Each slideshow is a vertical 9:16 card that looks like an actual TikTok "photo mode" post, and swiping is a horizontal scroll-snap carousel of that slideshow's slides. The hook/caption text is ALREADY BAKED INTO each slide image, so do NOT add any of your own text over the image; only render the authentic TikTok app chrome as HTML overlays on top of the image:
  * top: thin segmented progress bars (one segment per slide, first filled) like a story, and a small "For You" hint.
  * bottom-left: the "@" + handle in bold, then the caption (with the hashtags as blue-tinted #tags), then a sound row: a small ♪ note icon + the music text, gently marquee-scrolling.
  * right-side vertical ACTION RAIL, evenly spaced, white icons with the count under each: a round profile avatar (use the slideshow's first slide image) with a small red "+" follow badge; a heart with likes; a speech bubble with comments; a bookmark with saves; a share arrow with shares. Use the slideshow's "stats".
  * a full-height bottom gradient scrim so the text stays legible.
  Give the scroll track overflow-x:auto and scroll-snap-type:x mandatory, each slide scroll-snap-align:start and a fixed width so the slides sit side by side and swipe cleanly. Decorative overlays (the scrim and sticker text) MUST have pointer-events:none so they never block swiping; keep only the action-rail buttons interactive.
  The image must fill the card (object-fit cover, rounded ~14px corners, dark card). Give each card a subtle phone-ish frame. It has to be instantly recognisable as a TikTok slideshow, not a generic image card.
- Then render the videos as a responsive grid of 9:16 TikTok-style thumbnails, each with its image, a centred circular play button, a duration badge, a small view count, and the title/sub.
- Use EVERY provided image URL exactly, and add loading="lazy" to every slideshow and video image so the page stays fast on mobile.
- Also include: a top nav (${site.name} name + a small "content proposal" tag + a "Book a call" button); a bold hero (headline, sub, primary and secondary CTA); the insights; a "What people already say" REDDIT section rendering ALL of payload.reddits as a set of real-looking Reddit post cards (left rail with an up-arrow, the upvote count and a down-arrow; header "r/subreddit • posted by u/author • time"; bold title; body text; a small row of the comments with their author, up count and an OP tag where op is true; the comment count and a share/save row; use the thumb image on the right when present); the steps as a numbered sequence; and a closing CTA. Use the copy verbatim, no placeholder text. Responsive and polished.`;

  const html = await chat('gpt-5.6-sol', [
    { role: 'system', content: sys },
    { role: 'user', content: `CONTENT:\n${JSON.stringify(payload)}\n\nReturn the full HTML document now.` },
  ]);
  const out = html
    .replace(/^```html\s*/i, '').replace(/```\s*$/, '')
    .replace(/<img (?![^>]*\bloading=)/gi, '<img loading="lazy" ') // defer all imagery for mobile
    .trim();
  // Guarantee the carousels are swipeable with a mouse, regardless of Sol's JS.
  return out.includes('</body>') ? out.replace('</body>', `${CAROUSEL_JS}\n</body>`) : out + CAROUSEL_JS;
}

// Edit a bespoke page in place from a plain-english instruction. Fast: one Sol
// pass, no new imagery. Keeps every existing image URL and the design language.
export async function refinePage(html, instruction) {
  const out = await chat('gpt-5.6-sol', [
    { role: 'system', content: `You edit an existing self-contained HTML page. Apply the user's change and output the FULL updated HTML5 document and NOTHING else (no markdown fences). Keep the exact same design language, fonts, palette, structure and every existing image URL unless the instruction is specifically about them. Only change what the instruction asks for.` },
    { role: 'user', content: `CURRENT PAGE:\n${html}\n\nCHANGE TO MAKE:\n${instruction}\n\nReturn the full updated HTML document now.` },
  ]);
  return out.replace(/^```html\s*/i, '').replace(/```\s*$/, '').trim();
}
