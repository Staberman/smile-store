import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import StoreCategoryNav, { type AudienceNavLinks } from "@/components/store/StoreCategoryNav";
import type { HubParent } from "@/lib/collection-hubs.mjs";
import { hubsOf, indexableHubs } from "@/lib/hub-pages";

/** Indexed hombre / mujer hubs of a section, as category nav links. */
function audienceNavLinks(parent: HubParent) {
  return indexableHubs(hubsOf("audience", parent)).map((hub) => ({
    label: hub.crumb,
    ariaLabel: hub.linkLabel,
    href: hub.path,
  }));
}

// Computed here, on the server: noindex hubs (e.g. sunglasses hubs that
// would repeat /tienda/anteojos-de-sol) get no nav link.
const audienceLinks: AudienceNavLinks = {
  lentes: audienceNavLinks("anteojos-de-sol"),
  relojes: audienceNavLinks("relojes"),
};

/**
 * Store chrome shared by the homepage ("/") and every /tienda/* route:
 * sticky header with logo, category navigation and store link, plus footer.
 */
export default function StoreShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Sticky rather than fixed: the header's height depends on the logo and
          the category row, so a hardcoded content offset hid the top ~40px of
          every page (breadcrumbs included) behind it. */}
      <header className="sticky top-0 z-30 w-full border-b border-white/8 bg-black/88 backdrop-blur-md">
        <div className="mx-auto max-w-[92rem] px-4 md:px-6">
          <div className="flex min-h-[72px] items-center justify-between gap-5 md:min-h-[82px]">
            <Link href="/" className="flex shrink-0 items-center" aria-label="Smile inicio">
              <Image
                src="/images/smile-logo.svg"
                alt="Smile"
                width={160}
                height={60}
                priority
                className="h-auto w-[96px] opacity-95 transition hover:opacity-100 md:w-[118px]"
              />
            </Link>

            <div className="hidden min-w-0 flex-1 md:block">
              <StoreCategoryNav audienceLinks={audienceLinks} />
            </div>

            <nav className="flex shrink-0 items-center gap-2">
            <Link
              href="/"
              className="flex min-h-11 cursor-pointer items-center rounded-full border border-white/25 bg-white/8 px-4 text-[10px] uppercase tracking-[0.2em] text-white backdrop-blur transition hover:border-white hover:bg-white hover:text-black"
            >
              Tienda
            </Link>
            </nav>
          </div>

          <div className="border-t border-white/6 md:hidden">
            <StoreCategoryNav audienceLinks={audienceLinks} />
          </div>
        </div>
      </header>

      {children}
      <Footer />
    </>
  );
}
