'use client';

import { useState } from 'react';
import StrategyPage from '../../components/StrategyPage';

const FALLBACK_TOKENS = {
  red: '#1a1a1a', redDark: '#000000', gradient: 'linear-gradient(135deg,#333,#000)',
  ink: '#1a1a1a', muted: '#6a6a6a', line: '#e6e6e6', surface: '#f6f6f6', bg: '#ffffff',
  card: '#ffffff', navBg: 'rgba(255,255,255,0.92)', onAccent: '#ffffff',
  ctaBg: 'linear-gradient(135deg,#333,#000)', ctaText: '#ffffff',
  radius: '16px', radiusLg: '24px', font: 'var(--font-manrope), system-ui, sans-serif',
};
const BOOKING = 'mailto:you@yourteam.com?subject=Re%3A%20the%20page%20you%20built';

// Maps a synthesized config (image PROMPTS) + an image map into the shape
// StrategyPage renders (image URLs, avatars, reddit thumb).
function assemble(config, site, imgMap) {
  const tiktoks = (config.content?.tiktoks || []).map((t) => {
    const slides = (t.slides || []).map((s) => ({ img: imgMap[s.imagePrompt] || '', overlay: s.overlay || '', sub: s.sub || '' }));
    return { ...t, slides, avatarImg: slides[0]?.img || '' };
  });
  const r = config.content?.reddit || {};
  const [ti, si] = r.thumbFromSlide || [0, 0];
  const thumb = tiktoks[ti]?.slides?.[si]?.img || tiktoks[0]?.slides?.[0]?.img || '';
  return {
    name: config.name || site?.name || 'Brand',
    logo: '',
    bookingUrl: BOOKING,
    tokens: { ...FALLBACK_TOKENS, ...(config.tokens || {}) },
    prepared: config.prepared || { eyebrow: 'A content engine, proposed for', note: '' },
    hero: config.hero || {},
    research: config.research || { heading: '', lead: '', insights: [] },
    content: { heading: config.content?.heading || '', lead: config.content?.lead || '', tiktoks, reddit: { ...r, thumb } },
    scale: config.scale || { heading: '', lead: '', steps: [], stats: [] },
    cta: config.cta || {},
  };
}

const promptsOf = (config) => {
  const out = [];
  (config.content?.tiktoks || []).forEach((t) => (t.slides || []).forEach((s) => s.imagePrompt && out.push(s.imagePrompt)));
  return [...new Set(out)];
};

