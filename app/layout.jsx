import { Manrope, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

// Each brand names its own free stand-in for a proprietary face. Manrope stands in
// for Airbnb Cereal; Plus Jakarta Sans for Spotify Circular. Both load here; a
// brand's tokens.font picks which one carries the "feels like them" load.
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
});

export const metadata = {
  title: 'Prepared for you',
  description: 'A content engine proposal.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${manrope.variable} ${jakarta.variable}`}>
      <body>{children}</body>
    </html>
  );
}
