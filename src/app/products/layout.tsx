import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop Suits & Kurtis | Darshan Style Hub - Jaipur',
  description: 'Browse our collection of designer suits and kurtis. Anarkali suits, salwar kameez, cotton kurtis, embroidered kurtis. Free shipping on orders above ₹999.',
  openGraph: {
    title: 'Shop Suits & Kurtis | Darshan Style Hub',
    description: 'Browse designer suits and kurtis. Free shipping on orders above ₹999.',
    url: 'https://www.darshanstylehub.com/products',
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
