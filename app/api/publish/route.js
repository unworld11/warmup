import { saveDeal, slugify } from '../../../lib/db';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Saves a generated bespoke page (a full self-contained HTML document whose
// images already point at persistent storage URLs) as a published deal, and
// returns its live slug.
export async function POST(req) {
  try {
    const { html, name, sourceUrl } = await req.json();
    if (!html) return Response.json({ error: 'html required' }, { status: 400 });
    const brandName = name || 'brand';
    const slug = slugify(brandName);
    await saveDeal({ slug, url: sourceUrl || '', brandName, config: { name: brandName, html, sourceUrl }, status: 'published' });
    return Response.json({ slug, path: `/${slug}` });
  } catch (e) {
    return Response.json({ error: e.message || 'publish failed' }, { status: 500 });
  }
}
