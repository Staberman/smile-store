"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const slides = [
  {
    id: 1,
    eyebrow: "Nueva temporada",
    title: "Estilo que se siente.\nPresencia que se nota.",
    description:
      "Una selección pensada para quienes entienden que el lujo moderno no necesita exceso: necesita identidad, forma y carácter.",
    image:
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1800&q=80",
    primaryCta: "Descubrir la selección",
    secondaryCta: "Ir a tienda",
  },
  {
    id: 2,
    eyebrow: "Lentes & Accesorios",
    title: "La mirada también\ncomunica quién eres.",
    description:
      "Lentes y accesorios con una dirección visual limpia, aspiracional y precisa, construidos para acompañar presencia y estilo personal.",
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1800&q=80",
    primaryCta: "Explorar la campaña",
    secondaryCta: "Ir a tienda",
  },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6500);
    return () => clearInterval(interval);
  }, []);

  const current = slides[currentSlide];

  return (
    <section className="relative mb-24 h-[96vh] w-full overflow-hidden md:mb-32">
      {/* Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1.12 }}
          exit={{ opacity: 0, scale: 1.06 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img
            src={current.image}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/48" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/82 via-black/38 to-black/8" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-6 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${current.id}`}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.6 }}
              className="mb-6 text-[10px] uppercase tracking-[0.46em] text-white/45"
            >
              {current.eyebrow}
            </motion.p>

            <h1 className="font-display whitespace-pre-line text-[3.4rem] font-light italic leading-[0.93] tracking-[-0.01em] text-white md:text-[5.2rem] lg:text-[6.2rem]">
              {current.title}
            </h1>

            <p className="mt-7 max-w-lg text-sm leading-[1.85] text-white/68 md:text-[15px]">
              {current.description}
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#colecciones"
                className="cursor-pointer rounded-full bg-white px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-black transition hover:opacity-88"
              >
                {current.primaryCta}
              </a>

              <a
                href="/tienda"
                className="cursor-pointer rounded-full border border-white/25 px-7 py-3 text-[11px] uppercase tracking-[0.22em] text-white transition hover:border-white hover:bg-white hover:text-black"
              >
                {current.secondaryCta}
              </a>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-8 left-0 right-0 z-20 mx-auto flex max-w-7xl items-end justify-between px-6">
        {/* Slide indicators */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlide(index)}
                className={`cursor-pointer h-[2px] rounded-full transition-all duration-500 ${
                  index === currentSlide ? "w-10 bg-white" : "w-3 bg-white/28"
                }`}
                aria-label={`Ir al slide ${index + 1}`}
              />
            ))}
          </div>
          <span className="font-display text-[11px] italic text-white/32">
            {String(currentSlide + 1).padStart(2, "0")} /{" "}
            {String(slides.length).padStart(2, "0")}
          </span>
        </div>

        {/* Scroll indicator */}
        <div className="flex flex-col items-center gap-2.5">
          <p className="text-[9px] uppercase tracking-[0.44em] text-white/30">
            Scroll
          </p>
          <div className="h-10 w-px overflow-hidden bg-white/14">
            <div className="h-full w-full bg-white animate-scrollLine" />
          </div>
        </div>
      </div>
    </section>
  );
}
