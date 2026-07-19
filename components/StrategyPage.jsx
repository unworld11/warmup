import Nav from './Nav';
import Hero from './Hero';
import Research from './Research';
import ContentFeed from './ContentFeed';
import Scale from './Scale';
import FooterCTA from './FooterCTA';

// Themes the whole page from the brand's tokens via CSS custom properties, then
// composes the sections. Swapping the brand swaps the entire look.
export default function StrategyPage({ brand }) {
  const t = brand.tokens;
  const vars = {
    '--red': t.red,
    '--red-dark': t.redDark,
    '--gradient': t.gradient,
    '--ink': t.ink,
    '--muted': t.muted,
    '--line': t.line,
    '--surface': t.surface,
    '--bg': t.bg,
    // theming tokens that let one template render light (Airbnb) and dark (Spotify) brands
    '--card': t.card || t.bg,
    '--nav-bg': t.navBg,
    '--on-accent': t.onAccent || '#fff',
    '--cta-bg': t.ctaBg || t.gradient,
    '--cta-text': t.ctaText || '#fff',
    '--radius': t.radius,
    '--radius-lg': t.radiusLg,
    '--brand-font': t.font,
  };
  // Load the brand's detected Google Font at render time (Next hoists <link> to head),
  // so we're not capped at the two preloaded faces.
  const gf = brand.googleFont;
  const fontHref = gf
    ? `https://fonts.googleapis.com/css2?family=${gf.trim().replace(/\s+/g, '+')}:wght@400;500;600;700;800&display=swap`
    : null;

  return (
    <div style={vars} className="wm-root">
      {fontHref && <link rel="stylesheet" href={fontHref} />}
      <Nav brand={brand} />
      <Hero brand={brand} />
      <Research brand={brand} />
      <ContentFeed brand={brand} />
      <Scale brand={brand} />
      <FooterCTA brand={brand} />
    </div>
  );
}
