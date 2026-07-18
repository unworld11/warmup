import { Manrope } from 'next/font/google';
import './globals.css';

// Manrope: a free geometric sans chosen as a deliberate stand-in for Airbnb Cereal
// (proprietary). Rounded, even, closed apertures — it carries the "feels like them" load.
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
});

export const metadata = {
  title: 'Prepared for you',
  description: 'A content engine proposal.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>{children}</body>
    </html>
  );
}
