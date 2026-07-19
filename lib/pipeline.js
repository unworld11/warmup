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
      profiles: [handle], resultsPerPage: 8,
      shouldDownloadCovers: false, shouldDownloadVideos: false, shouldDownloadSubtitles: false, shouldDownloadSlideshowImages: false,
    }, 48);
    return items.map((it) => ({
      caption: it.text || '',
      plays: it.playCount, likes: it.diggCount,
    })).filter((p) => p.caption).slice(0, 10);
  } catch (_) { return []; }
}

export async function researchReddit(brandName) {
  try {
    const items = await apifyRun('trudax~reddit-scraper', {
      searches: [brandName], type: 'posts', sort: 'relevance',
      maxItems: 6, maxPostCount: 6, skipComments: true,
      searchPosts: true, searchComments: false, searchCommunities: false, searchUsers: false,
    }, 48);
    return items
      .filter((r) => r.title)
      .map((r) => ({ title: r.title, community: r.communityName || r.parsedCommunityName || '', body: (r.body || '').slice(0, 200) }))
      .slice(0, 8);
  } catch (_) { return []; }
}

/* --------------------------- synthesis ----------------------------- */
// Turns the real references into an original brand config. Copy is modeled on
// their patterns, never copied verbatim. Returns the config with image PROMPTS;
// images are generated separately.
const SHAPE = `{
  "name": string, "logo": "",
  "googleFont": string,
  "imageStyle": string,
  "tokens": { "red","redDark","gradient","ink","muted","line","surface","bg","card","navBg","onAccent","ctaBg","ctaText","radius","radiusLg","font" },
  "prepared": { "eyebrow": "A content engine, proposed for", "note": string },
  "hero": { "headline": string, "sub": string, "ctaPrimary": "See the week we built", "ctaSecondary": "Book 20 minutes" },
  "research": { "heading": string, "lead": string, "insights": [ { "stat": string, "title": string, "detail": string } x3 ] },
  "content": { "heading": string, "lead": string,
    "tiktoks": [ { "handle": string, "music": string, "format": string, "caption": string,
      "slides": [ { "imagePrompt": string, "overlay": string, "sub": string } x4 ],
      "stats": { "likes": string, "comments": string, "saves": string, "shares": string } } x4 ],
    "videos": [ { "imagePrompt": string, "duration": "0:32", "title": string, "sub": string } x4 ],
    "reddit": { "subreddit": string, "posted": "6h", "author": string, "title": string, "thumbFromSlide": [tiktokIndex, slideIndex],
      "upvotes": string, "commentCount": string, "body": string,
      "comments": [ { "author": string, "up": string, "text": string, "op": boolean } x3 ] } },
  "scale": { "heading": "How your week actually runs", "lead": string,
    "steps": [ { "n": "01", "title": string, "detail": string } x4 ],
    "stats": [ { "value": string, "label": string } x4 ] },
  "cta": { "headline": string, "sub": string, "button": "Book the next 20 minutes" }
}`;

