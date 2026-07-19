import { refinePage } from '../../../lib/pipeline';

export const runtime = 'nodejs';
export const maxDuration = 120;
export const dynamic = 'force-dynamic';

// Current bespoke HTML + a plain-language instruction -> edited HTML (same
// design language, same images). One fast Sol pass, no new imagery.
export async function POST(req) {
  try {
    const { html, instruction } = await req.json();
    if (!html || !instruction) return Response.json({ error: 'html and instruction required' }, { status: 400 });
    const revised = await refinePage(html, instruction);
    return Response.json({ html: revised });
  } catch (e) {
    return Response.json({ error: e.message || 'refine failed' }, { status: 500 });
  }
}
