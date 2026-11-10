"use client";

import { usePathname } from "next/navigation";
import WhatsAppContactLink from "@/components/contact/WhatsAppContactLink";
import { usePageContactProduct } from "@/lib/contact-product";

export default function WhatsAppFloatingButton() {
  const pathname = usePathname();
  const isProductPage = pathname.includes("/tienda/productos/");
  // On a product page the message names the product the page announces.
  const product = usePageContactProduct();
  const positionClass = isProductPage ? "bottom-24 md:bottom-6" : "bottom-5 md:bottom-6";

  return (
    <WhatsAppContactLink
      product={product}
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
    </WhatsAppContactLink>
  );
}
