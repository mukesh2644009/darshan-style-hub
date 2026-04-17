import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Style Journal | Darshan Style Hub™',
  description:
    'Tips on suits, co ord sets, kurtis & care — from Darshan Style Hub™ in Jaipur. Ideas for styling and looking after your ethnic wear.',
  openGraph: {
    title: 'Style Journal | Darshan Style Hub™',
    description: 'Styling tips, care guides, and ideas for ethnic and fusion wear.',
    url: 'https://www.darshanstylehub.com/blog',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
