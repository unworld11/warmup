import { BrandLogo, WarmupMark } from './logos';

// Their nav shell — sticky, hairline bottom border, logo left, a Rausch pill right.
// Center links echo their real IA so it reads as an Airbnb surface.
export default function Nav({ brand }) {
  const links = ['Homes', 'Experiences', 'Services'];
  return (
    <header className="wm-nav">
      <div className="wm-nav-inner">
        <div className="wm-nav-left">
          <BrandLogo brand={brand} size={30} />
        </div>
        <nav className="wm-nav-center">
          {links.map((l) => (
            <span key={l} className="wm-nav-link">{l}</span>
          ))}
        </nav>
        <div className="wm-nav-right">
          <span className="wm-nav-cobrand"><WarmupMark /></span>
          <a href="#book" className="wm-pill wm-pill-solid">Book the call</a>
        </div>
      </div>
    </header>
  );
}
