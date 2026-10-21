import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import FavoritosClient from "./FavoritosClient";

export const metadata: Metadata = {
  title: "Favoritos",
  description:
    "Tus productos guardados en Smile: relojes, lentes y accesorios que marcaste como favoritos.",
  // User-specific, client-side list — nothing to index.
  robots: { index: false, follow: false },
};

export default function FavoritosPage() {
  return (
    <>
      <Header />
      <FavoritosClient />
      <Footer />
    </>
  );
}
