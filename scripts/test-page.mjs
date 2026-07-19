// Test the productionized generatePage() on any URL. node scripts/test-page.mjs [url]
import fs from 'node:fs';
for (const line of fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/); if (m) process.env[m[1]] = m[2];
}
const { extractSite, generateImage, generatePage } = await import('../lib/pipeline.js');

const url = process.argv[2] || 'airbnb.com';
const site = await extractSite(url);
console.log('tone:', site.tone, '| colors:', site.colors.slice(0, 4), '| font:', site.fonts[0] || '(none)');

const P = {
  welcome: 'warm candid photo of a smiling local host welcoming travelers into a sunlit home with food on the table, belonging, travel brand',
  city: 'characterful world-city neighbourhood street at golden hour, warm apartment windows, a traveler with a small suitcase, cinematic arrival',
  food: 'hands sharing a table of colourful local dishes with new friends, warm candlelight, culinary travel experience',
  party: 'joyful outdoor watch party at dusk, crowd on picnic blankets facing a big glowing screen, string lights',
  pov: 'first-person POV walking a lively colourful neighbourhood market with a friendly local guide, warm afternoon light, travel vlog',
};
fs.mkdirSync('/tmp/bespoke-img', { recursive: true });
const imgMap = {};
let i = 0;
for (const [k, prompt] of Object.entries(P)) {
  const path = `/tmp/bespoke-img/${i}.png`;
  if (fs.existsSync(path)) { imgMap[prompt] = `/bespoke-img/${i}.png`; i++; continue; }
  try {
    const d = await generateImage(prompt);
    fs.writeFileSync(path, Buffer.from(d.split(',')[1], 'base64'));
    imgMap[prompt] = `/bespoke-img/${i}.png`;
  } catch (e) { imgMap[prompt] = ''; console.log('img fail', k, e.message); }
  i++;
}
console.log('images:', Object.values(imgMap).filter(Boolean).length);

const config = {
  name: site.name, googleFont: site.fonts[0] || 'Manrope',
  hero: { headline: 'You make the best travel content on the internet.', sub: 'One week of native stories and threads that turn your saves into bookings, in your voice.', ctaPrimary: 'See the week we built', ctaSecondary: 'Book 20 minutes' },
  research: { insights: [
    { stat: 'Guest favourite', title: 'Your funnel is a save button', detail: 'Every unique stay you surface gets screenshotted and sent to a group chat. That reflex is your whole top of funnel.' },
    { stat: 'off your feed', title: 'The loudest conversations happen without you', detail: 'The threads where people pick where to fly and where to stay are wide open, and mostly not you.' },
    { stat: 'send me one', title: 'Discovery moved into the feed', detail: 'People shop for stays inside slideshows and threads now. Native content there is the new front door.' },
  ] },
  content: {
    tiktoks: [
      { caption: 'do a host city like you live there', slides: [{ imagePrompt: P.city, overlay: 'do a host city like you live there', sub: 'save before you fly' }, { imagePrompt: P.party, overlay: 'the watch parties locals go to', sub: '' }, { imagePrompt: P.food, overlay: 'eat where the neighbourhood eats', sub: '' }] },
      { caption: 'your host adopts you', slides: [{ imagePrompt: P.welcome, overlay: 'POV: your host adopts you for the week', sub: '' }, { imagePrompt: P.food, overlay: 'a place set at the table', sub: '' }, { imagePrompt: P.city, overlay: 'came for a bed, left with a home', sub: 'belong anywhere' }] },
      { caption: 'let a local drive', slides: [{ imagePrompt: P.pov, overlay: 'the city tourists never see', sub: 'let a local drive' }, { imagePrompt: P.party, overlay: 'save it for your trip', sub: '' }] },
    ],
    videos: [
      { imagePrompt: P.city, duration: '0:38', title: 'A city, the local way', sub: '48 hours in one clip' },
      { imagePrompt: P.welcome, duration: '0:26', title: 'Meet the host', sub: 'the moment you arrive' },
      { imagePrompt: P.food, duration: '0:31', title: 'The table', sub: 'strangers to friends' },
    ],
    reddit: { subreddit: 'r/travel', author: 'u/awaydays_', title: 'Booked a place expecting tourist-trap chaos. My host basically adopted us.', body: 'Went in bracing for the horror stories. Instead the host left a hand-written list of local spots and walked us to a family-run place the first night. Best trip I have had.', thumbFromSlide: [0, 0] },
  },
  scale: { steps: [{ n: '01', title: 'We study you', detail: 'Your posts and the threads about you.' }, { n: '02', title: 'We make the week', detail: 'Native content in your voice.' }, { n: '03', title: 'The fleet posts it', detail: 'Thousands of aged accounts.' }, { n: '04', title: 'It compounds', detail: 'We double down on what travels.' }] },
  cta: { headline: 'This is one week. Imagine fifty-two.', button: 'Book the next 20 minutes' },
};

console.log('generating bespoke page...');
const html = await generatePage(site, config, imgMap);
fs.writeFileSync('/tmp/bespoke.html', html);
console.log('DONE', html.length, 'bytes -> /tmp/bespoke.html');
