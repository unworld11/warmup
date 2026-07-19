import { notFound } from 'next/navigation';
import { getBrand } from '../../brands';
import { getPublishedDeal } from '../../lib/db';
import StrategyPage from '../../components/StrategyPage';

// Every slug resolves on demand so a freshly published deal shows immediately
// and always wins over a same-named static demo (e.g. a published airbnb deal
// must override the /airbnb demo).
export const dynamic = 'force-dynamic';

// Resolve a slug: a published deal from the DB first, then the static demo
// registry as a fallback.
async function resolve(client) {
  try {
    const deal = await getPublishedDeal(client);
    if (deal?.config) return deal.config;
  } catch (_) { /* fall through to static */ }
  return getBrand(client) || null;
}

export async function generateMetadata({ params }) {
  const brand = await resolve(params.client);
  return {
    title: brand ? `${brand.name} × a content engine` : 'Prepared for you',
    robots: { index: false, follow: false },
  };
}

export default async function ClientPage({ params }) {
  const brand = await resolve(params.client);
  if (!brand) notFound();
  // Published deals are a full bespoke HTML document; static demos use the template.
  if (brand.html) {
    return (
      <iframe
        title={brand.name || 'proposal'}
        srcDoc={brand.html}
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0 }}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      />
    );
  }
  return <StrategyPage brand={brand} />;
}
