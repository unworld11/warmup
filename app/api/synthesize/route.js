import { synthesize } from '../../../lib/pipeline';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Real references in -> an original, brand-specific proposal (with image prompts) out.
export async function POST(req) {
  try {
    const { site, tiktok, reddit } = await req.json();
    if (!site) return Response.json({ error: 'site required' }, { status: 400 });
    const config = await synthesize({ site, tiktok: tiktok || [], reddit: reddit || [] });
    return Response.json({ config });
  } catch (e) {
    return Response.json({ error: e.message || 'synthesis failed' }, { status: 500 });
  }
}
