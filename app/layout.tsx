import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import WhatsAppFloatingButton from "@/components/contact/WhatsAppFloatingButton";
import SessionOfferPopup from "@/components/promo/SessionOfferPopup";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Smile | Relojes, lentes y accesorios premium en Argentina",
    template: "%s | Smile",
  },
  description:
    "Tienda online de relojes, lentes y accesorios premium en Argentina. Descubre modelos seleccionados de Invicta, Ray-Ban y Tommy Hilfiger.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Smile | Relojes, lentes y accesorios premium en Argentina",
    description:
      "Tienda online de relojes, lentes y accesorios premium en Argentina.",
    images: [
      {
        url: "/images/card-relojes.jpg",
        width: 1152,
        height: 603,
        alt: "Smile | Relojes, lentes y accesorios premium en Argentina",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Smile | Relojes, lentes y accesorios premium en Argentina",
    description:
      "Tienda online de relojes, lentes y accesorios premium en Argentina.",
    images: ["/images/card-relojes.jpg"],
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/images/smile-logo.svg`,
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+54 9 341 261 3504",
        contactType: "customer service",
        areaServed: "AR",
        availableLanguage: "Spanish",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "es-AR",
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" className={`${cormorant.variable} ${inter.variable}`}>
      <body>
        <JsonLd data={websiteSchema} />
        {children}
        <WhatsAppFloatingButton />
        <SessionOfferPopup />
      </body>
    </html>
  );
}
