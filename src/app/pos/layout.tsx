export const metadata = {
  title: 'Darshan Style Hub — POS',
  robots: { index: false, follow: false },
};

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {children}
    </div>
  );
}
