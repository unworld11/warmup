import { generateImage } from '../../../lib/pipeline';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// One prompt -> one image, returned as an inline data URL (no storage needed).
export async function POST(req) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return Response.json({ error: 'prompt required' }, { status: 400 });
    const dataUrl = await generateImage(prompt);
    return Response.json({ dataUrl });
  } catch (e) {
    return Response.json({ error: e.message || 'image failed' }, { status: 500 });
  }
}
