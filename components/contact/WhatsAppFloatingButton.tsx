"use client";

import { usePathname } from "next/navigation";
import { absoluteUrl } from "@/lib/seo";
import { WHATSAPP_URL } from "@/lib/store-facts";

function getPageContext(pathname: string): string {
  if (pathname.includes("/tienda/productos/")) {
    return "este producto";
  }

  if (pathname.includes("/tienda/marcas/ray-ban/ferrari")) {
    return "la coleccion Ray-Ban Scuderia Ferrari";
  }

  if (pathname.includes("/tienda/marcas/ray-ban")) {
    return "la coleccion Ray-Ban";
  }

  if (pathname.includes("/tienda/marcas/premium")) {
    return "las marcas premium";
  }

  if (pathname.includes("/tienda/marcas/tommy-hilfiger")) {
    return "los relojes Tommy Hilfiger";
  }

  if (pathname.includes("/tienda/marcas/invicta")) {
    return "los relojes Invicta";
  }

  if (pathname.includes("/tienda/relojes/omega-swatch")) {
    return "los Omega x Swatch";
  }

  if (pathname.includes("/tienda/relojes")) {
    return "la coleccion de relojes";
  }

  if (pathname === "/" || pathname.includes("/tienda")) {
    return "el catalogo de Smile";
  }

  return "la tienda Smile";
}

function prettifySlug(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-[a-z0-9]{5}$/i, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function getProductName(pathname: string): string | null {
  const slug = pathname.split("/tienda/productos/")[1]?.split("/")[0];

  return slug ? prettifySlug(slug) : null;
}

function buildMessage(pathname: string): string {
  const isProductPage = pathname.includes("/tienda/productos/");
  const context = isProductPage
    ? getProductName(pathname) ?? getPageContext(pathname)
    : getPageContext(pathname);
  const pageUrl = absoluteUrl(pathname);

  if (isProductPage) {
    return [
      `Hola Smile, estoy interesado/a en ${context}.`,
      "Quiero confirmar stock, variantes disponibles, cuotas y el beneficio por transferencia.",
      pageUrl ? `Lo estoy viendo aca: ${pageUrl}` : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    `Hola Smile, estoy mirando ${context}.`,
    "Me gustaria que me asesoren para elegir la mejor opcion segun stock, estilo y forma de pago.",
    pageUrl ? `Estoy en esta pagina: ${pageUrl}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export default function WhatsAppFloatingButton() {
  const pathname = usePathname();
  const isProductPage = pathname.includes("/tienda/productos/");
  const href = `${WHATSAPP_URL}?text=${encodeURIComponent(buildMessage(pathname))}`;
  const positionClass = isProductPage ? "bottom-24 md:bottom-6" : "bottom-5 md:bottom-6";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Consultar por WhatsApp"
      className={`group fixed right-3 z-[80] flex items-center gap-3 rounded-full border border-[#c9a96e]/35 bg-[#080706]/92 p-2 text-[#f0ece4] shadow-[0_18px_60px_rgba(0,0,0,0.42)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c9a96e]/70 hover:bg-[#0f0d0a] focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/55 md:right-6 md:px-4 md:py-3 ${positionClass}`}
    >
      <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#c9a96e] text-[#0a0a0a] shadow-[0_0_0_5px_rgba(201,169,110,0.1)] md:h-10 md:w-10 md:shadow-[0_0_0_6px_rgba(201,169,110,0.1)]">
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.2 11.7a8.2 8.2 0 0 1-11.9 7.4L4 20.3l1.2-4.1A8.2 8.2 0 1 1 20.2 11.7Z" />
          <path d="M8.9 8.6c.2-.5.4-.6.7-.6h.5c.2 0 .4 0 .5.4l.7 1.6c.1.3 0 .5-.1.7l-.4.5c-.1.1-.1.3 0 .5.4.8 1.2 1.6 2.1 2 .2.1.4.1.5-.1l.5-.6c.2-.2.4-.2.7-.1l1.6.7c.3.1.4.3.4.6v.5c0 .4-.3.7-.7.9-.5.3-1.2.4-2 .2-2.7-.7-5.1-3-5.8-5.7-.2-.7-.1-1.3.2-1.8Z" />
        </svg>
      </span>

      <span className="hidden pr-2 text-left md:block">
        <span className="block text-[10px] uppercase tracking-[0.24em] text-[#c9a96e]">
          Asesor Smile
        </span>
        <span className="mt-0.5 block text-xs text-[#8b8580] transition group-hover:text-[#f0ece4]">
          Te ayudo a elegir
        </span>
      </span>
    </a>
  );
}
