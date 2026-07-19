// Persistence layer, server-only. Uses the warmup Supabase project via the
// publishable key (anon role). Access is governed by the RLS policies in
// supabase/warmup_deals.sql.
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'warmup-content';

// Strip paste artifacts (stray bullet, hidden char) so the key can't break the
// Authorization header the Supabase client builds.
const clean = (v) => (v || '').replace(/[^\x21-\x7E]/g, '');

function client() {
  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = clean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  if (!url || !key) throw new Error('Supabase env not set (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)');
  return createClient(url, key, { auth: { persistSession: false } });
}

export function slugify(name) {
  return (name || 'deal').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'deal';
}

// Upload a data-URL image to storage and return its public URL. Passes through
// anything that's already a URL.
export async function uploadDataUrl(dataUrl, pathNoExt) {
  if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl || '';
  const m = dataUrl.match(/^data:(image\/[\w+]+);base64,(.+)$/);
  if (!m) return '';
  const [, contentType, b64] = m;
  const ext = contentType.split('/')[1].replace('+xml', '');
  const path = `${pathNoExt}.${ext}`;
  const supa = client();
  const { error } = await supa.storage.from(BUCKET).upload(path, Buffer.from(b64, 'base64'), { contentType, upsert: true });
  if (error) throw new Error(`upload: ${error.message}`);
  return supa.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function saveDeal({ slug, url, brandName, config, status }) {
  const supa = client();
  const { data, error } = await supa
    .from('warmup_deals')
    .upsert({ slug, url, brand_name: brandName, config, status, updated_at: new Date().toISOString() }, { onConflict: 'slug' })
    .select()
    .single();
  if (error) throw new Error(`saveDeal: ${error.message}`);
  return data;
}

export async function getPublishedDeal(slug) {
  const supa = client();
  const { data } = await supa.from('warmup_deals').select('config,brand_name').eq('slug', slug).eq('status', 'published').maybeSingle();
  return data;
}
