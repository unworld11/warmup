import { BrandLogo } from './logos';

// This is OUR proposal's nav, in their design language — not a copy of their
// site's navigation. Their logo anchors it as made-for-them; the links jump to
// real sections; the button opens a real booking action.
export default function Nav({ brand }) {
  const links = [
    { label: 'The read', href: '#research' },
    { label: 'The work', href: '#work' },
    { label: 'How it runs', href: '#how' },
  ];
  return (
    <header className="wm-nav">
      <div className="wm-nav-inner">
        <div className="wm-nav-left">
          <BrandLogo brand={brand} size={28} />
          <span className="wm-nav-tag">content proposal</span>
        </div>
        <nav className="wm-nav-center">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="wm-nav-link">{l.label}</a>
          ))}
        </nav>
        <div className="wm-nav-right">
          <a href={brand.bookingUrl} className="wm-pill wm-pill-solid" target="_blank" rel="noopener noreferrer">
            Book a call
          </a>
        </div>
      </div>
    </header>
  );
}
