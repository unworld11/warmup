// Research phase: pull a brand's REAL existing posts (TikTok + Reddit) via Apify.
// Usage: node scripts/research.mjs <tiktokHandle> <brandName> <slug>
// Output: /tmp/research-<slug>.json — the reviewable "what they actually post" artifact.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [handle, brandName, slug] = process.argv.slice(2);
if (!handle || !brandName || !slug) { console.error('args: <tiktokHandle> <brandName> <slug>'); process.exit(1); }

const APIFY = (() => {
  const txt = fs.readFileSync(path.join(os.homedir(), 'orca', '.env'), 'utf8');
  for (const l of txt.split('\n')) { const m = l.match(/^APIFY_API_TOKEN=(.*)$/); if (m) return m[1].trim().replace(/^["']|["']$/g, ''); }
  throw new Error('no apify token');
})();

async function runActor(actor, input, secs = 240) {
  const url = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${APIFY}&timeout=${secs}`;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  if (!res.ok) { throw new Error(`${actor} ${res.status}: ${(await res.text()).slice(0, 200)}`); }
  return res.json();
}

async function tiktok() {
  const items = await runActor('clockworks~tiktok-scraper', {
    profiles: [handle], resultsPerPage: 25,
    shouldDownloadCovers: false, shouldDownloadVideos: false, shouldDownloadSubtitles: false, shouldDownloadSlideshowImages: false,
  });
  return items.map((it) => ({
    caption: it.text || '',
    hashtags: (it.hashtags || []).map((h) => h.name).filter(Boolean),
    plays: it.playCount, likes: it.diggCount, comments: it.commentCount, shares: it.shareCount, saves: it.collectCount,
  })).filter((p) => p.caption);
}

async function reddit() {
  // trudax/reddit-scraper — search the brand name, grab posts + top comments
  const items = await runActor('trudax~reddit-scraper', {
    searches: [brandName], type: 'posts', sort: 'relevance',
    maxItems: 15, maxPostCount: 15, maxComments: 6, skipComments: false,
    searchPosts: true, searchComments: false, searchCommunities: false, searchUsers: false,
  });
  return items;
}

const out = { brand: brandName, handle, slug, tiktok: [], reddit: [], errors: {} };
const [tk, rd] = await Promise.allSettled([tiktok(), reddit()]);
if (tk.status === 'fulfilled') out.tiktok = tk.value; else out.errors.tiktok = tk.reason.message;
if (rd.status === 'fulfilled') out.reddit = rd.value; else out.errors.reddit = rd.reason.message;

fs.writeFileSync(`/tmp/research-${slug}.json`, JSON.stringify(out, null, 1));

console.log('=== TikTok posts:', out.tiktok.length, '===');
out.tiktok.slice(0, 6).forEach((p) => console.log('•', p.caption.replace(/\n/g, ' ').slice(0, 90), `[${p.plays}p/${p.likes}l]`));
console.log('\n=== Reddit items:', out.reddit.length, '===');
if (out.reddit[0]) console.log('first-item keys:', Object.keys(out.reddit[0]).join(', '));
out.reddit.slice(0, 6).forEach((r) => console.log('•', String(r.title || r.text || r.body || '').replace(/\n/g, ' ').slice(0, 90)));
if (Object.keys(out.errors).length) console.log('\nERRORS:', out.errors);
console.log('\nsaved /tmp/research-' + slug + '.json');
