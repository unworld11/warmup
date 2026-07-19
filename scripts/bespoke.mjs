// Prototype: generate a BESPOKE page in a brand's real design language.
// screenshot site -> vision design brief -> Sol writes a full HTML page.
// Usage: node scripts/bespoke.mjs [url]
import fs from 'node:fs';

// load .env.local into process.env
for (const line of fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}
const OPENAI = (process.env.OPENAI_API_KEY || '').replace(/[^\x21-\x7E]/g, '');
const { extractSite, generateImage } = await import('../lib/pipeline.js');

const url = process.argv[2] || 'nike.com';

async function chat(model, messages, json = false) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, ...(json ? { response_format: { type: 'json_object' } } : {}) }),
  });
  if (!res.ok) throw new Error(`${model} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()).choices[0].message.content;
}

console.log('1/4 extracting', url);
const site = await extractSite(url);
console.log('   name:', site.name, '| fonts:', site.fonts.slice(0, 3), '| colors:', site.colors.slice(0, 5));

console.log('2/4 vision design brief from a live screenshot');
const shot = `https://image.thum.io/get/width/1280/noanimate/${site.url}`;
let brief = '';
try {
  brief = await chat('gpt-4o', [{
    role: 'user',
    content: [
      { type: 'text', text: `This is a screenshot of ${site.name}'s website. Write a precise DESIGN BRIEF another designer could use to build a new page in the EXACT same design language. Cover, concretely: is it light or dark (name the background colour); the accent/brand colour; typography (family vibe, weight, casing, condensed or not, how big the display type is); layout and section rhythm; whitespace density; button and link styling; how imagery is used (scale, framing, corners, full-bleed or contained); and the overall mood. 180 words, specific.` },
      { type: 'image_url', image_url: { url: shot } },
    ],
  }]);
} catch (e) { brief = `(screenshot brief unavailable: ${e.message}). Infer ${site.name}'s known web design language.`; }
console.log('   brief:', brief.slice(0, 160), '...');

console.log('3/4 generating 3 on-brand images');
const prompts = [
  `a lone athlete in a powerful starting-blocks stance at night under stadium floodlights, dramatic, cinematic, for ${site.name}`,
  `close-up of running shoes mid-stride on a wet track, motion, dramatic lighting, product-hero, for ${site.name}`,
  `a diverse group of runners celebrating together at dawn in a city, authentic community energy, for ${site.name}`,
  `a basketball player frozen mid-air at the peak of a dunk, silhouetted against bright arena lights, powerful, for ${site.name}`,
  `an athlete lacing their shoe on an empty track at sunrise, quiet determination, close and human, for ${site.name}`,
  `a solo runner sprinting through empty neon-lit city streets at night, motion blur, cinematic, for ${site.name}`,
];
const imgs = [];
for (const p of prompts) { try { imgs.push(await generateImage(p)); } catch { imgs.push(''); } }
console.log('   images:', imgs.filter(Boolean).length, 'generated');
// write images to files so the html can reference them locally
fs.mkdirSync('/tmp/bespoke-img', { recursive: true });
const imgPaths = imgs.map((d, i) => {
  if (!d) return '';
  const b64 = d.split(',')[1];
  const path = `/tmp/bespoke-img/${i}.png`;
  fs.writeFileSync(path, Buffer.from(b64, 'base64'));
  return `file://${path}`;
});

const content = {
  brand: site.name,
  googleFont: site.fonts[0] || 'Inter',
  colors: site.colors,
  hero: { headline: 'The next lap starts now.', sub: 'One week of athlete-first stories, product proof, and community conversation, built to turn attention into momentum.', ctaPrimary: 'See the week we built', ctaSecondary: 'Book 20 minutes' },
  insights: [
    { stat: 'human > heroic', title: 'Your best posts are the human ones', detail: 'The clips that travel are not the polished hero spots. They are the unguarded athlete moments. That is repeatable, and mostly untapped at volume.' },
    { stat: 'off-feed', title: 'The real conversation is off your feed', detail: 'Where people actually debate drops, restocks and who is next lives in threads and comments you are not in yet.' },
    { stat: 'drops = culture', title: 'Every drop is a culture moment', detail: 'A release is not a product post, it is an event. We treat each one like one, across thousands of native accounts.' },
  ],
  slideshows: [
    { img: imgPaths[0], slides: 6, title: 'Night has a new pace', sub: 'starting blocks, floodlights, the city asleep' },
    { img: imgPaths[2], slides: 5, title: 'Run clubs are the new front row', sub: 'dawn, a crew, real belonging' },
    { img: imgPaths[4], slides: 4, title: 'The 5am club, unfiltered', sub: 'the part no ad ever shows you' },
    { img: imgPaths[3], slides: 7, title: 'Hang time, frame by frame', sub: 'which one is your lock screen?' },
  ],
  videos: [
    { img: imgPaths[1], duration: '0:34', title: 'The one everyone screenshots', sub: 'shoe, stride, spray of water' },
    { img: imgPaths[5], duration: '0:22', title: 'Empty streets, full speed', sub: 'POV: the night run nobody sees' },
    { img: imgPaths[0], duration: '0:41', title: 'Blocks to finish line', sub: 'a whole race in forty seconds' },
  ],
  reddit: { subreddit: 'r/running', title: 'Bought these expecting hype over substance. Ran my first sub-25 5k in them yesterday.', body: 'Went in cynical after all the marketing. Genuinely the most comfortable tempo shoe I have owned. The hype is annoying but the shoe is real.' },
  steps: [
    { n: '01', title: 'We study you', detail: 'Your posts, your drops, and where the conversation actually happens.' },
    { n: '02', title: 'We make the week', detail: 'Native stories and threads in your voice, not an ad voice.' },
    { n: '03', title: 'The fleet posts it', detail: 'Thousands of real, aged accounts across TikTok and Reddit.' },
    { n: '04', title: 'It compounds', detail: 'We double down on what travels and feed it into next week.' },
  ],
  cta: { headline: 'This is one week. Imagine a season.', button: 'Book the next 20 minutes' },
};

console.log('4/4 generating the bespoke page');
const sys = `You are a world-class front-end designer. Output ONE complete, self-contained HTML5 document and NOTHING else (no markdown fences). Rules:
- Render the page ENTIRELY in ${site.name}'s design language, following this brief exactly:
${brief}
- It must look like a real ${site.name} page, not a generic proposal template: match their background, layout, section rhythm, type scale and weight, spacing, button style, and imagery treatment.
- Inline all CSS in one <style>. Load the font with a Google Fonts <link> for "${content.googleFont}" (or the closest real Google Font if that is not one). Palette to use: ${site.colors.join(', ')}.
- Use the provided image URLs exactly for imagery. Make imagery prominent if the brand does.
- Present ALL the provided content: nav; hero; the 3 insights; then a rich "The Week" content section that shows content.slideshows as slideshow cards (each image with a small slide-count badge like "1/6" top-corner) AND content.videos as video thumbnails (each image with a centered circular play button and a duration badge like "0:34"), laid out in a strong grid using the given image URLs; then the reddit thread; the 4 steps; and the closing CTA. Make the imagery big and bold if the brand is imagery-led.
- Modern, responsive, polished. No lorem ipsum, use the given copy verbatim.`;
const html = await chat('gpt-5.6-sol', [
  { role: 'system', content: sys },
  { role: 'user', content: `CONTENT:\n${JSON.stringify(content, null, 1)}\n\nReturn the full HTML document now.` },
]);
const clean = html.replace(/^```html\s*/i, '').replace(/```\s*$/, '');
fs.writeFileSync('/tmp/bespoke.html', clean);
console.log('DONE -> /tmp/bespoke.html (', clean.length, 'bytes )');
