// Inspect what image/media fields the TikTok scraper actually returns.
// node scripts/probe-tiktok.mjs [handle]
import fs from 'node:fs';
for (const line of fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/); if (m) process.env[m[1]] = m[2];
}
const APIFY = (process.env.APIFY_API_TOKEN || '').replace(/[^\x21-\x7E]/g, '');
const handle = process.argv[2] || 'nike';

const url = `https://api.apify.com/v2/acts/clockworks~tiktok-scraper/run-sync-get-dataset-items?token=${APIFY}&timeout=60`;
const res = await fetch(url, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ profiles: [handle], resultsPerPage: 6, shouldDownloadCovers: true, shouldDownloadSlideshowImages: true }),
});
console.log('status', res.status);
const items = await res.json();
console.log('items:', items.length);
const it = items.find((x) => Array.isArray(x.images) && x.images.length) || items[0] || {};
console.log('\ntop-level keys:\n', Object.keys(it).join(', '));

// hunt for anything that looks like an image/cover/media url
function findUrls(obj, path = '', out = []) {
  if (out.length > 40) return out;
  if (typeof obj === 'string' && /^https?:\/\//.test(obj) && /(image|cover|jpe?g|webp|avatar|\.heic|tiktokcdn)/i.test(obj)) out.push(`${path} = ${obj.slice(0, 90)}`);
  else if (Array.isArray(obj)) obj.slice(0, 3).forEach((v, i) => findUrls(v, `${path}[${i}]`, out));
  else if (obj && typeof obj === 'object') for (const k of Object.keys(obj)) findUrls(obj[k], path ? `${path}.${k}` : k, out);
  return out;
}
console.log('\nimage-ish urls found:');
console.log(findUrls(it).join('\n') || '(none)');
console.log('\nisSlideshow/images sample:', { images: (it.images || []).length, cover: it.videoMeta?.coverUrl?.slice(0, 80), origin: it.videoMeta?.originCover?.slice(0, 80) });
