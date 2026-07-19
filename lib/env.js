// Side-effect module: import this before anything that builds an auth header.
// It strips non-ASCII paste artifacts (stray bullets, smart quotes, hidden or
// zero-width characters) from every key env var IN PLACE, so no library can
// build an Authorization header with a byte > 255 (the ByteString crash).
const KEYS = [
  'OPENAI_API_KEY',
  'APIFY_API_TOKEN',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_URL',
  'SUPABASE_SECRET_KEY',
  'TRIGGER_SECRET_KEY',
  'TRIGGER_PROJECT_ID',
  'TRIGGER_ACCESS_TOKEN',
];

for (const k of KEYS) {
  const v = process.env[k];
  if (v) process.env[k] = v.replace(/[^\x21-\x7E]/g, '');
}

export {};
