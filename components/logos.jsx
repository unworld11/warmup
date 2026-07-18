// Brand marks. The Bélo is a clean recreation used for a sales mock; per-brand
// logos are selected by brand.logo. Our own mark stays small and subordinate.

export function Belo({ size = 32, color = '#FF385C' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill={color} aria-label="Airbnb" role="img">
      <path d="M16 1c-2.9 0-4.7 1.9-6.6 5.8C6.4 12.4 2 22 2 25.1 2 28 4.2 31 8 31c2 0 3.9-1 5.7-2.8.8-.8 1.5-1.6 2.3-2.5.8.9 1.5 1.7 2.3 2.5C20.1 30 22 31 24 31c3.8 0 6-3 6-5.9 0-3.1-4.4-12.7-7.4-18.3C20.7 2.9 18.9 1 16 1zm0 2.7c1.6 0 2.9 1.5 4.5 4.6 2.8 5.4 6.8 14.4 6.8 16.8 0 1.9-1.4 3.2-3.3 3.2-1.3 0-2.6-.7-4-2.1-.8-.8-1.6-1.7-2.4-2.6 2.2-2.8 3.9-5.7 3.9-8.3 0-2.9-2.1-5-4.9-5s-4.9 2.1-4.9 5c0 2.6 1.7 5.5 3.9 8.3-.8.9-1.6 1.8-2.4 2.6-1.4 1.4-2.7 2.1-4 2.1-1.9 0-3.3-1.3-3.3-3.2 0-2.4 4-11.4 6.8-16.8C13.1 5.2 14.4 3.7 16 3.7zm0 8c1.4 0 2.4 1.1 2.4 2.6 0 1.6-1 3.6-2.4 5.5-1.4-1.9-2.4-3.9-2.4-5.5 0-1.5 1-2.6 2.4-2.6z" />
    </svg>
  );
}

export function BrandLogo({ brand, size = 32 }) {
  if (brand.logo === 'belo') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <Belo size={size} color={brand.tokens.red} />
        <span style={{ fontSize: size * 0.78, fontWeight: 700, color: brand.tokens.red, letterSpacing: '-0.02em' }}>
          {brand.name.toLowerCase()}
        </span>
      </span>
    );
  }
  return <span style={{ fontSize: size * 0.7, fontWeight: 800, color: brand.tokens.red }}>{brand.name}</span>;
}

// Our own mark — deliberately quiet, so the page reads as theirs.
export function WarmupMark() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, opacity: 0.62 }}>
      <span
        style={{
          width: 8, height: 8, borderRadius: 999,
          background: 'currentColor', display: 'inline-block',
        }}
      />
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        warmup
      </span>
    </span>
  );
}