export async function synthesize({ site, tiktok, reddit }) {
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
- COLOURS: base the palette on the DETECTED COLORS provided. "red" is the accent and should be the brand's real primary colour from that list (the most saturated/brand-defining one, not a grey). Build "bg"/"card"/"ink"/"muted"/"line"/"surface"/"navBg" into a coherent light OR dark theme that matches the site. "onAccent" MUST contrast the accent (dark text on a light accent, light text on a dark accent). "gradient" and "ctaBg" are CSS linear-gradients derived from the accent. radius "16px", radiusLg "24px".
- FONT: match their real typography. Set "googleFont" to a single real Google Fonts family name, and set tokens.font to "'<googleFont>', system-ui, sans-serif" using that exact name. From the DETECTED FONTS: if one is itself a Google Font, use it exactly. If it is proprietary (a custom brand face), pick the closest free Google Font by character: geometric/rounded brand sans (Cereal, Circular, Gotham) -> Manrope, Poppins, or Plus Jakarta Sans; neo-grotesque (Helvetica-like) -> Inter or Work Sans; techy -> Space Grotesk; editorial serif -> Playfair Display, Fraunces, or DM Serif Display; friendly slab -> Bitter. Never invent a family that is not on Google Fonts.
- IMAGERY: write "imageStyle", one reusable visual-direction clause of about 20 to 30 words that gets appended to every image prompt so the slides look like this brand shot them. Encode their colour palette using the DETECTED COLORS, their photography or illustration style, the lighting, and the mood (for example: warm aspirational golden-hour travel photography; moody neon night-time music aesthetic; clean minimal studio product shots on soft brand-coloured backgrounds). It must read like a real brand campaign shoot: name the film or grade look, the lens feel, and the lighting, high production value and editorial. Keep each slide "imagePrompt" a clean SCENE description only, and do not repeat the style words inside it.
- GROUNDING beats format. Every hook, caption, and overlay must reference something specific to THIS brand pulled from their real posts (their actual products, campaigns, audience, topics, or phrasings, reworded and never copied). The named format is the container; the brand's real substance is the content. If a line could be pasted onto a competitor unchanged, it is too generic, rewrite it until it could only be this brand.
- research.insights: ground them in the ACTUAL posts and Reddit threads provided. Cite real patterns (what performs, what the sentiment is, where they're absent). Be specific, not generic.
- content.tiktoks: 4 slideshows, 4 slides each, each a DIFFERENT named format (set "format"). "overlay" is the on-screen hook/line for that slide, punchy and under ~10 words; "sub" is a smaller supporting line or empty. Each slide "imagePrompt" is an ART-DIRECTED photographic scene: name the shot (close-up, wide, over-the-shoulder, POV, flat-lay), the light, the moment, and the emotion, so every slide looks intentional and cinematic, never generic stock. No text, words, or logos inside the image.
- content.videos: 4 short-form video concepts, each a different angle, modeled on their real video posts. imagePrompt is an art-directed thumbnail scene (photographic, no text/logos); duration a short clip length like "0:32"; title/sub the on-card labels.
- reddit: match the real subreddit sentiment; thumbFromSlide points at one generated slide image [tiktokIndex, slideIndex].
- Keep it honest and specific to THIS brand.`;

  const user = `BRAND: ${site.name} (${site.host})
DESCRIPTION: ${site.description || '(none found)'}
THEME COLOUR: ${site.themeColor || '(none found)'}
DETECTED FONTS: ${(site.fonts && site.fonts.join(', ')) || '(none found — infer from the brand)'}
DETECTED COLORS: ${(site.colors && site.colors.join(', ')) || '(none found — infer from the brand)'}

THEIR REAL TIKTOK POSTS (${tiktok.length}):
${tiktok.map((t, i) => `${i + 1}. ${t.caption.replace(/\s+/g, ' ').slice(0, 160)} [${t.plays || 0} plays]`).join('\n') || '(none found — infer from the brand and description)'}

REAL REDDIT THREADS (${reddit.length}):
${reddit.map((r) => `- [${r.community}] ${r.title} :: ${r.body}`).join('\n') || '(none found)'}

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
export async function generateImage(prompt) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '1024x1536', quality: 'medium', n: 1 }),
  });
  if (!res.ok) throw new Error(`openai image ${res.status}`);
  const data = await res.json();
  return `data:image/png;base64,${data.data[0].b64_json}`;
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

// A full bespoke HTML page in the brand's real design language. Palette and
// light/dark are anchored in the CSS extraction (reliable); the live screenshot
// drives layout and composition only.
export async function generatePage(site, config, imgMap = {}) {
  const img = (p) => imgMap[p] || '';
  const tk = config.content?.tiktoks || [];
  const slideshows = tk.map((t) => ({
    format: t.format || '',
    caption: t.caption || '',
    music: t.music || '',
    stats: t.stats || null,
    slides: (t.slides || [])
      .map((sl) => ({ img: img(sl.imagePrompt), overlay: sl.overlay || '', sub: sl.sub || '' }))
      .filter((sl) => sl.img),
  })).filter((s) => s.slides.length);
  const videos = (config.content?.videos || []).map((v) => ({
    cover: img(v.imagePrompt), duration: v.duration || '0:30', title: v.title || '', sub: v.sub || '',
  })).filter((v) => v.cover);
  const r = config.content?.reddit || {};
  const rThumb = r.thumbFromSlide && tk[r.thumbFromSlide[0]]?.slides?.[r.thumbFromSlide[1]]?.imagePrompt;
  const payload = {
    brand: config.name || site.name,
    hero: config.hero || {},
    insights: config.research?.insights || [],
    slideshows, videos,
    reddit: { subreddit: r.subreddit, author: r.author, title: r.title, body: r.body, thumb: img(rThumb) },
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
- CONTENT SECTION is the centrepiece, make it rich and beautiful. Render each slideshow as a horizontally swipeable carousel (CSS scroll-snap, visible overflow) of vertical 9:16 phone-format cards. Each card is ONE slide: the given image fills it (object-fit cover, rounded corners), with that slide's "overlay" set as bold high-contrast text ON the image (add a subtle gradient scrim or text-shadow so it stays legible) and the smaller "sub" beneath it, plus a "1 / 4" style index in a corner and the slideshow's "format" as a small pill. Show each slideshow's caption (and music/stats if present) as a header above its carousel. Then render the videos as a responsive grid of 9:16 thumbnails, each with its image, a centred circular play button, a duration badge, and the title/sub. Use EVERY provided image URL exactly, and add loading="lazy" to every carousel and video image so the page stays fast on mobile. This must feel like a real content deck someone made for them, not a list of placeholders.
- Also include: a top nav (${site.name} name + a small "content proposal" tag + a "Book a call" button); a bold hero (headline, sub, primary and secondary CTA); the insights; the reddit thread; the steps as a numbered sequence; and a closing CTA. Use the copy verbatim, no placeholder text. Responsive and polished.`;

  const html = await chat('gpt-5.6-sol', [
    { role: 'system', content: sys },
    { role: 'user', content: `CONTENT:\n${JSON.stringify(payload)}\n\nReturn the full HTML document now.` },
  ]);
  return html.replace(/^```html\s*/i, '').replace(/```\s*$/, '').trim();
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
