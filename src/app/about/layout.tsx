import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | Darshan Style Hub™ - Jaipur',
  description:
    'Darshan Style Hub™ — our story, mission, and commitment to designer suits, co ord sets, kurtis & tops from Jaipur.',
  openGraph: {
    title: 'About Us | Darshan Style Hub™',
    description: 'Learn about our Jaipur-based women’s ethnic wear brand and how we serve customers across India.',
    url: 'https://www.darshanstylehub.com/about',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
