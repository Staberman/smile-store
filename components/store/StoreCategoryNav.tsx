"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_STORE_VIEW } from "./storeView";

type NavItem = {
  label: string;
  /** Accessible name when the visible label needs its group to make sense. */
  ariaLabel?: string;
  /** Catalog view this item matches on "/" (?view=, legacy inbound links). */
  view: string;
  /** Indexable destination. Items without one are in-page filters on "/". */
  href?: string;
  /** Routes, other than "/", where the item is the current section. */
  isCurrentRoute?: (pathname: string) => boolean;
};

const isUnder = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(`${route}/`);

const OFFERS_HREF = "/?view=offers#catalogo";

/** A hombre / mujer hub, e.g. { label: "Hombre", ariaLabel: "Relojes para hombre" }. */
export type AudienceNavLink = { label: string; ariaLabel: string; href: string };

/**
 * Indexed audience hubs per group. StoreShell computes them on the server
 * (lib/hub-pages): this client component must not import the catalog.
 */
export type AudienceNavLinks = { lentes: AudienceNavLink[]; relojes: AudienceNavLink[] };

type NavGroup = { label: string; items: NavItem[] };

function audienceItems(links: AudienceNavLink[]): NavItem[] {
  return links.map((link) => ({
    ...link,
    view: link.href,
    isCurrentRoute: (pathname) => pathname === link.href,
  }));
}

function navGroups(audience: AudienceNavLinks): NavGroup[] {
  const watchAudienceHrefs = audience.relojes.map((link) => link.href);

  return [
    {
      label: "Lentes",
      items: [
        // The homepage catalog defaults to the "lentes" view.
        { label: "Lentes de sol", view: "lentes", href: "/#catalogo" },
        ...audienceItems(audience.lentes),
        {
          label: "Ray-Ban",
          view: "ray-ban",
          href: "/tienda/marcas/ray-ban",
          // The Ray-Ban hub and its model hubs; Ferrari has its own item.
          isCurrentRoute: (pathname) =>
            isUnder(pathname, "/tienda/marcas/ray-ban") &&
            !isUnder(pathname, "/tienda/marcas/ray-ban/ferrari"),
        },
        {
          label: "Scuderia Ferrari",
          view: "ferrari",
          href: "/tienda/marcas/ray-ban/ferrari",
          isCurrentRoute: (pathname) => pathname === "/tienda/marcas/ray-ban/ferrari",
        },
        {
          label: "Marcas premium",
          view: "premium",
          href: "/tienda/marcas/premium",
          isCurrentRoute: (pathname) => isUnder(pathname, "/tienda/marcas/premium"),
        },
      ],
    },
    {
      label: "Relojes",
      items: [
        {
          label: "Relojes",
          view: "relojes",
          href: "/tienda/relojes",
          isCurrentRoute: (pathname) =>
            (isUnder(pathname, "/tienda/relojes") && !watchAudienceHrefs.includes(pathname)) ||
            isUnder(pathname, "/tienda/marcas/invicta") ||
            isUnder(pathname, "/tienda/marcas/tommy-hilfiger"),
        },
        ...audienceItems(audience.relojes),
      ],
    },
    {
      label: "Descubrir",
      items: [
        // "Más vendidos" (view=best-sellers) queda oculto: depende de
        // data/tiendanube-sales-ranking.json, que está vacío y nada lo genera,
        // así que la vista renderiza una página en blanco. El filtro en
        // TiendaCatalog/lib/catalog.ts se deja intacto para reactivarlo cuando
        // exista un generador de ranking.
        // { label: "Más vendidos", view: "best-sellers" },
        //
        // Ofertas has no hub page: it filters the homepage catalog, so it is a
        // button rather than a crawlable ?view= URL.
        { label: "Ofertas", view: "offers" },
      ],
    },
  ];
}

const ITEM_CLASS =
  "relative flex min-h-11 snap-start items-center whitespace-nowrap text-[9px] uppercase tracking-[0.18em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#c9a96e] md:text-[10px]";

function isActive(item: NavItem, pathname: string, view: string | null): boolean {
  if (pathname === "/") return item.view === (view ?? DEFAULT_STORE_VIEW);
  return item.isCurrentRoute?.(pathname) ?? false;
}

/**
 * Category links for a pathname and homepage view. `view` is null when the
 * URL has none (or while it cannot be read, e.g. in the static HTML).
 */
function StoreCategoryLinks({
  groups,
  pathname,
  view,
}: {
  groups: NavGroup[];
  pathname: string;
  view: string | null;
}) {
  const router = useRouter();
  const onHome = pathname === "/";

  return (
    <nav aria-label="Categorías de la tienda" className="min-w-0 flex-1">
      {/* Centered while it fits; scrolls from the first item when it does not. */}
      <div className="scrollbar-none flex snap-x snap-mandatory items-center gap-5 overflow-x-auto px-1 py-2 md:justify-center-safe md:gap-7">
        {groups.map((group, groupIndex) => (
          <div
            key={group.label}
            className="flex shrink-0 items-center gap-4 md:gap-5"
            aria-label={group.label}
          >
            {groupIndex > 0 && (
              <span className="h-5 w-px shrink-0 bg-[#c9a96e]/25" aria-hidden="true" />
            )}
            {group.items.map((item) => {
              const active = isActive(item, pathname, view);
              const style = { color: active ? "#e2c989" : "#8b8580" };
              const content = (
                <>
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-0 bottom-1 h-px bg-[#c9a96e]" />
                  )}
                </>
              );

              if (!item.href) {
                return (
                  <button
                    key={item.view}
                    type="button"
                    // On "/" switch the view in place, as the catalog filters do.
                    onClick={() => router.push(OFFERS_HREF, { scroll: !onHome })}
                    className={`${ITEM_CLASS} cursor-pointer`}
                    style={style}
                    aria-pressed={active}
                  >
                    {content}
                  </button>
                );
              }

              // "/#catalogo" from "/" switches the view in place.
              const inPage = onHome && item.href.startsWith("/#");
              return (
                <Link
                  key={item.view}
                  href={item.href}
                  // Rendered on every page: skip prefetching every hub payload.
                  prefetch={false}
                  scroll={!inPage}
                  className={ITEM_CLASS}
                  style={style}
                  aria-label={item.ariaLabel}
                  aria-current={active ? "page" : undefined}
                >
                  {content}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}

function StoreCategoryLinksFromUrl({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return <StoreCategoryLinks groups={groups} pathname={pathname} view={searchParams.get("view")} />;
}

function StoreCategoryLinksFallback({ groups }: { groups: NavGroup[] }) {
  return <StoreCategoryLinks groups={groups} pathname={usePathname()} view={null} />;
}

export default function StoreCategoryNav({ audienceLinks }: { audienceLinks: AudienceNavLinks }) {
  const groups = navGroups(audienceLinks);
  return (
    // The fallback keeps the category links in the static HTML for crawlers;
    // it knows the route but not the ?view= of the homepage.
    <Suspense fallback={<StoreCategoryLinksFallback groups={groups} />}>
      <StoreCategoryLinksFromUrl groups={groups} />
    </Suspense>
  );
}
