const highlights = [
  {
    title: "Checkout seguro",
    text: "La compra se confirma con el checkout protegido de Tiendanube.",
  },
  {
    title: "Stock actualizado",
    text: "El stock se sincroniza con Tiendanube cada hora; los modelos agotados se marcan «Sin stock».",
  },
  {
    title: "Atención personalizada",
    text: "Consultas y seguimiento desde los canales oficiales de Smile.",
  },
  {
    title: "Selección premium",
    text: "Relojes y lentes curados por marca, modelo y disponibilidad.",
  },
];

export default function TrustHighlights() {
  return (
    <section className="border-y border-white/6 bg-[#080808] px-6 py-8 text-[#f0ece4] md:px-12">
      <div className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {highlights.map((item) => (
          <div key={item.title}>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#c9a96e]">
              {item.title}
            </p>
            <p className="mt-2 text-sm leading-[1.7] text-[#6a6560]">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
