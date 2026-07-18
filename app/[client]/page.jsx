import { notFound } from 'next/navigation';
import { getBrand, allBrandSlugs } from '../../brands';
import StrategyPage from '../../components/StrategyPage';

export function generateStaticParams() {
  return allBrandSlugs().map((client) => ({ client }));
}

export function generateMetadata({ params }) {
  const brand = getBrand(params.client);
  return {
    title: brand ? `${brand.name} × a content engine` : 'Prepared for you',
    robots: { index: false, follow: false },
  };
}

export default function ClientPage({ params }) {
  const brand = getBrand(params.client);
  if (!brand) notFound();
  return <StrategyPage brand={brand} />;
}
