import { notFound } from 'next/navigation';
import { getBrand, allBrandSlugs } from '../../brands';
import { getPublishedDeal } from '../../lib/db';
import StrategyPage from '../../components/StrategyPage';

// Static demos (airbnb, spotify) prerender; published deals render on demand.
export function generateStaticParams() {
  return allBrandSlugs().map((client) => ({ client }));
}

// Resolve a slug: static registry first, then a published deal from the DB.
async function resolve(client) {
  const stat = getBrand(client);
  if (stat) return stat;
  try {
    const deal = await getPublishedDeal(client);
    return deal?.config || null;
  } catch (_) {
    return null;
  }
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
  return <StrategyPage brand={brand} />;
}