export default function Generate() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [brand, setBrand] = useState(null);
  const [site, setSite] = useState(null);
  const [config, setConfig] = useState(null);     // raw synthesis (has imagePrompts)
  const [imgMap, setImgMap] = useState({});        // imagePrompt -> data URL
  const [refineText, setRefineText] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [liveUrl, setLiveUrl] = useState('');

  async function post(path, body) {
    const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json;
  }

  // Generate images for any prompts not already in the map. Returns the merged map.
  async function ensureImages(cfg, existing) {
    const need = promptsOf(cfg).filter((p) => !existing[p]);
    if (!need.length) return existing;
    setStatus(`Generating ${need.length} content image${need.length > 1 ? 's' : ''}…`);
    const pairs = await Promise.all(need.map(async (p) => {
      try { const { dataUrl } = await post('/api/image', { prompt: p }); return [p, dataUrl]; }
      catch { return [p, '']; }
    }));
    return { ...existing, ...Object.fromEntries(pairs) };
  }

  async function run(e) {
    e.preventDefault();
    if (!url.trim()) return;
    setError(''); setBrand(null); setConfig(null); setImgMap({}); setLiveUrl(''); setBusy(true);
    try {
      setStatus('Researching their real posts…');
      const research = await post('/api/research', { url: url.trim() });
      setSite(research.site);

      setStatus(`Studying ${research.tiktok.length} posts and writing the week…`);
      const { config: cfg } = await post('/api/synthesize', research);

      const map = await ensureImages(cfg, {});
      setConfig(cfg); setImgMap(map);
      setBrand(assemble(cfg, research.site, map));
      setStatus('');
    } catch (err) {
      setError(err.message || 'something went wrong');
    } finally {
      setBusy(false);
    }
  }

  async function refine() {
    if (!refineText.trim() || !config) return;
    setError(''); setBusy(true); setLiveUrl('');
    try {
      setStatus('Refining with Sol…');
      const { config: revised } = await post('/api/refine', { config, instruction: refineText.trim() });
      const map = await ensureImages(revised, imgMap);
      setConfig(revised); setImgMap(map);
      setBrand(assemble(revised, site, map));
      setRefineText(''); setStatus('');
    } catch (err) {
      setError(err.message || 'refine failed');
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    setPublishing(true); setError('');
    try {
      const { path } = await post('/api/publish', { brand: { ...brand, sourceUrl: url.trim() } });
      setLiveUrl(path);
    } catch (err) {
      setError(err.message || 'publish failed');
    } finally {
      setPublishing(false);
    }
  }

  const inputStyle = { flex: 1, padding: '11px 14px', borderRadius: 10, border: '1px solid #ddd', fontSize: 15, outline: 'none' };

  return (
    <div style={{ fontFamily: 'var(--font-manrope), system-ui, sans-serif', color: '#1a1a1a' }}>
      <div style={{ borderBottom: '1px solid #eee', background: '#fff', position: 'sticky', top: 0, zIndex: 100 }}>
        <form onSubmit={run} style={{ maxWidth: 900, margin: '0 auto', padding: '16px 24px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: 12, color: '#888' }}>warmup</span>
          <input value={url} onChange={(e) => setUrl(e.target.value)} disabled={busy}
            placeholder="paste a prospect's website url, e.g. airbnb.com" style={inputStyle} />
          <button type="submit" disabled={busy}
            style={{ padding: '11px 20px', borderRadius: 999, border: 'none', background: busy ? '#bbb' : '#111', color: '#fff', fontWeight: 700, fontSize: 15, cursor: busy ? 'default' : 'pointer' }}>
            {busy ? 'Working…' : 'Generate'}
          </button>
        </form>
      </div>

      {(status || error) && (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '14px 24px' }}>
          {status && <p style={{ color: '#555', fontSize: 15 }}>⏳ {status}</p>}
          {error && <p style={{ color: '#c0143c', fontSize: 15 }}>⚠ {error}</p>}
        </div>
      )}

      {!brand && !status && !error && (
        <div style={{ maxWidth: 620, margin: '90px auto', padding: '0 24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 14px' }}>One URL in. A page they can’t ignore out.</h1>
          <p style={{ fontSize: 18, color: '#666', lineHeight: 1.6 }}>
            Paste a prospect’s site. We pull their real TikTok and Reddit posts, study what actually works for them, and generate a content proposal in their own design language, live. Then refine it in plain English and publish.
          </p>
        </div>
      )}

      {brand && (
        <div style={{ borderBottom: '1px solid #eee', background: '#fafafa' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '12px 24px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input value={refineText} onChange={(e) => setRefineText(e.target.value)} disabled={busy}
              onKeyDown={(e) => { if (e.key === 'Enter') refine(); }}
              placeholder="refine in plain english, e.g. make the hero punchier, lean into their World Cup push" style={inputStyle} />
            <button onClick={refine} disabled={busy || !refineText.trim()}
              style={{ padding: '9px 18px', borderRadius: 999, border: '1px solid #111', background: '#fff', color: '#111', fontWeight: 700, fontSize: 14, cursor: busy ? 'default' : 'pointer' }}>
              Refine
            </button>
            {liveUrl ? (
              <a href={liveUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 700, color: '#0a7d33', whiteSpace: 'nowrap' }}>
                ✓ Live at {liveUrl} →
              </a>
            ) : (
              <button onClick={publish} disabled={publishing || busy}
                style={{ padding: '9px 18px', borderRadius: 999, border: 'none', background: (publishing || busy) ? '#bbb' : '#0a7d33', color: '#fff', fontWeight: 700, fontSize: 14, cursor: (publishing || busy) ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
                {publishing ? 'Publishing…' : 'Publish live'}
              </button>
            )}
          </div>
        </div>
      )}

      {brand && <StrategyPage brand={brand} />}
    </div>
  );
}
