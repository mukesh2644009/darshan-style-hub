'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { captureUTMs } from '@/lib/utm';
import Navbar from './Navbar';
import Footer from './Footer';
import CartSidebar from './CartSidebar';
import WhatsAppButton from './WhatsAppButton';
import CompareBar from './CompareBar';
import InactivityLogout from './InactivityLogout';

export default function StoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Capture UTMs on every navigation so they survive SPA route changes.
  // Stored in sessionStorage + localStorage for persistence across redirects.
  useEffect(() => { captureUTMs(); }, [pathname]);
  const isStore = !pathname.startsWith('/admin') && !pathname.startsWith('/pos');

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
      <Footer />
      <WhatsAppButton />
      <CompareBar />
      <InactivityLogout />
    </>
  );
}
