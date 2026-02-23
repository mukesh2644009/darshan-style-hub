import type { Metadata } from 'next';
import { Outfit, Playfair_Display } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartSidebar from '@/components/CartSidebar';
import WhatsAppButton from '@/components/WhatsAppButton';

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Darshan Style Hub | Designer Suits & Co Ord Sets in Jaipur',
  description: 'Darshan Style Hub - Your trusted destination in Jaipur for premium designer suits and co ord sets. Shop Anarkali suits, salwar suits, printed co ord sets, embroidered co ord sets and more.',
  keywords: ['suits', 'co ord sets', 'women ethnic wear', 'Anarkali suits', 'salwar kameez', 'co ord sets for women', 'designer co ord sets', 'Jaipur fashion', 'Darshan Style Hub'],
  icons: {
    icon: '/products/logo.jpeg',
    shortcut: '/products/logo.jpeg',
    apple: '/products/logo.jpeg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${playfair.variable}`}>
      <body className="font-body bg-accent-50 text-gray-900 antialiased">
        <Navbar />
        <CartSidebar />
        <main className="min-h-screen pt-[104px]">
          {children}
        </main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}

