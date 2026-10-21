"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const collections = [
  {
    id: 1,
    category: "Relojes",
    title: "Diseño que marca el ritmo.\nPresencia que deja huella.",
    description:
      "Piezas seleccionadas de Invicta y Tommy Hilfiger construidas para destacar fuerza visual, proporción y carácter.",
    image: "/images/card-relojes.jpg",
    href: "/tienda?view=relojes",
    cta: "Ver relojes en tienda",
  },
  {
    id: 2,
    category: "Lentes",
    title: "Formas icónicas.\nActitud inmediata.",
    description:
      "Modelos Ray-Ban seleccionados para aportar identidad, contraste y una presencia visual claramente premium.",
    image: "/images/card-lentes.jpg",
    href: "/tienda",
    cta: "Ver lentes en tienda",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18 } },
};

const item = {
  hidden: { opacity: 0, y: 56 },
  show: { opacity: 1, y: 0 },
};

export default function Collections() {
  return (
    <section
      id="colecciones"
      className="relative overflow-hidden bg-black px-6 pb-28 pt-10 text-white md:px-12 md:pb-36 md:pt-14"
    >
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.18 }}
        className="mx-auto max-w-7xl"
      >
        {/* Collage superior */}
        <motion.div
          variants={item}
          className="relative overflow-hidden rounded-[2.5rem] border border-white/8"
        >
          <div className="absolute inset-0 grid grid-cols-3">
            <div className="relative">
              <Image
                src="/images/bg-watch.jpg"
                alt=""
                fill
                sizes="(max-width:768px) 34vw, 33vw"
                className="object-cover opacity-[0.28] animate-slowZoom"
              />
            </div>
            <div className="relative">
              <Image
                src="/images/bg-tommy.jpg"
                alt=""
                fill
                sizes="(max-width:768px) 34vw, 33vw"
                className="object-cover opacity-[0.28] animate-slowZoom"
              />
            </div>
            <div className="relative">
              <Image
                src="/images/bg-rayban.jpg"
                alt=""
                fill
                sizes="(max-width:768px) 34vw, 33vw"
                className="object-cover opacity-[0.28] animate-slowZoom"
              />
            </div>
            <div className="absolute inset-0 bg-black/60" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/68 via-black/50 to-black/60" />
          </div>

          <div className="relative z-10 px-8 py-16 md:px-14 md:py-20">
            <div className="max-w-4xl">
              <p className="text-[10px] uppercase tracking-[0.42em] text-white/45">
                Universo Smile
              </p>
              <h2 className="font-display mt-5 text-[2.8rem] font-light italic leading-[0.94] md:text-[4.6rem]">
                Una selección construida<br />desde el estilo.
              </h2>
              <p className="mt-6 max-w-2xl text-sm leading-[1.85] text-white/65 md:text-[15px]">
                Relojes y lentes reunidos en una experiencia visual aspiracional
                y orientada a la presencia.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Cards principales */}
        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          {collections.map((collection) => (
            <motion.article
              key={collection.id}
              variants={item}
              className="group relative cursor-pointer overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] transition-transform duration-500 hover:-translate-y-1"
            >
              <a href={collection.href} className="block">
                <div className="relative h-[560px] overflow-hidden">
                  <Image
                    src={collection.image}
                    alt={collection.category}
                    fill
                    sizes="(max-width:1024px) 100vw, 50vw"
                    className="object-cover brightness-[0.75] contrast-[1.05] saturate-[0.9] blur-[0.2px] transition duration-[1200ms] ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/50 transition duration-500 group-hover:bg-black/28" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/16 to-transparent" />

                  {/* Shine */}
                  <div className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 rotate-12 bg-white/10 opacity-0 blur-2xl transition duration-700 group-hover:left-[115%] group-hover:opacity-100" />

                  <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                    <p className="text-[10px] uppercase tracking-[0.38em] text-white/55">
                      {collection.category}
                    </p>

                    <h3 className="font-display mt-4 whitespace-pre-line text-[2rem] font-light italic leading-[1.0] md:text-[2.8rem]">
                      {collection.title}
                    </h3>

                    <p className="mt-5 max-w-xl text-sm leading-[1.85] text-white/70 md:text-[15px]">
                      {collection.description}
                    </p>

                    <div className="mt-8 inline-flex cursor-pointer items-center gap-3 rounded-full border border-white/20 px-6 py-3 text-[11px] uppercase tracking-[0.24em] text-white transition group-hover:border-white group-hover:bg-white group-hover:text-black">
                      <span>{collection.cta}</span>
                      <span aria-hidden="true">→</span>
                    </div>
                  </div>
                </div>
              </a>
            </motion.article>
          ))}
        </div>

      </motion.div>
    </section>
  );
}
