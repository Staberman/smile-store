"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const GROUPS = [
  {
    label: "Lentes",
    items: [
      { label: "Lentes de sol", view: "lentes" },
      { label: "Ray-Ban", view: "ray-ban" },
      { label: "Scuderia Ferrari", view: "ferrari" },
      { label: "Marcas premium", view: "premium" },
    ],
  },
  {
    label: "Relojes",
    items: [{ label: "Relojes", view: "relojes" }],
  },
  {
    label: "Descubrir",
    items: [
      // "Más vendidos" (view=best-sellers) queda oculto: depende de
      // data/tiendanube-sales-ranking.json, que está vacío y nada lo genera,
      // así que la vista renderiza una página en blanco. El filtro en
      // TiendaClient/storefront.mjs se deja intacto para reactivarlo cuando
      // exista un generador de ranking.
      // { label: "Más vendidos", view: "best-sellers" },
      { label: "Ofertas", view: "offers" },
    ],
  },
] as const;

export default function StoreCategoryNav() {
  const searchParams = useSearchParams();
  const activeView = searchParams.get("view") ?? "lentes";

  return (
    <nav aria-label="Categorías de la tienda" className="min-w-0 flex-1">
      <div className="scrollbar-none flex snap-x snap-mandatory items-center gap-5 overflow-x-auto px-1 py-2 md:justify-center md:gap-7 md:overflow-visible">
        {GROUPS.map((group, groupIndex) => (
          <div
            key={group.label}
            className="flex shrink-0 items-center gap-4 md:gap-5"
            aria-label={group.label}
          >
            {groupIndex > 0 && (
              <span className="h-5 w-px shrink-0 bg-[#c9a96e]/25" aria-hidden="true" />
            )}
            {group.items.map((item) => {
              const active = activeView === item.view;
              return (
                <Link
                  key={item.view}
                  href={`/tienda?view=${item.view}#catalogo`}
                  scroll={false}
                  className="relative flex min-h-11 snap-start items-center whitespace-nowrap text-[9px] uppercase tracking-[0.18em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#c9a96e] md:text-[10px]"
                  style={{ color: active ? "#e2c989" : "#8b8580" }}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-0 bottom-1 h-px bg-[#c9a96e]" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}

