import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import JsonLd from "@/components/seo/JsonLd";
import { absoluteUrl, ORGANIZATION_ID, pageMetadata, SITE_NAME, SITE_URL } from "@/lib/seo";
import {
  INSTAGRAM_URL,
  PHONE_DISPLAY,
  PHONE_E164,
  STORE_EMAIL,
  STORE_LOCATION,
  STORE_PICKUP_PHRASE,
  WHATSAPP_URL,
} from "@/lib/store-facts";

export const metadata: Metadata = pageMetadata({
  title: "Contacto en Rosario: WhatsApp, email e Instagram",
  description:
    "Contacto de Smile, tienda de anteojos de sol y relojes en Rosario, Santa Fe. Consultas por stock, medios de pago, envíos y seguimiento de compras.",
  path: "/contacto",
});

// The store itself is the sitewide OnlineStore node (app/layout.tsx); the
// contact page points to it instead of describing it again.
const contactSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "@id": `${absoluteUrl("/contacto")}#contactpage`,
  name: `Contacto | ${SITE_NAME}`,
  url: absoluteUrl("/contacto"),
  inLanguage: "es-AR",
  isPartOf: { "@id": `${SITE_URL}/#website` },
  mainEntity: { "@id": ORGANIZATION_ID },
};

const instagramHandle = `@${INSTAGRAM_URL.split("/").filter(Boolean).pop()}`;

type ContactItem = { label: string; value: string; href?: string; external?: boolean };

const contactItems: ContactItem[] = [
  { label: "WhatsApp", value: PHONE_DISPLAY, href: WHATSAPP_URL, external: true },
  { label: "Teléfono", value: PHONE_DISPLAY, href: `tel:${PHONE_E164}` },
  { label: "Email", value: STORE_EMAIL, href: `mailto:${STORE_EMAIL}` },
  { label: "Instagram", value: instagramHandle, href: INSTAGRAM_URL, external: true },
  { label: "Ubicación", value: STORE_LOCATION.label },
  // The pickup is arranged over WhatsApp, so the item links there.
  {
    label: "Retiro",
    value: `Ofrecemos ${STORE_PICKUP_PHRASE}, ${STORE_LOCATION.locality}.`,
    href: WHATSAPP_URL,
    external: true,
  },
  {
    label: "Consultas",
    value: "Stock, medios de pago, envíos y seguimiento de compra.",
  },
  {
    label: "Checkout",
    value: "Las compras se confirman con el checkout seguro de Tiendanube.",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f0ece4]">
      <JsonLd data={contactSchema} />
      <Header />
      <section className="px-6 pb-20 pt-36 md:px-12 md:pb-28 md:pt-44">
        <div className="mx-auto max-w-5xl">
          <p className="text-[10px] uppercase tracking-[0.42em] text-[#c9a96e]">
            Smile · Tienda online
          </p>
          <h1 className="font-display mt-4 max-w-3xl text-[3rem] font-light italic leading-[1.02] md:text-[5rem]">
            Contacto
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-[1.9] text-[#8b8580] md:text-base">
            Estamos para ayudarte con consultas sobre productos, stock,
            métodos de pago, envíos y compras realizadas en Smile.
          </p>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {contactItems.map((item) => (
              <div
                key={item.label}
                className="border border-white/8 bg-white/[0.025] p-6"
              >
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#4a4540]">
                  {item.label}
                </p>
                <p className="mt-4 break-words text-sm leading-[1.75] text-[#f0ece4]">
                  {item.href ? (
                    <a
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      className="underline decoration-white/20 underline-offset-4 transition hover:text-[#c9a96e] hover:decoration-[#c9a96e]"
                    >
                      {item.value}
                    </a>
                  ) : (
                    item.value
                  )}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#c9a96e] px-7 text-[11px] font-medium uppercase tracking-[0.24em] text-[#0a0a0a] transition hover:bg-[#e2c989]"
            >
              Ver productos
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 px-7 text-[11px] uppercase tracking-[0.24em] text-[#6a6560] transition hover:border-white/25 hover:text-[#f0ece4]"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
