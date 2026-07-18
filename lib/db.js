// Persistence layer, server-only. Reuses orca's Supabase via SUPABASE_URL +
// SUPABASE_SECRET_KEY. The service key bypasses RLS, so all reads/writes here
// are trusted server code.
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'warmup-content';

function client() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Supabase env not set (SUPABASE_URL / SUPABASE_SECRET_KEY)');
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
