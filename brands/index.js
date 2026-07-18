import { airbnb } from './airbnb';
import { spotify } from './spotify';

// Multi-tenant registry. A new deal = a new file here + a folder of generated
// content in /public/content/<slug>. No template changes. That's minutes-per-deal.
const REGISTRY = {
  airbnb,
  spotify,
};

export function getBrand(slug) {
  return REGISTRY[slug] || null;
}

export function allBrandSlugs() {
  return Object.keys(REGISTRY);
}

export { REGISTRY };
