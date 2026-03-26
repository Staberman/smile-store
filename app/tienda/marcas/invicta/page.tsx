const products = [
  {
    name: "Invicta Pro Diver",
    image: "/images/card-relojes.jpg",
    category: "Relojes",
  },
  {
    name: "Invicta Bolt",
    image: "/images/card-relojes.jpg",
    category: "Relojes",
  },
  {
    name: "Invicta Reserve",
    image: "/images/card-relojes.jpg",
    category: "Relojes",
  },
];

export default function InvictaPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="border-b border-white/10 px-6 pb-16 pt-28 md:px-12 md:pb-20 md:pt-32">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs uppercase tracking-[0.35em] text-white/45">
            Smile / Invicta
          </p>

          <h1 className="mt-4 max-w-4xl text-5xl font-semibold uppercase leading-[0.94] tracking-[0.06em] md:text-7xl">
            Invicta
          </h1>

          <p className="mt-6 max-w-2xl text-sm leading-7 text-white/68 md:text-base">
            Fuerza visual, volumen y carácter para quienes buscan relojes con
            presencia marcada y diseño contundente.
          </p>
        </div>
      </section>

      <section className="px-6 py-20 md:px-12 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <article
                key={product.name}
                className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.02]"
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover brightness-[0.82]"
                  />
                </div>

                <div className="p-5">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">
                    {product.category}
                  </p>

                  <h2 className="mt-3 text-lg font-medium uppercase tracking-[0.05em]">
                    {product.name}
                  </h2>

                  <div className="mt-5">
                    <a
                      href="#"
                      className="inline-flex rounded-full bg-white px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-black transition hover:opacity-90"
                    >
                      Ver producto
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}