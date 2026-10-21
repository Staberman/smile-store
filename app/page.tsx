import type { Metadata } from "next";
import FaqSection from "@/components/brand/FaqSection";
import RecentlyViewed from "@/components/product/RecentlyViewed";
import JsonLd from "@/components/seo/JsonLd";
import StoreShell from "@/components/store/StoreShell";
import TiendaClient from "@/components/store/TiendaClient";
import { allProducts } from "@/lib/catalog";
import { SITE_OPEN_GRAPH, SITE_TWITTER, collectionSchema } from "@/lib/seo";

const HOME_TITLE = "Anteojos de sol y relojes originales en Argentina";
const HOME_SOCIAL_TITLE = `${HOME_TITLE} | Smile`;
const HOME_SOCIAL_DESCRIPTION =
  "Anteojos de sol y lentes originales, relojes y accesorios premium en Argentina. Invicta, Ray-Ban y Tommy Hilfiger con checkout seguro.";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description:
    "Comprá anteojos de sol y lentes originales, relojes y accesorios premium en Argentina. Modelos seleccionados de Invicta, Ray-Ban y Tommy Hilfiger con checkout seguro.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    ...SITE_OPEN_GRAPH,
    url: "/",
    title: HOME_SOCIAL_TITLE,
    description: HOME_SOCIAL_DESCRIPTION,
  },
  twitter: {
    ...SITE_TWITTER,
    title: HOME_SOCIAL_TITLE,
    description: HOME_SOCIAL_DESCRIPTION,
  },
};

const homeCollectionSchema = collectionSchema("/", HOME_TITLE, allProducts);

export default function Home() {
  return (
    <StoreShell>
      <JsonLd data={homeCollectionSchema} />
      <h1 className="sr-only">{HOME_TITLE}</h1>
      <TiendaClient />
      <RecentlyViewed />
      <FaqSection />
    </StoreShell>
  );
}
