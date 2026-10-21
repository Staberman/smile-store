"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const items = [
  {
    num: "01",
    title: "Estilo y personalidad",
    description:
      "Cada línea se presenta desde una lógica visual y comercial más cercana a la moda que al simple listado de productos.",
  },
  {
    num: "02",
    title: "Presencia",
    description:
      "Relojes y lentes seleccionados para acompañar una imagen personal más sólida, segura y reconocible.",
  },
  {
    num: "03",
    title: "Estilo",
    description:
      "Smile organiza marcas y piezas dentro de una experiencia coherente, limpia y aspiracional.",
  },
  {
    num: "04",
    title: "Experiencia de compra",
    description:
      "Descubrí nuestro catálogo online. Navegá por marcas, encontrá tu modelo ideal y accedé a una experiencia simple y segura.",
  },
];

const videos = ["/videos/smile-glasses.mp4"];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18 } },
};

const item = {
  hidden: { opacity: 0, y: 56 },
  show: { opacity: 1, y: 0 },
};

export default function Experience() {
  const [activeVideo, setActiveVideo] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveVideo((prev) => (prev + 1) % videos.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#040404] px-6 py-28 text-white md:px-12 md:py-36">
      {/* Video background */}
      <div className="absolute inset-0 overflow-hidden">
        {videos.map((video, index) => (
          <video
            key={video}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1800ms] ${
              activeVideo === index ? "opacity-[0.32]" : "opacity-0"
            }`}
          >
            <source src={video} type="video/mp4" />
          </video>
        ))}
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/52 to-black/72" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.18 }}
        className="relative z-10 mx-auto max-w-7xl"
      >
        <motion.div variants={item} className="max-w-4xl">
          <p className="text-[10px] uppercase tracking-[0.42em] text-white/38">
            Smile Experience
          </p>

          <h2 className="font-display mt-5 text-[2.8rem] font-light italic leading-[0.94] md:text-[4.6rem]">
            Más que producto: una experiencia<br />visual con criterio.
          </h2>

          <p className="mt-6 max-w-2xl text-sm leading-[1.85] text-white/65 md:text-[15px]">
            La propuesta de Smile parte de la selección, la estética y la forma
            en que cada pieza acompaña la presencia personal.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="mt-14 grid gap-px overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-4">
          {items.map((card) => (
            <motion.article
              key={card.num}
              variants={item}
              className="bg-[#040404]/90 p-8 backdrop-blur-[2px] md:p-10"
            >
              <p className="font-display text-3xl font-light italic text-white/18">
                {card.num}
              </p>

              <h3 className="mt-5 text-base font-semibold uppercase tracking-[0.08em] text-white">
                {card.title}
              </h3>

              <p className="mt-4 text-sm leading-[1.85] text-white/60">
                {card.description}
              </p>
            </motion.article>
          ))}
        </div>

        {/* CTAs */}
        <motion.div variants={item} className="mt-10 flex flex-wrap gap-4">
          <a
            href="/"
            className="cursor-pointer rounded-full bg-white px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-black transition hover:opacity-88"
          >
            Ir a tienda
          </a>

          <a
            href="#colecciones"
            className="cursor-pointer rounded-full border border-white/20 px-7 py-3 text-[11px] uppercase tracking-[0.22em] text-white transition hover:border-white hover:bg-white hover:text-black"
          >
            Volver a explorar
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
