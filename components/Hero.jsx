import { PhoneMini } from './ContentFeed';

// Hero in their design language: big Manrope headline, muted sub, Rausch gradient
// primary + quiet secondary. A tilted phone teases the content to come.
export default function Hero({ brand }) {
  const h = brand.hero;
  const teaser = brand.content.tiktoks[0];
  return (
    <section className="wm-hero">
      <div className="wm-hero-inner">
        <div className="wm-hero-copy">
          <p className="wm-eyebrow">
            {brand.prepared.eyebrow} <span className="wm-eyebrow-brand">{brand.name}</span>
          </p>
          <h1 className="wm-hero-h1">{h.headline}</h1>
          <p className="wm-hero-sub">{h.sub}</p>
          <div className="wm-hero-actions">
            <a href="#work" className="wm-pill wm-pill-grad wm-pill-lg">{h.ctaPrimary}</a>
            <a href={brand.bookingUrl} className="wm-pill wm-pill-ghost wm-pill-lg" target="_blank" rel="noopener noreferrer">{h.ctaSecondary}</a>
          </div>
          <p className="wm-hero-note">{brand.prepared.note}</p>
        </div>
        <div className="wm-hero-art">
          <div className="wm-hero-phone">
            <PhoneMini tiktok={teaser} />
          </div>
        </div>
      </div>
    </section>
  );
}
