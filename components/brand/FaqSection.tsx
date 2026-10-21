import JsonLd from "@/components/seo/JsonLd";

export type FaqItem = {
  question: string;
  answer: string;
};

const DEFAULT_FAQS: FaqItem[] = [
  {
    question: "¿Los productos son originales?",
    answer:
      "Si. Todos los relojes y lentes de Smile son 100% originales e importados, con la garantia oficial de cada marca.",
  },
  {
    question: "¿Como se hace el pago?",
    answer:
      "El pago se realiza a traves del checkout seguro de Tiendanube, con tarjeta de credito, debito, transferencia o Mercado Pago. Tambien ofrecemos hasta 6 cuotas sin interes.",
  },
  {
    question: "¿Hacen envios a todo el pais?",
    answer:
      "Si, hacemos envios gratis a todo el pais, sin monto minimo de compra. Solo completas tus datos en el checkout y listo.",
  },
  {
    question: "¿Puedo cambiar o devolver un producto?",
    answer:
      "Si, contas con derecho a cambio o devolucion dentro de los primeros 10 dias de recibido el producto, siempre que este en su empaque original.",
  },
  {
    question: "¿Como se si un producto tiene stock?",
    answer:
      "Solo publicamos productos con stock real y disponible. Si un modelo aparece en la tienda, esta listo para comprar y enviar.",
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
