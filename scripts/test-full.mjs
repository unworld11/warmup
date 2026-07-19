// Full local run of the prod content path: extract -> synthesize -> images -> page.
// node scripts/test-full.mjs [url]
import fs from 'node:fs';
for (const line of fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/); if (m) process.env[m[1]] = m[2];
}
const { extractSite, synthesize, generateImage, generatePage } = await import('../lib/pipeline.js');

const url = process.argv[2] || 'nike.com';
console.log('1 extract', url);
const site = await extractSite(url);
console.log('  name:', site.name, '| tone:', site.tone, '| font:', site.fonts[0] || '(none)', '| colors:', site.colors.slice(0, 4));

console.log('2 synthesize (creative content)');
const config = await synthesize({ site, tiktok: [], reddit: [] });
console.log('  slideshows:', (config.content?.tiktoks || []).length, '| videos:', (config.content?.videos || []).length);
console.log('  imageStyle:', (config.imageStyle || '').slice(0, 120));
(config.content?.tiktoks || []).forEach((t) => console.log(`   [${t.format}] ${(t.slides || []).map((s) => s.overlay).join(' / ')}`));

console.log('3 images');
const prompts = [];
(config.content?.tiktoks || []).forEach((t) => (t.slides || []).forEach((s) => s.imagePrompt && prompts.push(s.imagePrompt)));
(config.content?.videos || []).forEach((v) => v.imagePrompt && prompts.push(v.imagePrompt));
const unique = [...new Set(prompts)];
const style = config.imageStyle ? `. ${config.imageStyle}` : '';
fs.mkdirSync('/tmp/bespoke-img', { recursive: true });
const imgMap = {}; let i = 0;
await Promise.all([0, 1, 2, 3, 4].map(async () => {
  while (i < unique.length) {
    const my = i++; const p = unique[my];
    try {
      const d = await generateImage(p + style);
      fs.writeFileSync(`/tmp/bespoke-img/f${my}.png`, Buffer.from(d.split(',')[1], 'base64'));
      imgMap[p] = `/bespoke-img/f${my}.png`;
    } catch (e) { imgMap[p] = ''; console.log('  img fail', e.message); }
  }
}));
console.log('  images:', Object.values(imgMap).filter(Boolean).length, '/', unique.length);

console.log('4 page');
const html = await generatePage(site, config, imgMap);
fs.writeFileSync('/tmp/bespoke.html', html);
console.log('DONE', html.length, 'bytes -> /tmp/bespoke.html');
