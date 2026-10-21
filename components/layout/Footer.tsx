import Image from "next/image";

const nav = [
  {
    heading: "Colecciones",
    links: [
      { label: "Relojes", href: "/tienda/relojes" },
      { label: "Lentes", href: "/" },
      { label: "Ver todo", href: "/" },
    ],
  },
  {
    heading: "Marcas",
    links: [
      { label: "Invicta", href: "/tienda/marcas/invicta" },
      { label: "Tommy Hilfiger", href: "/tienda/marcas/tommy-hilfiger" },
      { label: "Ray-Ban", href: "/tienda/marcas/ray-ban" },
    ],
  },
  {
    heading: "Información",
    links: [
      { label: "Todos los productos", href: "/" },
      { label: "Guía de estilo", href: "/guia-de-estilo" },
      { label: "Contacto", href: "/contacto" },
      { label: "Checkout seguro", href: "/" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/8 bg-[#040404] px-6 py-16 text-white md:px-12 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-[1fr_auto_auto_auto] md:gap-16">
          {/* Brand */}
          <div>
            <a href="/" aria-label="Smile inicio">
              <Image
                src="/images/smile-logo.svg"
                alt="Smile"
                width={140}
                height={52}
                className="h-auto w-[100px] opacity-90 transition hover:opacity-100"
              />
            </a>
            <p className="mt-5 max-w-[220px] text-sm leading-[1.85] text-white/42">
              Relojes, lentes y accesorios premium en Argentina. Compra directa
              con checkout seguro de Tiendanube.
            </p>
          </div>

          {/* Nav columns */}
          {nav.map((col) => (
            <div key={col.heading}>
              <p className="text-[10px] uppercase tracking-[0.38em] text-white/35">
                {col.heading}
              </p>
              <ul className="mt-5 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={(link as { target?: string }).target}
                      rel={
                        (link as { target?: string }).target === "_blank"
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className="cursor-pointer text-sm text-white/55 transition hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-16 flex flex-col gap-3 border-t border-white/6 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-[11px] text-white/28">
            © {new Date().getFullYear()} Smile. Todos los derechos reservados.
          </p>
          <a href="/" className="text-[11px] text-white/28 transition hover:text-white/60">
            smiletiendaimp.com.ar
          </a>
        </div>
      </div>
    </footer>
  );
}
