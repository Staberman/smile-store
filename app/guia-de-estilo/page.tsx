import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import JsonLd from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/seo";

const PAGE_PATH = "/guia-de-estilo";
const PAGE_TITLE = "Cómo elegir tus lentes según la forma de tu rostro";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description:
    "Guía de estilo para saber cómo elegir lentes de sol según la forma de tu rostro: qué anteojos favorecen a un rostro ovalado, redondo, cuadrado, corazón o alargado, y cómo elegir el tamaño de tu reloj.",
  alternates: {
    canonical: PAGE_PATH,
  },
  openGraph: {
    type: "article",
    locale: "es_AR",
    url: PAGE_PATH,
    title: `${PAGE_TITLE} | Smile`,
    description:
      "Cómo elegir lentes de sol según la forma de rostro y cómo elegir el tamaño de tu reloj. Guía de estilo de Smile.",
  },
};

const faceShapes = [
  {
    name: "Rostro ovalado",
    intro:
      "Proporciones equilibradas y facciones suaves: es la forma más versátil y admite la mayoría de los estilos.",
    flatter:
      "Favorecen los marcos que respetan esa proporción natural, con un ancho similar al de los pómulos y un peso visual moderado. Los modelos cuadrados suaves, aviador y wayfarer suelen sentar muy bien.",
    avoid:
      "Conviene evitar armazones demasiado grandes o desproporcionados, que tapan las facciones y rompen el equilibrio del rostro.",
  },
  {
    name: "Rostro redondo",
    intro:
      "Líneas curvas, mejillas llenas y un ancho parecido al largo. La meta es aportar estructura y estilizar.",
    flatter:
      "Favorecen los marcos angulares y rectangulares o cuadrados, que aportan definición y alargan visualmente el rostro.",
    avoid:
      "Conviene evitar los marcos redondos y pequeños, que refuerzan la curvatura y acentúan la sensación de redondez.",
  },
  {
    name: "Rostro cuadrado",
    intro:
      "Mandíbula marcada, frente amplia y ángulos definidos. La idea es suavizar sin restarle carácter.",
    flatter:
      "Favorecen los marcos redondeados y ovalados, que equilibran los ángulos; el aviador también funciona muy bien.",
    avoid:
      "Conviene evitar los armazones muy angulares o cuadrados, que endurecen aún más las facciones.",
  },
  {
    name: "Rostro corazón o triangular",
    intro:
      "Frente y pómulos anchos que se afinan hacia un mentón angosto. Buscamos equilibrar la parte superior con la inferior.",
    flatter:
      "Favorecen los marcos livianos, redondeados o de estilo cat-eye suave, y las monturas al aire en la base, que aportan volumen a la parte baja del rostro.",
    avoid:
      "Conviene evitar los marcos pesados o muy anchos en la parte superior, que acentúan el contraste con el mentón.",
  },
  {
    name: "Rostro alargado",
    intro:
      "Más largo que ancho, con líneas verticales predominantes. La meta es acortar visualmente y ganar equilibrio.",
    flatter:
      "Favorecen los marcos con buena altura o profundidad, los modelos oversized y los cuadrados grandes, que aportan proporción horizontal.",
    avoid:
      "Conviene evitar los armazones angostos o muy pequeños, que alargan todavía más el rostro.",
  },
];

const pageSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": `${absoluteUrl(PAGE_PATH)}#article`,
      headline: PAGE_TITLE,
      description:
        "Guía de estilo para elegir lentes de sol según la forma del rostro y para elegir el tamaño de tu reloj.",
      inLanguage: "es-AR",
      url: absoluteUrl(PAGE_PATH),
      isPartOf: { "@id": `${absoluteUrl("/")}#website` },
      about: [
        { "@type": "Thing", name: "Anteojos de sol" },
        { "@type": "Thing", name: "Relojes" },
      ],
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Inicio",
          item: absoluteUrl("/"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Guía de estilo",
          item: absoluteUrl(PAGE_PATH),
        },
      ],
    },
  ],
};

