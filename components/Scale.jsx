// "How it runs" — the engine behind the content, as a real four-step loop plus a
// tight proof strip. Meaningful process, their design language, not a stat dump.
export default function Scale({ brand }) {
  const s = brand.scale;
  return (
    <section className="wm-section wm-how" id="how">
      <div className="wm-wrap">
        <h2 className="wm-h2 wm-h2-center">{s.heading}</h2>
        <p className="wm-lead wm-lead-center">{s.lead}</p>

        <div className="wm-steps">
          {s.steps.map((st) => (
            <article key={st.n} className="wm-step">
              <div className="wm-step-n">{st.n}</div>
              <div>
                <h3 className="wm-step-title">{st.title}</h3>
                <p className="wm-step-detail">{st.detail}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="wm-strip">
          {s.stats.map((st, i) => (
            <div key={i} className="wm-strip-item">
              <span className="wm-strip-value">{st.value}</span>
              <span className="wm-strip-label">{st.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
