import { extractSite, researchTikTok, researchReddit } from '../../../lib/pipeline';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// URL in -> their real posts out. The important phase: we study what they actually publish.
export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) return Response.json({ error: 'url required' }, { status: 400 });
    const site = await extractSite(url);
    const [tiktok, reddit] = await Promise.all([
      researchTikTok(site.tiktokHandle),
      researchReddit(site.name),
    ]);
    return Response.json({ site, tiktok, reddit });
  } catch (e) {
    return Response.json({ error: e.message || 'research failed' }, { status: 500 });
  }
}
