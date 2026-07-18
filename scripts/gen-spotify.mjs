// Generates aligned example content imagery for the Spotify strategy page.
// Original music-mood visuals only — no album art, no real artists (copyright).
// Text overlays (song/playlist names) are added in the UI.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function readKey() {
  const txt = fs.readFileSync(path.join(os.homedir(), 'orca', '.env'), 'utf8');
  for (const line of txt.split('\n')) {
    const m = line.match(/^OPENAI_API_KEY=(.*)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  throw new Error('no key');
}
const KEY = readKey();
const OUT = path.join(os.homedir(), 'warmup', 'public', 'content', 'spotify');
fs.mkdirSync(OUT, { recursive: true });

const shots = [
  ['01-nightdrive', 'Photorealistic first-person view from inside a car at night driving through a neon-lit city, rain on the windshield, glowing signs reflecting on wet glass, moody cinematic music-video aesthetic, vertical composition'],
  ['02-headphones', 'Photorealistic portrait of a young person wearing large over-ear headphones with eyes closed, fully immersed, bathed in colorful magenta and lime-green gradient light, dreamy music-immersion mood, vertical composition'],
  ['03-concert', 'Photorealistic concert crowd seen from behind, hands and phones raised, silhouettes against bright stage lights and atmospheric haze, euphoric live-music energy, vertical composition'],
  ['04-vinyl', 'Photorealistic close-up of a vinyl record spinning on a turntable in a cozy warm-lit room, shallow depth of field, rich bokeh, nostalgic analog music aesthetic, vertical composition'],
  ['05-gradient-a', 'Abstract bold vibrant gradient background, magenta blending into lime green and warm orange, smooth soft-focus color field, high-energy modern music-brand wrapped style, minimal, vertical composition'],
  ['06-gradient-b', 'Abstract bold vibrant gradient background, deep purple into electric blue into acid green, smooth blended color field, energetic modern music-brand style, minimal, vertical composition'],
  ['07-lofi-room', 'Photorealistic cozy bedroom at night lit by warm string lights and soft neon glow, a phone propped up glowing, relaxed lo-fi late-night study aesthetic, vertical composition'],
  ['08-roadtrip', 'Photorealistic view out an open car window during a golden-hour road trip, a hand surfing the wind, open highway and warm glowing sky, carefree summer music vibe, vertical composition'],
];

async function gen([slug, prompt]) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '1024x1536', quality: 'high', n: 1 }),
  });
  if (!res.ok) { console.error(slug, 'FAIL', res.status, (await res.text()).slice(0, 300)); return; }
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
