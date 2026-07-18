import { refine } from '../../../lib/pipeline';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Current config + a plain-language instruction -> revised config (same shape).
export async function POST(req) {
  try {
    const { config, instruction } = await req.json();
    if (!config || !instruction) return Response.json({ error: 'config and instruction required' }, { status: 400 });
    const revised = await refine(config, instruction);
    return Response.json({ config: revised });
  } catch (e) {
    return Response.json({ error: e.message || 'refine failed' }, { status: 500 });
  }
}
