// Full local run of the prod content path: extract -> synthesize -> images -> page.
// node scripts/test-full.mjs [url]
import fs from 'node:fs';
for (const line of fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/); if (m) process.env[m[1]] = m[2];
}
const { extractSite, researchTikTok, researchReddit, synthesize, generateImage, generatePage, slideImagePrompt, analyzeReferences } = await import('../lib/pipeline.js');

const url = process.argv[2] || 'nike.com';
console.log('1 extract', url);
const site = await extractSite(url);
console.log('  name:', site.name, '| tone:', site.tone, '| handle:', site.tiktokHandle || '(none)', '| colors:', site.colors.slice(0, 4));

console.log('2 research (real tiktok + reddit)');
const [tiktok, reddit] = await Promise.all([researchTikTok(site.tiktokHandle), researchReddit(site.name)]);
console.log('  tiktok posts:', tiktok.length, '| reddit threads:', reddit.length);
tiktok.slice(0, 3).forEach((t) => console.log(`   TT ${t.isSlideshow ? '[slides]' : '[video]'} "${(t.caption || '').slice(0, 60)}" ${t.music ? '♪ ' + t.music.slice(0, 30) : ''}`));

console.log('2b vision: looking at their real post images');
const visualBrief = await analyzeReferences(tiktok);
if (visualBrief) {
  console.log('  sticker style:', (visualBrief.stickerStyle || '').slice(0, 100));
  console.log('  signature:', (visualBrief.visualSignature || '').slice(0, 100));
  (visualBrief.posts || []).forEach((p, i) => console.log(`   ref${i + 1}: ${(p.looks || '').slice(0, 80)}`));
} else { console.log('  (no visual brief)'); }

console.log('3 synthesize (replicate + creative)');
const config = await synthesize({ site, tiktok, reddit, visualBrief });
console.log('  slideshows:', (config.content?.tiktoks || []).length, '| videos:', (config.content?.videos || []).length, '| reddits:', (config.content?.reddits || []).length);
console.log('  imageStyle:', (config.imageStyle || '').slice(0, 120));
(config.content?.tiktoks || []).forEach((t) => console.log(`   @${t.handle} [${t.format}] ♪${(t.music || '').slice(0, 24)} :: ${(t.slides || []).map((s) => s.overlay).join(' / ')}`));
(config.content?.reddits || []).forEach((r) => console.log(`   r/${r.subreddit} (${r.upvotes}) ${r.title}`));

console.log('3 images (baking hook text into slides)');
const style = config.imageStyle ? `. ${config.imageStyle}` : '';
const jobs = [];
(config.content?.tiktoks || []).forEach((t) => (t.slides || []).forEach((s) => { if (s.imagePrompt) jobs.push({ prompt: slideImagePrompt(s, config), quality: 'high' }); }));
(config.content?.videos || []).forEach((v) => { if (v.imagePrompt) jobs.push({ prompt: v.imagePrompt + style, quality: 'medium' }); });
const seen = new Set();
const unique = jobs.filter((j) => !seen.has(j.prompt) && seen.add(j.prompt));
fs.mkdirSync('/tmp/bespoke-img', { recursive: true });
const imgMap = {}; let i = 0;
await Promise.all([0, 1, 2, 3, 4].map(async () => {
  while (i < unique.length) {
    const my = i++; const { prompt, quality } = unique[my];
    try {
      const d = await generateImage(prompt, quality);
      fs.writeFileSync(`/tmp/bespoke-img/f${my}.png`, Buffer.from(d.split(',')[1], 'base64'));
      imgMap[prompt] = `/bespoke-img/f${my}.png`;
    } catch (e) { imgMap[prompt] = ''; console.log('  img fail', e.message); }
  }
}));
console.log('  images:', Object.values(imgMap).filter(Boolean).length, '/', unique.length);

console.log('4 page');
const html = await generatePage(site, config, imgMap);
fs.writeFileSync('/tmp/bespoke.html', html);
console.log('DONE', html.length, 'bytes -> /tmp/bespoke.html');
