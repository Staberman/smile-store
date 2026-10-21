import type { Metadata } from "next";
import Link from "next/link";
import StoreShell from "@/components/store/StoreShell";

export const metadata: Metadata = {
  title: "Página no encontrada",
  description: "La página que buscás no existe o ya no está publicada en Smile.",
};

const HUB_LINKS = [
  { label: "Lentes de sol", href: "/#catalogo" },
  { label: "Ray-Ban", href: "/tienda/marcas/ray-ban" },
  { label: "Marcas premium", href: "/tienda/marcas/premium" },
  { label: "Relojes", href: "/tienda/relojes" },
];

// Root 404 for unmatched URLs and notFound(). Next.js serves it with a 404
// status and a noindex robots tag.
export default function NotFound() {
  return (
    <StoreShell>
      <main className="min-h-[70vh] bg-[#0a0a0a] px-6 py-24 text-[#f0ece4] md:px-12 md:py-32">
        <div className="mx-auto max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.42em] text-[#c9a96e]">Error 404</p>
          <h1 className="font-display mt-4 text-[2.6rem] font-light italic leading-[1.05] md:text-[3.8rem]">
            No encontramos esta página
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-[1.9] text-[#8b8580] md:text-base">
            Puede que el enlace esté mal escrito o que el producto ya no esté
            publicado. Seguí explorando la tienda:
          </p>

          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {HUB_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group flex min-h-14 items-center justify-between rounded-2xl border border-white/8 bg-white/[0.02] px-6 transition hover:border-[#c9a96e]/45"
                >
                  <span className="font-display text-lg font-light italic">{link.label}</span>
                  <span
                    aria-hidden="true"
                    className="text-[#c9a96e] transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href="/"
            className="mt-10 inline-flex min-h-11 items-center rounded-full border border-[#2a2520] px-6 text-[10px] uppercase tracking-[0.24em] text-[#f0ece4] transition hover:border-[#c9a96e] hover:bg-[#c9a96e] hover:text-[#0a0a0a]"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    </StoreShell>
  );
}
