import { uploadDataUrl, saveDeal, slugify } from '../../../lib/db';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Takes a generated brand config (images as inline data URLs), moves the images
// to storage, saves the deal as published, and returns its live slug.
export async function POST(req) {
  try {
    const { brand } = await req.json();
    if (!brand?.name) return Response.json({ error: 'brand required' }, { status: 400 });
    const slug = slugify(brand.name);

    const tiktoks = await Promise.all((brand.content?.tiktoks || []).map(async (t, ti) => {
      const slides = await Promise.all((t.slides || []).map(async (s, si) => ({
        ...s, img: await uploadDataUrl(s.img, `${slug}/t${ti}-s${si}`),
      })));
      return { ...t, slides, avatarImg: slides[0]?.img || '' };
    }));
    const reddit = { ...(brand.content?.reddit || {}), thumb: tiktoks[0]?.slides?.[0]?.img || '' };

    const config = { ...brand, content: { ...brand.content, tiktoks, reddit } };
    await saveDeal({ slug, url: brand.sourceUrl || '', brandName: brand.name, config, status: 'published' });

    return Response.json({ slug, path: `/${slug}` });
  } catch (e) {
    return Response.json({ error: e.message || 'publish failed' }, { status: 500 });
  }
}