export default function GuiaDeEstiloPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f0ece4]">
      <JsonLd data={pageSchema} />
      <Header />

      {/* Hero */}
      <section className="px-6 pb-16 pt-36 md:px-12 md:pb-20 md:pt-44">
        <div className="mx-auto max-w-5xl">
          <p className="text-[10px] uppercase tracking-[0.42em] text-[#c9a96e]">
            Smile · Guía de estilo
          </p>
          <h1 className="font-display mt-4 max-w-3xl text-[2.6rem] font-light italic leading-[1.04] md:text-[4.6rem]">
            Cómo elegir tus lentes según la forma de tu rostro
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-[1.9] text-[#8b8580] md:text-base">
            Elegir bien tus anteojos de sol empieza por entender tu rostro. Cada
            forma se lleva mejor con determinados armazones: la clave está en
            buscar contraste y equilibrio. Esta es una guía general para orientar
            tu elección, no una regla estricta —lo más importante es que te
            sientas cómodo con el estilo.
          </p>
        </div>
      </section>

      {/* Face shapes */}
      <section className="px-6 pb-20 md:px-12 md:pb-28">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-[1.9rem] font-light italic leading-[1.05] md:text-[2.8rem]">
            Lentes de sol por forma de rostro
          </h2>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {faceShapes.map((shape, index) => (
              <article
                key={shape.name}
                className="border border-white/8 bg-white/[0.025] p-6 md:p-8"
              >
                <p className="font-display text-3xl font-light italic text-white/18">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-4 text-base font-semibold uppercase tracking-[0.08em] text-[#f0ece4]">
                  {shape.name}
                </h3>
                <p className="mt-4 text-sm leading-[1.85] text-[#8b8580]">
                  {shape.intro}
                </p>
                <p className="mt-4 text-sm leading-[1.85] text-[#c9a96e]">
                  Qué favorece
                </p>
                <p className="mt-1 text-sm leading-[1.85] text-[#d8d2c8]">
                  {shape.flatter}
                </p>
                <p className="mt-4 text-sm leading-[1.85] text-[#c9a96e]">
                  Qué evitar
                </p>
                <p className="mt-1 text-sm leading-[1.85] text-[#d8d2c8]">
                  {shape.avoid}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-10">
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#c9a96e] px-7 text-[11px] font-medium uppercase tracking-[0.24em] text-[#0a0a0a] transition hover:bg-[#e2c989]"
            >
              Ver lentes de sol
            </Link>
          </div>
        </div>
      </section>

      {/* Watch sizing */}
      <section className="border-t border-white/6 bg-[#070707] px-6 py-20 md:px-12 md:py-28">
        <div className="mx-auto max-w-5xl">
          <p className="text-[10px] uppercase tracking-[0.42em] text-[#c9a96e]">
            Relojes
          </p>
          <h2 className="font-display mt-4 text-[1.9rem] font-light italic leading-[1.05] md:text-[2.8rem]">
            Cómo elegir el tamaño de tu reloj
          </h2>
          <p className="mt-6 max-w-2xl text-sm leading-[1.9] text-[#8b8580] md:text-base">
            El tamaño de un reloj se mide sobre todo por el diámetro de la caja,
            y la referencia principal es el ancho de tu muñeca. Como guía
            general: una muñeca fina suele lucir más armónica con cajas más
            chicas, mientras que una muñeca más ancha admite diámetros mayores
            sin verse desproporcionada.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="border border-white/8 bg-white/[0.025] p-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#4a4540]">
                Muñeca fina
              </p>
              <p className="mt-4 text-sm leading-[1.85] text-[#d8d2c8]">
                Las cajas más chicas y de perfil delgado tienden a verse más
                equilibradas y cómodas al uso diario.
              </p>
            </div>
            <div className="border border-white/8 bg-white/[0.025] p-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#4a4540]">
                Muñeca media
              </p>
              <p className="mt-4 text-sm leading-[1.85] text-[#d8d2c8]">
                Es la más versátil: acompaña bien tanto los diámetros moderados
                como los modelos algo más presentes.
              </p>
            </div>
            <div className="border border-white/8 bg-white/[0.025] p-6">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#4a4540]">
                Muñeca ancha
              </p>
              <p className="mt-4 text-sm leading-[1.85] text-[#d8d2c8]">
                Admite cajas de mayor diámetro y presencia sin que el reloj se
                vea pequeño en la muñeca.
              </p>
            </div>
          </div>

          <p className="mt-8 max-w-2xl text-sm leading-[1.9] text-[#8b8580]">
            Más allá del diámetro, conviene mirar el grosor de la caja y la
            distancia entre asas: lo ideal es que las asas no se extiendan más
            allá del ancho de tu muñeca, para que el reloj apoye bien y se sienta
            cómodo.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/tienda/relojes"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#c9a96e] px-7 text-[11px] font-medium uppercase tracking-[0.24em] text-[#0a0a0a] transition hover:bg-[#e2c989]"
            >
              Ver relojes
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 px-7 text-[11px] uppercase tracking-[0.24em] text-[#6a6560] transition hover:border-white/25 hover:text-[#f0ece4]"
            >
              Explorar la tienda
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
