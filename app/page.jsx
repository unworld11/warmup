import Link from 'next/link';
import { allBrandSlugs, getBrand } from '../brands';

// Internal index — lists the brands currently staged. Each deal is a route.
export default function Home() {
  const slugs = allBrandSlugs();
  return (
    <main style={{ maxWidth: 640, margin: '80px auto', padding: '0 24px', fontFamily: 'var(--font-manrope), system-ui' }}>
      <p style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 12, color: '#888', fontWeight: 700 }}>
        warmup · staged pages
      </p>
      <h1 style={{ fontSize: 34, fontWeight: 800, margin: '8px 0 24px' }}>Pipeline</h1>
      <div style={{ display: 'grid', gap: 12 }}>
        {slugs.map((slug) => {
          const b = getBrand(slug);
          return (
            <Link
              key={slug}
              href={`/${slug}`}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '18px 20px', border: '1px solid #e6e6e6', borderRadius: 16,
                textDecoration: 'none', color: '#222',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 18 }}>{b.name}</span>
              <span style={{ color: '#888', fontSize: 14 }}>/{slug} →</span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
