import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Darshan Style Hub™ - Jaipur',
  description: 'Get in touch with Darshan Style Hub™. Visit us at Sitapura, Jaipur or contact via WhatsApp, email. We\'re here to help with your ethnic wear needs.',
  openGraph: {
    title: 'Contact Us | Darshan Style Hub™',
    description: 'Visit us at Sitapura, Jaipur or contact via WhatsApp. We\'re here to help.',
    url: 'https://www.darshanstylehub.com/contact',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
