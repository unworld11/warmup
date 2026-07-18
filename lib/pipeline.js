// Server-only pipeline. Imported only by API route handlers, so it never reaches
// the client. Reads keys from process.env (OPENAI_API_KEY, APIFY_API_TOKEN).

const OPENAI = process.env.OPENAI_API_KEY;
const APIFY = process.env.APIFY_API_TOKEN;

/* ------------------------- site extraction ------------------------- */
// Best-effort read of a URL: brand name, description, theme colour, and social
// handles. JS-heavy sites may yield little; we degrade gracefully.
export async function extractSite(url) {
  const clean = url.startsWith('http') ? url : `https://${url}`;
  let html = '';
  try {
    const res = await fetch(clean, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36' },
      redirect: 'follow',
    });
    html = await res.text();
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
    });
    return items.map((it) => ({
      caption: it.text || '',
      plays: it.playCount, likes: it.diggCount,
    })).filter((p) => p.caption).slice(0, 12);
  } catch (_) { return []; }
}

export async function researchReddit(brandName) {
  try {
    const items = await apifyRun('trudax~reddit-scraper', {
      searches: [brandName], type: 'posts', sort: 'relevance',
      maxItems: 10, maxPostCount: 10, skipComments: true,
      searchPosts: true, searchComments: false, searchCommunities: false, searchUsers: false,
    });
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
- tokens: choose a light OR dark palette that matches the brand. "red" is the accent (use their brand colour if known). "onAccent" MUST contrast the accent (dark text on light accent, light on dark). "bg"/"card"/"ink"/"muted"/"line"/"surface"/"navBg" must form a coherent light or dark theme. "gradient" and "ctaBg" are CSS linear-gradients. "font" MUST be exactly "var(--font-manrope), system-ui, sans-serif" OR "var(--font-jakarta), system-ui, sans-serif". radius "16px", radiusLg "24px".
- research.insights: ground them in the ACTUAL posts and Reddit threads provided. Cite real patterns (what performs, what the sentiment is, where they're absent). Be specific, not generic.
- content.tiktoks: 2 slideshows, 3 slides each, modeled on their real formats. slides[].imagePrompt is a photographic prompt (no text/logos in image). overlay/sub are the on-screen text.
- reddit: match the real subreddit sentiment; thumbFromSlide points at one generated slide image [tiktokIndex, slideIndex].
- Keep it honest and specific to THIS brand.`;

  const user = `BRAND: ${site.name} (${site.host})
DESCRIPTION: ${site.description || '(none found)'}
THEME COLOUR: ${site.themeColor || '(none found)'}

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
