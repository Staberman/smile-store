import type { Metadata } from "next";
import FaqSection from "@/components/brand/FaqSection";
import JsonLd from "@/components/seo/JsonLd";
import { allProducts } from "@/lib/catalog";
import { collectionSchema } from "@/lib/seo";
import TiendaClient from "./TiendaClient";

export const metadata: Metadata = {
  title: "Tienda online de relojes y lentes premium",
  description:
    "Compra relojes y lentes premium en Smile Argentina. Catalogo actualizado con Tommy Hilfiger, Invicta, Ray-Ban, OMEGA x Swatch y marcas premium.",
  alternates: {
    canonical: "/tienda",
  },
  openGraph: {
    title: "Tienda online de relojes y lentes premium",
    description:
      "Catalogo actualizado de relojes, lentes de sol y accesorios premium en Argentina.",
    url: "/tienda",
    type: "website",
    locale: "es_AR",
    siteName: "Smile",
  },
};

const tiendaSchema = collectionSchema(
  "/tienda",
  "Tienda online de relojes y lentes premium",
  allProducts,
);

export default function TiendaPage() {
  return (
    <>
      <JsonLd data={tiendaSchema} />
      <h1 className="sr-only">
        Tienda Smile: relojes y lentes premium en Argentina
      </h1>
      <TiendaClient />
      <FaqSection />
    </>
  );
}
