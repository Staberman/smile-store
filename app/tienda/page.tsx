const boutiques = [
  {
    name: "Ray-Ban",
    slug: "ray-ban",
    logo: "/images/ray-ban-logo.png",
    title: "Formas icónicas. Actitud inmediata.",
    description:
      "Lentes con identidad visual fuerte, presencia reconocible y una estética premium pensada para destacar desde el primer vistazo.",
    image: "/images/card-lentes.jpg",
  },
  {
    name: "Tommy Hilfiger",
    slug: "tommy-hilfiger",
    logo: "/images/tommy-logo.png",
    title: "Diseño contemporáneo con identidad global.",
    description:
      "Una selección construida desde líneas limpias, presencia contemporánea y una identidad reconocible dentro del lujo cotidiano.",
    image: "/images/bg-tommy.jpg",
  },
  {
    name: "Invicta",
    slug: "invicta",
    logo: "/images/invicta-logo.png",
    title: "Fuerza visual, volumen y carácter.",
    description:
      "Relojes con carácter, diseño contundente y una presencia estética orientada a quienes buscan impacto y personalidad.",
    image: "/images/card-relojes.jpg",
  },
];

export default function TiendaPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative overflow-hidden border-b border-white/10 px-6 pb-20 pt-28 md:px-12 md:pb-24 md:pt-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_40%)]" />

        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs uppercase tracking-[0.35em] text-white/45">
            Smile Store
          </p>

          <h1 className="mt-4 max-w-5xl text-5xl font-semibold uppercase leading-[0.94] tracking-[0.06em] md:text-7xl">
            Una tienda. Distintos universos. Una sola experiencia premium.
          </h1>

          <p className="mt-6 max-w-2xl text-sm leading-7 text-white/68 md:text-base">
            Smile reúne distintas marcas icónicas dentro de una misma
            experiencia visual. Cada una conserva su identidad, su estilo y su
            forma de presentarse.
          </p>
        </div>
      </section>

      <section className="px-6 py-20 md:px-12 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.35em] text-white/45">
              Boutiques
            </p>

            <h2 className="mt-4 text-4xl font-semibold uppercase tracking-[0.05em] md:text-5xl">
              Explora cada colección.
            </h2>
          </div>

          <div className="mt-14 grid gap-8 xl:grid-cols-3">
            {boutiques.map((boutique) => (
              <article
                key={boutique.slug}
                className="group overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.02]"
              >
                <a href={`/marcas/${boutique.slug}`} className="block">
                  <div className="relative h-[720px] overflow-hidden">
                    <img
                      src={boutique.image}
                      alt={boutique.name}
                      className="h-full w-full object-cover brightness-[0.76] contrast-[1.04] saturate-[0.92] transition duration-[1200ms] ease-out group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-black/50 transition duration-500 group-hover:bg-black/30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/12 to-transparent" />

                    <div className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 rotate-12 bg-white/10 opacity-0 blur-2xl transition duration-700 group-hover:left-[115%] group-hover:opacity-100" />

                    <div className="absolute left-0 right-0 top-6 flex justify-center">
                      <div className="rounded-full bg-black/35 px-4 py-2 backdrop-blur-sm">
                        <img
                          src={boutique.logo}
                          alt={boutique.name}
                          className={`h-10 object-contain opacity-90 md:h-12 ${
                            boutique.slug === "invicta"
                              ? "invert brightness-200"
                              : ""
                          }`}
                        />
                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-8 pt-20 md:p-10 md:pt-24">
                      <h3 className="text-3xl font-semibold uppercase tracking-[0.05em] md:text-4xl">
                        {boutique.name}
                      </h3>

                      <h4 className="mt-4 max-w-sm text-2xl font-medium uppercase leading-[1.02] tracking-[0.04em]">
                        {boutique.title}
                      </h4>

                      <p className="mt-5 max-w-md text-sm leading-7 text-white/72">
                        {boutique.description}
                      </p>

                      <div className="mt-7 inline-flex items-center gap-3 rounded-full border border-white/20 px-6 py-3 text-[11px] uppercase tracking-[0.24em] text-white transition group-hover:border-white group-hover:bg-white group-hover:text-black">
                        <span>Explorar colección</span>
                        <span aria-hidden="true">→</span>
                      </div>
                    </div>
                  </div>
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#060606] px-6 py-20 md:px-12 md:py-24">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-12">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/45">
                Identidad
              </p>
              <p className="mt-4 text-sm leading-7 text-white/68">
                Cada marca se presenta como un universo propio, con una entrada
                clara, una dirección visual definida y un recorrido específico.
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/45">
                Experiencia
              </p>
              <p className="mt-4 text-sm leading-7 text-white/68">
                Smile funciona como una casa de estilo que organiza distintas
                colecciones premium bajo una sola experiencia coherente.
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/45">
                Selección
              </p>
              <p className="mt-4 text-sm leading-7 text-white/68">
                Relojes, lentes y accesorios con una presentación visual
                orientada a diseño, presencia y marcas reconocidas.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}