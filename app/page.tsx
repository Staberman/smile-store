import Header from "../components/layout/Header";
import Hero from "../components/sections/Hero";
import Collections from "../components/sections/Collections";
import Experience from "../components/sections/Experience";
import Footer from "../components/layout/Footer";

export default function Home() {
  return (
    <main className="bg-black text-white">
      <Header />
      <Hero />
      <Collections />
      <Experience />
      <Footer />
    </main>
  );
}