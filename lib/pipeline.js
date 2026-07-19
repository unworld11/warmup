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

  const name = meta('og:site_name') || title.split(/[|\-–—]/)[0].trim() || rootName;
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
    "tiktoks": [ { "handle": string, "music": string, "caption": string,
      "slides": [ { "imagePrompt": string, "overlay": string, "sub": string } x3 ],
      "stats": { "likes": string, "comments": string, "saves": string, "shares": string } } x2 ],
    "reddit": { "subreddit": string, "posted": "6h", "author": string, "title": string, "thumbFromSlide": [tiktokIndex, slideIndex],
      "upvotes": string, "commentCount": string, "body": string,
      "comments": [ { "author": string, "up": string, "text": string, "op": boolean } x3 ] } },
  "scale": { "heading": "How your week actually runs", "lead": string,
    "steps": [ { "n": "01", "title": string, "detail": string } x4 ],
    "stats": [ { "value": string, "label": string } x4 ] },
  "cta": { "headline": string, "sub": string, "button": "Book the next 20 minutes" }
}`;

export async function synthesize({ site, tiktok, reddit }) {
  const sys = `You are a senior creative strategist at a social-content agency. You study a brand's REAL posts and produce a one-week content proposal page, entirely in the brand's own design language and voice.

Hard rules:
- Output ONLY valid JSON matching this exact shape (no markdown): ${SHAPE}
- Write ORIGINAL copy modeled on the patterns in their real posts. NEVER copy any caption, title, or sentence verbatim. No song lyrics, no copyrighted text.
- Never use em dashes or en dashes in any copy. Use commas or full stops instead.
- COLOURS: base the palette on the DETECTED COLORS provided. "red" is the accent and should be the brand's real primary colour from that list (the most saturated/brand-defining one, not a grey). Build "bg"/"card"/"ink"/"muted"/"line"/"surface"/"navBg" into a coherent light OR dark theme that matches the site. "onAccent" MUST contrast the accent (dark text on a light accent, light text on a dark accent). "gradient" and "ctaBg" are CSS linear-gradients derived from the accent. radius "16px", radiusLg "24px".
- FONT: match their real typography. Set "googleFont" to a single real Google Fonts family name, and set tokens.font to "'<googleFont>', system-ui, sans-serif" using that exact name. From the DETECTED FONTS: if one is itself a Google Font, use it exactly. If it is proprietary (a custom brand face), pick the closest free Google Font by character: geometric/rounded brand sans (Cereal, Circular, Gotham) -> Manrope, Poppins, or Plus Jakarta Sans; neo-grotesque (Helvetica-like) -> Inter or Work Sans; techy -> Space Grotesk; editorial serif -> Playfair Display, Fraunces, or DM Serif Display; friendly slab -> Bitter. Never invent a family that is not on Google Fonts.
- IMAGERY: write "imageStyle", one reusable visual-direction clause of about 20 to 30 words that gets appended to every image prompt so the slides look like this brand shot them. Encode their colour palette using the DETECTED COLORS, their photography or illustration style, the lighting, and the mood (for example: warm aspirational golden-hour travel photography; moody neon night-time music aesthetic; clean minimal studio product shots on soft brand-coloured backgrounds). Keep each slide "imagePrompt" a clean SCENE description only, and do not repeat the style words inside it.
- research.insights: ground them in the ACTUAL posts and Reddit threads provided. Cite real patterns (what performs, what the sentiment is, where they're absent). Be specific, not generic.
- content.tiktoks: 2 slideshows, 3 slides each, modeled on their real formats. slides[].imagePrompt is a photographic prompt (no text/logos in image). overlay/sub are the on-screen text.
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
