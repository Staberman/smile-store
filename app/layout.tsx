import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import WhatsAppClickTracker from "@/components/analytics/WhatsAppClickTracker";
import WhatsAppFloatingButton from "@/components/contact/WhatsAppFloatingButton";
import SessionOfferPopup from "@/components/promo/SessionOfferPopup";
import SiteSearchProvider from "@/components/search/SiteSearchProvider";
import JsonLd from "@/components/seo/JsonLd";
import { TITLE_SUFFIX } from "@/lib/product-seo.mjs";
import { featuredSearchRows } from "@/lib/search-featured";
import {
  ORGANIZATION_ID,
  organizationSchema,
  SITE_NAME,
  SITE_OPEN_GRAPH,
  SITE_TWITTER,
  SITE_URL,
} from "@/lib/seo";
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
    template: `%s${TITLE_SUFFIX}`,
  },
  description:
    "Tienda online de anteojos de sol, relojes y accesorios premium en Argentina. Descubrí modelos de Ray-Ban, Invicta, Tommy Hilfiger y marcas premium.",
  // No site-wide canonical: every indexable page declares its own, and
  // noindex pages (favoritos, probar-ar, 404) must not point to the homepage.
  openGraph: {
    ...SITE_OPEN_GRAPH,
    url: SITE_URL,
    title: "Smile | Relojes, lentes y accesorios premium en Argentina",
    description:
      "Tienda online de relojes, lentes y accesorios premium en Argentina.",
  },
  twitter: {
    ...SITE_TWITTER,
    title: "Smile | Relojes, lentes y accesorios premium en Argentina",
    description:
      "Tienda online de relojes, lentes y accesorios premium en Argentina.",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    organizationSchema(),
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "es-AR",
      publisher: {
        "@id": ORGANIZATION_ID,
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
        {/* The header search button of every page opens this overlay. */}
        <SiteSearchProvider featured={featuredSearchRows}>{children}</SiteSearchProvider>
        <WhatsAppFloatingButton />
        <SessionOfferPopup />
        <Analytics />
        <WhatsAppClickTracker />
      </body>
    </html>
  );
}
