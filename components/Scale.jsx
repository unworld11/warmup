// The distribution muscle, in a surface band so the numbers hit. Kept honest and
// specific rather than hypey — the scale is the point, not the adjectives.
export default function Scale({ brand }) {
  const s = brand.scale;
  return (
    <section className="wm-section wm-scale">
      <div className="wm-wrap">
        <h2 className="wm-h2 wm-h2-center">{s.heading}</h2>
        <p className="wm-lead wm-lead-center">{s.lead}</p>
        <div className="wm-stats">
          {s.stats.map((st, i) => (
            <div key={i} className="wm-stat">
              <div className="wm-stat-value">{st.value}</div>
              <div className="wm-stat-label">{st.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
