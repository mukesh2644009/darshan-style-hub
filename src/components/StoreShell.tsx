'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import CartSidebar from './CartSidebar';
import WhatsAppButton from './WhatsAppButton';
import CompareBar from './CompareBar';
import InactivityLogout from './InactivityLogout';
import NewsletterSection from './NewsletterSection';

export default function StoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStore = !pathname.startsWith('/admin') && !pathname.startsWith('/pos');
  const isCheckout = pathname === '/checkout';

  if (!isStore) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <CartSidebar />
      <main className="min-h-screen w-full pt-[84px] sm:pt-[104px]">
        {children}
      </main>
      {/* Hide "Join our family" newsletter on checkout — user is mid-purchase */}
      {!isCheckout && <NewsletterSection />}
      <Footer />
      <WhatsAppButton />
      <CompareBar />
      <InactivityLogout />
    </>
  );
}
