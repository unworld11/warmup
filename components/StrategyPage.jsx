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
    '--radius': t.radius,
    '--radius-lg': t.radiusLg,
    '--brand-font': t.font,
  };
  return (
    <div style={vars} className="wm-root">
      <Nav brand={brand} />
      <Hero brand={brand} />
      <Research brand={brand} />
      <ContentFeed brand={brand} />
      <Scale brand={brand} />
      <FooterCTA brand={brand} />
    </div>
  );
}
