'use client';

import { useState } from 'react';
import s from './studio.module.css';

const STEPS = [
  { key: 'research', label: 'Research' },
  { key: 'study', label: 'Study' },
  { key: 'image', label: 'Imagery' },
  { key: 'page', label: 'Design' },
];
const CHIPS = ['airbnb.com', 'spotify.com', 'nike.com', 'glossier.com'];
const FAILED = ['FAILED', 'CRASHED', 'CANCELED', 'SYSTEM_FAILURE', 'INTERRUPTED', 'TIMED_OUT', 'EXPIRED'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Generate() {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState('');
  const [detail, setDetail] = useState('');
  const [site, setSite] = useState(null);
  const [config, setConfig] = useState(null);
  const [html, setHtml] = useState('');
  const [refineText, setRefineText] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [liveUrl, setLiveUrl] = useState('');

  async function post(path, body) {
    const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : {}; } catch { throw new Error(res.status === 504 ? 'That step timed out. Try again.' : `Server error (${res.status}).`); }
    if (!res.ok || json.error) throw new Error(json.error || `Request failed (${res.status})`);
    return json;
  }

  async function pollRun(runId) {
    for (;;) {
      await sleep(2000);
      let j;
      try {
        const res = await fetch(`/api/run/${runId}`);
        j = await res.json();
      } catch { continue; }
      if (j.error) throw new Error(j.error);
      if (j.metadata) { setPhase(j.metadata.phase || ''); setDetail(j.metadata.detail || ''); }
      if (j.status === 'COMPLETED') return j.output;
      if (FAILED.includes(j.status)) throw new Error(j.error || `Generation failed (${j.status}).`);
    }
  }

  async function run(e, forced) {
    if (e) e.preventDefault();
    const target = (forced || url).trim();
    if (!target) return;
    if (forced) setUrl(forced);
    setError(''); setHtml(''); setConfig(null); setLiveUrl(''); setBusy(true); setPhase('research'); setDetail('Starting the run…');
    try {
      const { runId } = await post('/api/generate', { url: target });
      const out = await pollRun(runId);
      if (!out) throw new Error('The run finished without output.');
      setSite(out.site); setConfig(out.config);
      if (!out.html) throw new Error(out.htmlError ? `Page render failed: ${out.htmlError}` : 'The page did not render. Try Generate again.');
      setHtml(out.html);
      setPhase(''); setDetail('');
    } catch (err) {
      setError(err.message || 'something went wrong');
    } finally {
      setBusy(false);
    }
  }

  async function refine() {
    if (!refineText.trim() || !html) return;
    setError(''); setBusy(true); setLiveUrl('');
    try {
      const { html: revised } = await post('/api/refine-page', { html, instruction: refineText.trim() });
      if (revised) setHtml(revised);
      setRefineText('');
    } catch (err) {
      setError(err.message || 'refine failed');
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    setPublishing(true); setError('');
    try {
      const { path } = await post('/api/publish', { html, name: config?.name || site?.name || 'brand', sourceUrl: url.trim() });
      setLiveUrl(path);
    } catch (err) {
      setError(err.message || 'publish failed');
    } finally {
      setPublishing(false);
    }
  }

  const activeIndex = phase === 'done' ? STEPS.length : STEPS.findIndex((st) => st.key === phase);

  return (
    <div className={s.wrap}>
      <header className={s.bar}>
        <div className={s.barInner}>
          <span className={s.logo}><span className={s.logoDot} />warmup studio</span>
          {html && (
            <form className={s.form} onSubmit={run}>
              <input className={s.input} value={url} onChange={(e) => setUrl(e.target.value)} disabled={busy} placeholder="new prospect url…" />
              <button className={s.gen} type="submit" disabled={busy}>{busy ? 'Working…' : 'Generate'}</button>
            </form>
          )}
        </div>
      </header>

      {/* empty state */}
      {!html && !busy && (
        <section className={s.hero}>
          <div className={s.glow} />
          <div className={s.heroInner}>
            <p className={s.eyebrow}>warmup studio</p>
            <h1 className={s.h1}>One URL in. A page they can’t ignore out.</h1>
            <p className={s.sub}>Paste a prospect’s site. We pull their real TikTok and Reddit posts, study what actually works for them, and generate a content proposal in their own design language. Refine it in plain english, then publish it live.</p>
            <form className={s.bigForm} onSubmit={run}>
              <input className={s.bigInput} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="paste a website url, e.g. airbnb.com" autoFocus />
              <button className={s.bigGen} type="submit">Generate</button>
            </form>
            <div className={s.chips}>
              <span className={s.chipLabel}>try</span>
              {CHIPS.map((c) => <span key={c} className={s.chip} onClick={() => run(null, c)}>{c}</span>)}
            </div>
            {error && <p className={s.error} style={{ textAlign: 'center' }}>⚠ {error}</p>}
            <div className={s.features}>
              <span className={s.feature}><span className={s.featureDot}>●</span> Reads their real posts</span>
              <span className={s.feature}><span className={s.featureDot}>●</span> In their design language</span>
              <span className={s.feature}><span className={s.featureDot}>●</span> Publish in one click</span>
            </div>
          </div>
        </section>
      )}

      {/* generating */}
      {!html && busy && (
        <section className={s.progress}>
          <div className={s.steps}>
            {STEPS.map((st, i) => (
              <div key={st.key} className={s.step}>
                {i > 0 && <span className={`${s.line} ${i <= activeIndex ? s.lineDone : ''}`} />}
                <span className={`${s.dot} ${i === activeIndex ? s.dotActive : ''} ${i < activeIndex ? s.dotDone : ''}`}>
                  {i < activeIndex ? '✓' : i + 1}
                </span>
                <span className={`${s.stepLabel} ${i <= activeIndex ? s.stepLabelOn : ''}`}>{st.label}</span>
              </div>
            ))}
          </div>
          <p className={s.statusText}>{detail || 'Working…'}</p>
          {error && <p className={s.error} style={{ textAlign: 'center' }}>⚠ {error}</p>}
        </section>
      )}

      {/* result */}
      {html && (
        <>
          <div className={s.toolbar}>
            <div className={s.toolbarInner}>
              <div className={s.refineWrap}>
                <span className={s.refineIcon}>✦</span>
                <input className={s.refineInput} value={refineText} disabled={busy}
                  onChange={(e) => setRefineText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') refine(); }}
                  placeholder="refine in plain english, e.g. make the hero punchier, lean into their newest campaign" />
              </div>
              <button className={s.refineBtn} onClick={refine} disabled={busy || !refineText.trim()}>Refine</button>
              {busy && <span className={s.refiningPill}><span className={s.spin} /> refining</span>}
              {liveUrl ? (
                <a className={s.liveLink} href={liveUrl} target="_blank" rel="noopener noreferrer">✓ Live at {liveUrl} →</a>
              ) : (
                <button className={s.publishBtn} onClick={publish} disabled={publishing || busy}>{publishing ? 'Publishing…' : 'Publish live'}</button>
              )}
            </div>
            {error && <p className={s.error}>⚠ {error}</p>}
          </div>
          <iframe className={s.frame} title="preview" srcDoc={html} sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox" />
        </>
      )}
    </div>
  );
}
