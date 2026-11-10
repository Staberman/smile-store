// General store questions: the homepage FAQ and its FAQPage JSON-LD
// (components/brand/FaqSection.tsx). Plain JavaScript so node:test can check
// the copy; hubs build their own FAQ in lib/collection-hubs.mjs and reuse the
// pickup answer. Server-only: client components import lib/store-facts.
import { FREE_SHIPPING_PHRASE, STORE_LOCATION, STORE_PICKUP_PHRASE } from "./store-copy.mjs";
import { INTEREST_FREE_INSTALLMENTS } from "./storefront.mjs";

// Shipping cost is not confirmed: not stated. Free shipping is stated only
// through FREE_SHIPPING_PHRASE, synced from Tiendanube's checkout.
export const PICKUP_FAQ_ANSWER = `Sí: hay ${STORE_PICKUP_PHRASE}, ${STORE_LOCATION.locality}. Si estás en otra ciudad, hacemos envíos a todo el país.`;

// The published returns terms, reused word for word wherever a page answers
// the question. Warranty terms are not confirmed by the owner: never stated.
export const RETURNS_FAQ_ANSWER =
  "Sí, contás con derecho a cambio o devolución dentro de los primeros 10 días de recibido el producto, siempre que esté en su empaque original.";

export const STORE_FAQS = [
  {
    question: "¿Los productos son originales?",
    answer:
      "Sí. Todos los relojes y lentes de Smile son 100% originales e importados. Si querés comprobar un modelo antes de comprar, consultanos por WhatsApp.",
  },
  {
    question: "¿Cómo se hace el pago?",
    answer:
      `El pago se realiza a través del checkout seguro de Tiendanube, con tarjeta de crédito, débito, transferencia o Mercado Pago. También ofrecemos hasta ${INTEREST_FREE_INSTALLMENTS} cuotas sin interés.`,
  },
  {
    question: "¿Hacen envíos a todo el país?",
    answer: `Sí, hacemos envíos a todo el país. ${FREE_SHIPPING_PHRASE}. Solo completás tus datos en el checkout y listo.`,
  },
  {
    question: `¿Puedo retirar mi compra en ${STORE_LOCATION.locality}?`,
    answer: PICKUP_FAQ_ANSWER,
  },
  {
    question: "¿Puedo cambiar o devolver un producto?",
    answer: RETURNS_FAQ_ANSWER,
  },
  {
    question: "¿Cómo sé si un producto tiene stock?",
    answer:
      "El stock de la tienda se sincroniza con Tiendanube cada hora. Los modelos agotados siguen publicados con la etiqueta «Sin stock» y no se pueden comprar hasta que se reponen; podés consultarnos por WhatsApp por su reposición.",
  },
];
