import type { Metadata } from "next";
import Header from "../components/layout/Header";
import Hero from "../components/sections/Hero";
import BenefitsStrip from "../components/sections/BenefitsStrip";
import Collections from "../components/sections/Collections";
import Experience from "../components/sections/Experience";
import RecentlyViewed from "../components/product/RecentlyViewed";
import Footer from "../components/layout/Footer";

export const metadata: Metadata = {
  title: "Anteojos de sol y relojes originales en Argentina",
  description:
    "Comprá anteojos de sol y lentes originales, relojes y accesorios premium en Argentina. Modelos seleccionados de Invicta, Ray-Ban y Tommy Hilfiger con checkout seguro.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "/",
    title: "Anteojos de sol y relojes originales en Argentina | Smile",
    description:
      "Anteojos de sol y lentes originales, relojes y accesorios premium en Argentina. Invicta, Ray-Ban y Tommy Hilfiger con checkout seguro.",
  },
};

export default function Home() {
  return (
    <main className="bg-black text-white">
      <h1 className="sr-only">
        Anteojos de sol y relojes originales en Argentina
      </h1>
      <Header />
      <Hero />
      <BenefitsStrip />
      <Collections />
      <Experience />
      <RecentlyViewed />
      <Footer />
    </main>
  );
}