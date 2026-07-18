// Regenerates Airbnb imagery GROUNDED in the real research (World Cup host-city
// travel, Experiences, "hosts who feel like family", creator-POV city culture).
// Original scenes only — no logos, no real people, no team marks.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const KEY = (() => {
  const txt = fs.readFileSync(path.join(os.homedir(), 'orca', '.env'), 'utf8');
  for (const l of txt.split('\n')) { const m = l.match(/^OPENAI_API_KEY=(.*)$/); if (m) return m[1].trim().replace(/^["']|["']$/g, ''); }
  throw new Error('no key');
})();
const OUT = path.join(os.homedir(), 'warmup', 'public', 'content', 'airbnb');

const shots = [
  ['wc-fans', 'Photorealistic photograph of a diverse group of joyful international football fans in colorful plain jerseys and scarves celebrating together on a vibrant big-city street at golden hour, generic flags, travel energy, no text no logos, vertical composition'],
  ['host-welcome', 'Photorealistic warm candid photograph of a smiling local host welcoming two travelers into a cozy sunlit home, a table set with shared food, genuine laughter, hospitality and belonging, vertical composition'],
  ['creator-pov', 'Photorealistic first-person POV walking through a lively colorful neighborhood street market with a friendly local guide gesturing ahead, street-food stalls, warm afternoon light, travel-vlog aesthetic, vertical composition'],
  ['watch-party', 'Photorealistic photograph of a joyful outdoor watch party at dusk, a happy crowd on picnic blankets in a park facing a large glowing screen, string lights, community excitement, no readable text, vertical composition'],
  ['food-local', 'Photorealistic photograph of hands sharing a table full of colorful local small plates and dishes with new friends, candles and warm light, culinary travel experience, vertical composition'],
  ['host-city', 'Photorealistic evening street scene in a characterful world-city neighborhood, warm apartment windows glowing, a couple with a small suitcase looking up in wonder, cinematic travel arrival, vertical composition'],
  ['keys-welcome', 'Photorealistic candid close-up of a host handing over keys to a happy traveler at the doorway of a charming apartment, warm genuine smiles, belonging, vertical composition'],
  ['stadium-pov', 'Photorealistic first-person POV in a packed generic stadium crowd, fans in colorful plain jerseys cheering, floodlights and atmospheric haze, electric live sporting-event energy, no logos, vertical composition'],
];

async function gen([slug, prompt]) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST', headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '1024x1536', quality: 'high', n: 1 }),
  });
  if (!res.ok) { console.error(slug, 'FAIL', res.status, (await res.text()).slice(0, 200)); return; }
  const data = await res.json();
  fs.writeFileSync(path.join(OUT, `${slug}.png`), Buffer.from(data.data[0].b64_json, 'base64'));
  console.log('OK', slug);
}

async function run() {
  let i = 0;
  const worker = async () => { while (i < shots.length) { const s = shots[i++]; try { await gen(s); } catch (e) { console.error(s[0], e.message); } } };
  await Promise.all([worker(), worker(), worker()]);
  console.log('DONE');
}
run();
