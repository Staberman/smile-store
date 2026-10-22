"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { INTEREST_FREE_INSTALLMENTS, TRANSFER_DISCOUNT_PERCENT } from "@/lib/storefront.mjs";

type Benefit = {
  key: string;
  icon: ReactNode;
  label: string;
  detail?: string;
  accent?: boolean;
};

const stroke = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const benefits: Benefit[] = [
  {
    key: "transferencia",
    label: `${TRANSFER_DISCOUNT_PERCENT}% OFF`,
    detail: "pagando por transferencia",
    accent: true,
    icon: (
      <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
        <path d="M4 8h13m0 0-3.5-3.5M17 8l-3.5 3.5" />
        <path d="M20 16H7m0 0 3.5-3.5M7 16l3.5 3.5" />
      </svg>
    ),
  },
  {
    key: "cuotas",
    label: `Hasta ${INTEREST_FREE_INSTALLMENTS} cuotas`,
    detail: "sin interés",
    accent: true,
    icon: (
      <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 10.5h18" />
        <path d="M6.5 14.5h4" />
      </svg>
    ),
  },
  {
    key: "envio",
    label: "Envío gratis a todo el país",
    icon: (
      <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
        <path d="M3 6.5h11v9H3z" />
        <path d="M14 9.5h3.5L21 13v2.5h-7z" />
        <circle cx="7" cy="18" r="1.7" />
        <circle cx="17.5" cy="18" r="1.7" />
      </svg>
    ),
  },
  {
    key: "originales",
    label: "Productos originales",
    icon: (
      <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
        <path d="M12 3 5 5.8v5.1c0 4.1 3 6.9 7 8.1 4-1.2 7-4 7-8.1V5.8z" />
        <path d="m9 11.8 2 2 4-4" />
      </svg>
    ),
  },
  {
    key: "whatsapp",
    label: "Atención por WhatsApp",
    icon: (
      <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
        <path d="M21 11.5a8 8 0 0 1-11.6 7.1L4.5 20l1.4-4.7A8 8 0 1 1 21 11.5Z" />
      </svg>
    ),
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

export default function BenefitsStrip() {
  return (
    <section
      aria-label="Beneficios de comprar en Smile"
      className="relative border-y border-white/6 bg-[#060606] px-6 py-14 text-[#f0ece4] md:px-12 md:py-16"
    >
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="mx-auto max-w-7xl"
      >
        <motion.div variants={item} className="mb-9 md:mb-11">
          <p className="text-[10px] uppercase tracking-[0.42em] text-[#c9a96e]">
            Beneficios Smile
          </p>
          <h2 className="font-display mt-4 text-[2rem] font-light italic leading-[1.0] text-[#f0ece4] md:text-[2.6rem]">
            Comprá con estilo y respaldo.
          </h2>
        </motion.div>

        <div className="scrollbar-none -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 md:mx-0 md:grid md:grid-cols-5 md:gap-0 md:overflow-visible md:px-0 md:pb-0">
          {benefits.map((benefit) => (
            <motion.div
              key={benefit.key}
              variants={item}
              className="flex min-h-11 w-[15rem] shrink-0 snap-start flex-col gap-4 rounded-2xl border border-white/8 px-5 py-6 md:w-auto md:rounded-none md:border-0 md:border-l md:border-white/8 md:px-7 md:py-1 md:first:border-l-0"
            >
              <span
                className={`inline-flex h-6 w-6 ${
                  benefit.accent ? "text-[#c9a96e]" : "text-[#c9a96e]/70"
                }`}
              >
                {benefit.icon}
              </span>
              <div>
                <p
                  className={`text-[13px] font-medium uppercase tracking-[0.14em] ${
                    benefit.accent ? "text-[#e2c989]" : "text-[#f0ece4]"
                  }`}
                >
                  {benefit.label}
                </p>
                {benefit.detail && (
                  <p className="mt-1.5 text-[11px] uppercase tracking-[0.16em] text-[#8b8580]">
                    {benefit.detail}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
