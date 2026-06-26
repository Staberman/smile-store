import type { Metadata } from "next";
import TiendaClient from "./TiendaClient";

export const metadata: Metadata = {
  title: "Tienda online de relojes y lentes premium",
  description:
    "Compra relojes y lentes premium en Smile Argentina. Catalogo actualizado con Tommy Hilfiger, Invicta, Ray-Ban, OMEGA x Swatch y marcas premium.",
  alternates: {
    canonical: "/tienda",
  },
  openGraph: {
    title: "Tienda online de relojes y lentes premium | Smile",
    description:
      "Catalogo actualizado de relojes, lentes de sol y accesorios premium en Argentina.",
    url: "/tienda",
    type: "website",
    locale: "es_AR",
    siteName: "Smile",
  },
};

export default function TiendaPage() {
  return (
    <>
      <h1 className="sr-only">
        Tienda Smile: relojes y lentes premium en Argentina
      </h1>
      <TiendaClient />
    </>
  );
}
