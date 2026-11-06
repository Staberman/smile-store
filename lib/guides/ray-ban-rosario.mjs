// Guide: where to buy original Ray-Ban in Rosario. Written for the local
// query ("dónde comprar Ray-Ban originales en Rosario"): the answer is Smile's
// own terms (the shared pickup phrase, nationwide
// shipping, the synced payment phrases), the authenticity checks summarized
// from the Ray-Ban guide, and the in-stock price range read from the catalog.
// Nothing here claims an official-dealer status, a street address, opening
// hours, a warranty or returns: the owner has not confirmed that wording.
import { isRayBanProduct, isSunglassesProduct, priceRange, RAY_BAN_MODEL_HUBS } from "../collection-hubs.mjs";
import { FREE_SHIPPING_PHRASE, STORE_PICKUP_PHRASE } from "../store-copy.mjs";
import { RAY_BAN_PRODUCT_SOURCES } from "./ray-ban-originales.mjs";
import {
  GUIDE_SLUGS,
  guidePath,
  link,
  STORE_LOCATION_SENTENCE,
  STORE_PAYMENT_SENTENCE,
} from "./shared.mjs";
import { modelsPhrase, pesosRange } from "./watch-facts.mjs";

const RAY_BAN_PATH = "/tienda/marcas/ray-ban";

const SOURCES = [
  {
    publisher: "Ray-Ban",
    title: "Frequently Asked Questions (Estados Unidos, copia archivada)",
    url: "https://web.archive.org/web/20260615115659/https://www.ray-ban.com/usa/c/frequently-asked-questions",
  },
  RAY_BAN_PRODUCT_SOURCES.aviador,
  RAY_BAN_PRODUCT_SOURCES.wayfarer,
  {
    publisher: "Ray-Ban",
    title: "Report fakes",
    url: "https://www.ray-ban.com/usa/getsupport/report-fakes",
  },
];

/** Price section: the in-stock Ray-Ban range and a row per model hub, or the collection link without stock. */
function priceSection(rayBan) {
  const collection = link("colección Ray-Ban", RAY_BAN_PATH);
  const range = priceRange(rayBan);
  if (rayBan.length === 0 || !range) {
    return {
      answer: `Por el momento no hay Ray-Ban con stock en Smile, así que no podemos darte un rango de precios actualizado. Podés ver los modelos agotados en la ${collection} y consultarnos por WhatsApp por su reposición y su precio antes de decidir la compra.`,
      blocks: [{ type: "paragraph", text: STORE_PAYMENT_SENTENCE }],
    };
  }

  const rows = RAY_BAN_MODEL_HUBS.map((hub) => ({ hub, products: rayBan.filter(hub.matches) }))
    .filter(({ products }) => products.length > 0)
    .map(({ hub, products }) => [
      link(`Ray-Ban ${hub.name}`, hub.path),
      String(products.length),
      pesosRange(priceRange(products)),
    ]);

  return {
    answer: `Hoy hay ${modelsPhrase(rayBan.length)} de Ray-Ban con stock en Smile, de ${pesosRange(range)}. Son los precios publicados en el catálogo de la tienda, que se sincronizan con Tiendanube cada hora y pueden cambiar; la tabla muestra cuántos modelos y qué rango tiene cada línea.`,
    blocks: [
      ...(rows.length > 0
        ? [
            {
              type: "table",
              catalog: true,
              caption: "Ray-Ban con stock en Smile por línea de modelos, con el rango de precios publicado en pesos.",
              head: ["Línea", "Modelos con stock", "Precios"],
              rows,
            },
          ]
        : []),
      {
        type: "paragraph",
        text: `${STORE_PAYMENT_SENTENCE} Para ver todos los modelos, incluidos los agotados, entrá a la ${collection}.`,
      },
    ],
  };
}

