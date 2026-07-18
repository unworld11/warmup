'use client';

import { useEffect, useRef, useState } from 'react';

/* ------------------------------- icons ------------------------------- */
const Icon = {
  heart: (p) => (<svg viewBox="0 0 24 24" width={p.s} height={p.s} fill="currentColor"><path d="M12 21s-7.5-4.9-10-9.2C.6 9 1.4 5.7 4.3 4.7 6.4 4 8.5 4.9 12 8c3.5-3.1 5.6-4 7.7-3.3 2.9 1 3.7 4.3 2.3 7.1C19.5 16.1 12 21 12 21z" /></svg>),
  comment: (p) => (<svg viewBox="0 0 24 24" width={p.s} height={p.s} fill="currentColor"><path d="M12 3c5 0 9 3.4 9 7.6 0 4.2-4 7.6-9 7.6-1 0-2-.1-2.9-.4L4 20l1-3.4C3.1 15.2 3 13 3 10.6 3 6.4 7 3 12 3z" /></svg>),
  save: (p) => (<svg viewBox="0 0 24 24" width={p.s} height={p.s} fill="currentColor"><path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z" /></svg>),
  share: (p) => (<svg viewBox="0 0 24 24" width={p.s} height={p.s} fill="currentColor"><path d="M3 12l18-9-4 18-5-6-6 3 2-6z" /></svg>),
  music: (p) => (<svg viewBox="0 0 24 24" width={p.s} height={p.s} fill="currentColor"><path d="M9 18V6l10-2v10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" /></svg>),
  up: (p) => (<svg viewBox="0 0 24 24" width={p.s} height={p.s} fill="currentColor"><path d="M12 4l8 9h-5v7H9v-7H4z" /></svg>),
};

/* --------------------------- TikTok phone ---------------------------- */
export function Phone({ tiktok, compact = false }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = tiktok.slides.length;
  const timer = useRef(null);

  useEffect(() => {
    if (paused) return;
    timer.current = setInterval(() => setI((v) => (v + 1) % n), 3000);
    return () => clearInterval(timer.current);
  }, [paused, n]);

  const slide = tiktok.slides[i];
  const go = (dir) => setI((v) => (v + dir + n) % n);

  return (
    <div
      className={`wm-phone ${compact ? 'wm-phone-compact' : ''}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="wm-phone-screen">
        {/* slides */}
        {tiktok.slides.map((s, idx) => (
          <img key={idx} src={s.img} alt="" className="wm-slide-img" style={{ opacity: idx === i ? 1 : 0 }} />
        ))}
        <div className="wm-slide-scrim" />

        {/* progress segments */}
        <div className="wm-progress">
          {tiktok.slides.map((_, idx) => (
            <span key={idx} className={`wm-progress-seg ${idx === i ? 'on' : ''}`} onClick={() => setI(idx)} />
          ))}
        </div>

        {/* tap zones */}
        <button className="wm-tap wm-tap-l" aria-label="prev" onClick={() => go(-1)} />
        <button className="wm-tap wm-tap-r" aria-label="next" onClick={() => go(1)} />

        {/* overlay text */}
        <div className="wm-overlay">
          <div className="wm-overlay-main">{slide.overlay}</div>
          {slide.sub ? <div className="wm-overlay-sub">{slide.sub}</div> : null}
        </div>

        {/* right rail */}
        {!compact && (
          <div className="wm-rail">
            <img src={tiktok.avatarImg} alt="" className="wm-rail-avatar" />
            <div className="wm-rail-btn"><Icon.heart s={26} /><span>{tiktok.stats.likes}</span></div>
            <div className="wm-rail-btn"><Icon.comment s={26} /><span>{tiktok.stats.comments}</span></div>
            <div className="wm-rail-btn wm-rail-save"><Icon.save s={25} /><span>{tiktok.stats.saves}</span></div>
            <div className="wm-rail-btn"><Icon.share s={26} /><span>{tiktok.stats.shares}</span></div>
          </div>
        )}

        {/* bottom meta */}
        <div className="wm-phone-meta">
          <div className="wm-phone-handle">{tiktok.handle}</div>
          {!compact && <div className="wm-phone-caption">{tiktok.caption}</div>}
          <div className="wm-phone-music"><Icon.music s={13} /><span>{tiktok.music}</span></div>
        </div>
      </div>
    </div>
  );
}

export function PhoneMini({ tiktok }) {
  return <Phone tiktok={tiktok} compact />;
}

/* ----------------------------- Reddit -------------------------------- */
function Reddit({ r }) {
  return (
    <div className="wm-reddit">
      <div className="wm-reddit-vote">
        <Icon.up s={20} />
        <span className="wm-reddit-score">{r.upvotes}</span>
      </div>
      <div className="wm-reddit-body">
        <div className="wm-reddit-sub">
          <span className="wm-reddit-subname">{r.subreddit}</span>
          <span className="wm-reddit-dot">·</span>
          <span className="wm-reddit-meta">Posted by {r.author} · {r.posted}</span>
        </div>
        <div className="wm-reddit-row">
          <div>
            <h4 className="wm-reddit-title">{r.title}</h4>
            <p className="wm-reddit-text">{r.body}</p>
          </div>
          <img src={r.thumb} alt="" className="wm-reddit-thumb" />
        </div>
        <div className="wm-reddit-actions">
          <span><Icon.comment s={16} /> {r.commentCount} comments</span>
          <span><Icon.share s={16} /> Share</span>
          <span><Icon.save s={16} /> Save</span>
        </div>
        <div className="wm-reddit-comments">
          {r.comments.map((c, idx) => (
            <div key={idx} className={`wm-comment ${c.op ? 'op' : ''}`}>
              <div className="wm-comment-head">
                <span className="wm-comment-author">{c.author}{c.op ? ' · OP' : ''}</span>
                <span className="wm-comment-up"><Icon.up s={13} /> {c.up}</span>
              </div>
              <div className="wm-comment-text">{c.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --------------------------- the section ----------------------------- */
export default function ContentFeed({ brand }) {
  const c = brand.content;
  return (
    <section className="wm-section wm-feed" id="work">
      <div className="wm-wrap">
        <h2 className="wm-h2">{c.heading}</h2>
        <p className="wm-lead">{c.lead}</p>

        <div className="wm-phones">
          {c.tiktoks.map((t, idx) => (
            <div key={idx} className="wm-phone-col">
              <Phone tiktok={t} />
            </div>
          ))}
        </div>

        <div className="wm-reddit-wrap">
          <div className="wm-reddit-label">…and it doesn’t stop at TikTok</div>
          <Reddit r={c.reddit} />
        </div>
      </div>
    </section>
  );
}
