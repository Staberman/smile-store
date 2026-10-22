import JsonLd from "@/components/seo/JsonLd";
import { INTEREST_FREE_INSTALLMENTS } from "@/lib/storefront.mjs";

export type FaqItem = {
  question: string;
  answer: string;
};

const DEFAULT_FAQS: FaqItem[] = [
  {
    question: "¿Los productos son originales?",
    answer:
      "Sí. Todos los relojes y lentes de Smile son 100% originales e importados, con la garantía oficial de cada marca.",
  },
  {
    question: "¿Cómo se hace el pago?",
    answer:
      `El pago se realiza a través del checkout seguro de Tiendanube, con tarjeta de crédito, débito, transferencia o Mercado Pago. También ofrecemos hasta ${INTEREST_FREE_INSTALLMENTS} cuotas sin interés.`,
  },
  {
    question: "¿Hacen envíos a todo el país?",
    answer:
      "Sí, hacemos envíos gratis a todo el país, sin monto mínimo de compra. Solo completás tus datos en el checkout y listo.",
  },
  {
    question: "¿Puedo cambiar o devolver un producto?",
    answer:
      "Sí, contás con derecho a cambio o devolución dentro de los primeros 10 días de recibido el producto, siempre que esté en su empaque original.",
  },
  {
    question: "¿Cómo sé si un producto tiene stock?",
    answer:
      "El stock de la tienda se sincroniza con Tiendanube cada hora. Los modelos agotados siguen publicados con la etiqueta «Sin stock» y no se pueden comprar hasta que se reponen; podés consultarnos por WhatsApp por su reposición.",
  },
];

function faqPageSchema(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export default function FaqSection({
  faqs = DEFAULT_FAQS,
  title = "Preguntas frecuentes",
}: {
  faqs?: FaqItem[];
  title?: string;
}) {
  return (
    <section className="border-t border-white/6 bg-[#0a0a0a] px-6 py-12 text-[#f0ece4] md:px-12 md:py-16">
      <JsonLd data={faqPageSchema(faqs)} />
      <div className="mx-auto max-w-3xl">
        <p className="text-[9px] uppercase tracking-[0.4em] text-[#4a4540]">
          Ayuda
        </p>
        <h2 className="font-display mt-2 text-xl font-light italic text-[#f0ece4] md:text-2xl">
          {title}
        </h2>

        <div className="mt-6 divide-y divide-white/6">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[13px] text-[#b8b0a4] transition-colors hover:text-[#f0ece4]">
                {faq.question}
                <span
                  className="shrink-0 text-[#4a4540] transition-transform duration-200 group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="mt-2 text-[12px] leading-[1.8] text-[#6a6560]">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