export function rayBanRosarioGuide({ inStock }) {
  const rayBan = inStock.filter((product) => isRayBanProduct(product) && isSunglassesProduct(product));
  const price = priceSection(rayBan);

  return {
    slug: GUIDE_SLUGS.rayBanRosario,
    title: "Dónde comprar Ray-Ban originales en Rosario",
    h1: "Dónde comprar Ray-Ban originales en Rosario",
    description:
      `Comprá Ray-Ban originales en Rosario: ${STORE_PICKUP_PHRASE}, envíos a todo el país y cómo comprobar que sean originales.`,
    summary:
      `Cómo comprar Ray-Ban originales en Smile desde Rosario: ${STORE_PICKUP_PHRASE}, envíos al país, precios y cómo comprobar que sean originales.`,
    crumb: "Ray-Ban en Rosario",
    datePublished: "2026-11-06",
    dateModified: "2026-11-06",
    about: ["Ray-Ban", "Rosario", "Anteojos de sol", "Comprar online"],
    lead: `En Rosario podés comprar Ray-Ban originales e importados en Smile, una tienda online de Rosario, Santa Fe: elegís el modelo en la web, hay ${STORE_PICKUP_PHRASE}, y si estás en otra ciudad enviamos a todo el país. Antes de pagar, comprobá los grabados y el código del modelo.`,
    sections: [
      {
        id: "donde-comprar-en-rosario",
        heading: "¿Dónde comprar Ray-Ban originales en Rosario?",
        answer: `Una opción es Smile, tienda online de Rosario que vende anteojos de sol Ray-Ban originales e importados. Elegís el modelo en la ${link("colección Ray-Ban", RAY_BAN_PATH)}, nos escribís por WhatsApp y vemos el retiro (${STORE_PICKUP_PHRASE}); si preferís, te lo enviamos a cualquier punto del país.`,
        blocks: [
          {
            type: "paragraph",
            text: `Smile funciona online: no hay un local abierto al público, y el retiro se acuerda de antemano con un mensaje. Por eso conviene escribir antes de acercarte, con el modelo que te interesa y el día en que querés pasar. ${STORE_LOCATION_SENTENCE}`,
          },
          {
            type: "paragraph",
            text: "Sea cual sea la tienda que elijas, la regla es la misma: pedí el código de modelo y la medida antes de pagar, y comprobá que coincidan con los que publica Ray-Ban. Más abajo está el detalle de los controles.",
          },
        ],
      },
      {
        id: "como-comprar-en-smile",
        heading: "¿Cómo comprar en Smile si estás en Rosario?",
        answer:
          `Elegís el modelo en la tienda, lo comprás en el checkout o nos escribís por WhatsApp para el ${STORE_PICKUP_PHRASE}. Si estás en otra ciudad, el pedido viaja por envío a todo el país. En ambos casos podés consultarnos el código y la medida del modelo antes de decidir.`,
        blocks: [
          {
            type: "steps",
            items: [
              {
                title: "Elegí el modelo",
                text: `Mirá la ${link("colección Ray-Ban", RAY_BAN_PATH)} o la línea que te interesa: cada ficha muestra el precio, el stock y las especificaciones del modelo.`,
              },
              {
                title: "Consultá lo que necesites",
                text: "Si querés confirmar el código, la medida o la disponibilidad antes de pagar, escribinos por WhatsApp desde la ficha del producto.",
              },
              {
                title: "Pagá y elegí cómo recibirlo",
                text: `La compra se confirma en el checkout. Después podés elegir el ${STORE_PICKUP_PHRASE} o recibir el pedido en tu domicilio.`,
              },
            ],
          },
          {
            type: "paragraph",
            text: STORE_PAYMENT_SENTENCE,
          },
        ],
      },
      {
        id: "precios-ray-ban-en-smile",
        heading: "¿Cuánto cuestan los Ray-Ban en Smile?",
        answer: price.answer,
        blocks: price.blocks,
      },
      {
        id: "como-saber-si-son-originales",
        heading: "¿Cómo comprobar que unos Ray-Ban son originales?",
        answer:
          "Revisá tres cosas: que el lente derecho tenga grabado el logo de Ray-Ban y el izquierdo las iniciales «RB», que la patilla izquierda muestre el código de modelo y la medida, y que esos datos coincidan con los que publica la marca. Desconfiá de descuentos enormes y de sitios sin conexión segura.",
        blocks: [
          {
            type: "list",
            ordered: false,
            items: [
              "Lentes: según Ray-Ban, el derecho lleva el logo de la marca y el izquierdo las iniciales «RB»; los polarizados suman una «P».",
              "Patilla: del lado interno de la izquierda, el código de modelo (por ejemplo RB3025) y la medida en milímetros.",
              "Datos: el código y la medida tienen que coincidir con los que figuran en la ficha del modelo en ray-ban.com.",
              "Oferta: un descuento enorme e igual en todos los modelos, o un sitio sin HTTPS, son señales de alerta.",
            ],
          },
          {
            type: "paragraph",
            text: `Es un resumen. La tabla de códigos y medidas de cinco modelos clásicos, las señales de una falsificación y las fuentes están en la guía ${link("cómo saber si unos Ray-Ban son originales", guidePath(GUIDE_SLUGS.rayBanOriginals))}.`,
          },
        ],
      },
      {
        id: "que-modelo-elegir",
        heading: "¿Qué modelo de Ray-Ban elegir?",
        answer:
          "Depende de tu rostro y del uso. Ray-Ban sugiere armazones que contrasten con la cara: formas angulosas para rostros redondeados y formas redondas para rostros angulosos. Si vas a manejar o a estar cerca del agua, conviene un lente polarizado. La guía de modelos compara las cinco líneas.",
        blocks: [
          {
            type: "links",
            items: RAY_BAN_MODEL_HUBS.map((hub) => ({ label: `Ray-Ban ${hub.name}`, href: hub.path })),
          },
          {
            type: "paragraph",
            text: `Para comparar forma, armazón y lentes, leé ${link("Aviador, Wayfarer o Round: cuál elegir", guidePath(GUIDE_SLUGS.rayBanModels))}, y si dudás por los lentes, ${link("qué son los anteojos polarizados y cuándo convienen", guidePath(GUIDE_SLUGS.polarized))}.`,
          },
        ],
      },
    ],
    faqs: [
      {
        question: "¿Puedo retirar mi compra en Rosario?",
        answer:
          `Sí. Smile ofrece ${STORE_PICKUP_PHRASE}, Rosario: escribinos con tu pedido y acordamos el momento.`,
      },
      {
        question: "¿Hacen envíos fuera de Rosario?",
        answer:
          `Sí, Smile envía a todo el país. ${FREE_SHIPPING_PHRASE}.`,
      },
      {
        question: "¿Cómo sé que los Ray-Ban de Smile son originales?",
        answer:
          "Smile vende anteojos de sol Ray-Ban originales e importados. Aun así, podés comprobarlo con los datos de la marca: los grabados de los lentes, el código de modelo y la medida de la patilla. Si querés confirmarlos antes de comprar, consultanos por WhatsApp.",
      },
    ],
    sources: SOURCES,
  };
}
