import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop Suits & Co Ord Sets | Darshan Style Hub - Jaipur',
  description: 'Browse our collection of designer suits and co ord sets. Anarkali suits, salwar kameez, printed co ord sets, embroidered co ord sets. Free shipping on orders above ₹999.',
  openGraph: {
    title: 'Shop Suits & Co Ord Sets | Darshan Style Hub',
    description: 'Browse designer suits and co ord sets. Free shipping on orders above ₹999.',
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
