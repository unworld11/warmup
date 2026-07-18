// "What we saw" — proof we actually studied them. Airbnb-style rounded cards,
// hairline border, subtle hover lift. Big stat / hook per card, then the read.
export default function Research({ brand }) {
  const r = brand.research;
  return (
    <section className="wm-section" id="research">
      <div className="wm-wrap">
        <h2 className="wm-h2">{r.heading}</h2>
        <p className="wm-lead">{r.lead}</p>
        <div className="wm-cards">
          {r.insights.map((it, i) => (
            <article key={i} className="wm-card">
              <div className="wm-card-stat">{it.stat}</div>
              <h3 className="wm-card-title">{it.title}</h3>
              <p className="wm-card-detail">{it.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
