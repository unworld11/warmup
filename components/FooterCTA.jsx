import { WarmupMark } from './logos';

// Closing band: Rausch gradient, the "reply and we start" ask, honest sign-off
// that everything here was made for them this week.
export default function FooterCTA({ brand }) {
  const c = brand.cta;
  return (
    <section className="wm-cta" id="book">
      <div className="wm-wrap wm-cta-inner">
        <h2 className="wm-cta-h">{c.headline}</h2>
        <p className="wm-cta-sub">{c.sub}</p>
        <a href="#" className="wm-pill wm-pill-white wm-pill-lg">{c.button}</a>
      </div>
      <footer className="wm-footer">
        <span>Made for {brand.name}, this week.</span>
        <span className="wm-footer-mark"><WarmupMark /></span>
      </footer>
    </section>
  );
}
