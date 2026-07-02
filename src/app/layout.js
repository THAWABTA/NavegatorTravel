import "./globals.css";
import LenisProvider from "./providers/LenisProvider";
import DebugMeasurer from "@/components/DebugMeasurer";
import { Open_Sans } from 'next/font/google';

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL("https://yourdomain.com"), // TODO: set real production domain
  title: {
    default: "Navigator — Travel Beyond",
    template: "%s | Navigator — Travel Beyond",
  },
  description: "Cinematic travel and tourism experience. Discover the world through a new lens.",
  openGraph: {
    title: "Navigator — Travel Beyond",
    description: "Cinematic travel and tourism experience. Discover the world through a new lens.",
    url: "https://yourdomain.com", // TODO: set real production domain
    type: "website",
    images: [
      {
        url: "https://yourdomain.com/og-image.jpg", // TODO: set real production domain
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Navigator — Travel Beyond",
    description: "Cinematic travel and tourism experience. Discover the world through a new lens.",
    images: ["https://yourdomain.com/og-image.jpg"], // TODO: set real production domain
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "name": "Navigator Travel",
    "url": "https://yourdomain.com", // TODO: set real production domain
    "logo": "https://yourdomain.com/icon.svg", // TODO: set real production domain
    "image": "https://yourdomain.com/og-image.jpg", // TODO: set real production domain
  };

  return (
    <html lang="en" className={openSans.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <LenisProvider>
          {children}
          <DebugMeasurer />
        </LenisProvider>
      </body>
    </html>
  );
}
