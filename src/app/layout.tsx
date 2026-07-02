import type { Metadata, Viewport } from 'next';
import { Outfit, Playfair_Display } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import StoreShell from '@/components/StoreShell';
import GoogleAnalytics from '@/components/GoogleAnalytics';

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

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  verification: {
    google: 'aAIzpAVGb9_p9G2OoyKoI2odZACHWO71ocFiMTqlktU',
  },
  title: 'Darshan Style Hub™ | Designer Suits & Co Ord Sets in Jaipur',
  description: 'Darshan Style Hub™ - Your trusted destination in Jaipur for premium designer suits and co ord sets. Shop Anarkali suits, salwar suits, printed co ord sets, embroidered co ord sets and more.',
  keywords: ['suits', 'co ord sets', 'women ethnic wear', 'Anarkali suits', 'salwar kameez', 'co ord sets for women', 'designer co ord sets', 'Jaipur fashion', 'Darshan Style Hub'],
  icons: {
    icon: '/products/logo.jpeg',
    shortcut: '/products/logo.jpeg',
    apple: '/products/logo.jpeg',
  },
  openGraph: {
    title: 'Darshan Style Hub™ | Designer Suits & Co Ord Sets in Jaipur',
    description: 'Your trusted destination in Jaipur for premium designer suits and co ord sets. Shop Anarkali suits, salwar suits, printed co ord sets, embroidered co ord sets and more.',
    url: 'https://www.darshanstylehub.com',
    siteName: 'Darshan Style Hub™',
    images: [
      {
        url: 'https://www.darshanstylehub.com/products/logo.jpeg',
        width: 800,
        height: 800,
        alt: 'Darshan Style Hub - Designer Suits & Co Ord Sets',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${playfair.variable}`}>
      <head>
        <meta name="facebook-domain-verification" content="qy5yj0z1grhtj55l2r97bdlf8sofiw" />
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '3141261462728297');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img height="1" width="1" style={{display:'none'}}
            src="https://www.facebook.com/tr?id=3141261462728297&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </head>
      <body className="font-body bg-[#FFF8E6] text-gray-900 antialiased overflow-x-hidden w-full">
        <GoogleAnalytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': ['Organization', 'OnlineStore'],
            name: 'Darshan Style Hub',
            url: 'https://www.darshanstylehub.com',
            logo: 'https://www.darshanstylehub.com/products/logo.jpeg',
            description: 'Designer suits and co ord sets for women in Jaipur. Premium ethnic wear with free shipping across India.',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Plot No. B-11, Shri Ram Vihar-B, Shri Kishanpura, Sanganer',
              addressLocality: 'Jaipur',
              addressRegion: 'Rajasthan',
              postalCode: '302017',
              addressCountry: 'IN',
            },
            telephone: '+919019076335',
            email: 'darshanstylehub.business@gmail.com',
            sameAs: [
              'https://www.instagram.com/darshanstylehub',
            ],
            hasMerchantReturnPolicy: {
              '@type': 'MerchantReturnPolicy',
              applicableCountry: 'IN',
              returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
              merchantReturnDays: 7,
              returnMethod: 'https://schema.org/ReturnByMail',
              returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
              itemDefectReturnFees: 'https://schema.org/FreeReturn',
            },
          }) }}
        />
        <div className="w-full max-w-[100vw]">
          <StoreShell>
            {children}
          </StoreShell>
        </div>
      </body>
    </html>
  );
}

