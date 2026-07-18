// Generates aligned example content imagery for the Airbnb strategy page.
// Reads OPENAI_API_KEY from ~/orca/.env. Portrait 1024x1536, text overlays added in UI.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function readKey() {
  const envPath = path.join(os.homedir(), 'orca', '.env');
  const txt = fs.readFileSync(envPath, 'utf8');
  for (const line of txt.split('\n')) {
    const m = line.match(/^OPENAI_API_KEY=(.*)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  throw new Error('no key');
}
const KEY = readKey();
const OUT = path.join(os.homedir(), 'warmup', 'public', 'content', 'airbnb');
fs.mkdirSync(OUT, { recursive: true });

// Aligned to Airbnb's DNA: unique/unreal stays, aspirational-but-real, Indian market (.co.in),
// aesthetic listing photography, warm natural light, "you have to save this" energy.
const shots = [
  ['01-aframe', 'Photorealistic travel photograph of a matte-black A-frame cabin nestled in misty pine forest in the Western Ghats of India at golden hour, warm glowing floor-to-ceiling windows, small wooden deck, cinematic aspirational mood, natural light, ultra detailed, editorial listing photography, vertical composition'],
  ['02-treehouse', 'Photorealistic photograph of a glass-walled luxury treehouse villa built into a lush green forest canopy at dusk, warm string lights, cozy modern interior visible, eco-luxury stay, dreamy aspirational travel mood, vertical composition'],
  ['03-goa-pool', 'Photorealistic photograph of a modern tropical villa with an infinity pool overlooking the Goa coastline at sunset, palm trees, clean architecture, reflections on water, aspirational vacation, editorial real-estate photography, vertical composition'],
  ['04-haveli', 'Photorealistic photograph of a restored heritage haveli courtyard in Jodhpur India, blue-washed walls and arches, colorful handwoven textiles and cushions, warm evening light, intimate and characterful, travel editorial, vertical composition'],
  ['05-houseboat', 'Photorealistic photograph of the bedroom of a Kerala backwaters houseboat, warm wooden interior, open doors framing palm-lined still water at soft morning light, serene and unique stay, vertical composition'],
  ['06-interior-morning', 'Photorealistic cozy interior of a modern mountain cabin, unmade bed with rumpled linen sheets, an enormous window with a misty forest and mountain view, a mug of coffee on the nightstand, soft morning light, POV of waking up, aspirational slow travel, vertical composition'],
  ['07-balcony-pov', 'Photorealistic first-person POV holding a ceramic coffee mug with both hands, looking out over misty layered mountains from a wooden cabin balcony, a soft blanket over the lap, cozy aspirational morning, vertical composition'],
  ['08-cliff-villa', 'Photorealistic photograph of a minimalist white cliffside villa with an infinity-edge plunge pool overlooking a deep blue sea, bright clean Mediterranean-in-India feel, luxury unique stay, vertical composition'],
];

async function gen([slug, prompt]) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '1024x1536', quality: 'high', n: 1 }),
  });
  if (!res.ok) { console.error(slug, 'FAIL', res.status, (await res.text()).slice(0, 300)); return false; }
  const data = await res.json();
  const b64 = data.data[0].b64_json;
  fs.writeFileSync(path.join(OUT, `${slug}.png`), Buffer.from(b64, 'base64'));
  console.log('OK', slug);
  return true;
}

// small concurrency to avoid rate limits
async function run() {
  const pool = 3;
  let i = 0;
  async function worker() { while (i < shots.length) { const s = shots[i++]; try { await gen(s); } catch (e) { console.error(s[0], e.message); } } }
  await Promise.all(Array.from({ length: pool }, worker));
  console.log('DONE');
}
run();
