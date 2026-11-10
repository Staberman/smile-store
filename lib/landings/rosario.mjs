// Landing page: anteojos de sol en Rosario. Written for the local queries
// ("anteojos de sol rosario", "lentes de sol rosario precios", "… mujer",
// "… hombre"). Its edge over local opticians is what they leave out: the
// prices and stock of every model, the payment terms and the originals.
// Prices, counts and models come from the products in stock; payment,
// shipping and pickup from lib/store-copy.mjs. Nothing here describes a
// storefront, an address, opening hours, a warranty or an official status.
import { hubFacts, hubPriceBlock, priceRange, RAY_BAN_MODEL_HUBS, SUNGLASSES_HUB } from "../collection-hubs.mjs";
import { isPolarizedProduct } from "../guides/anteojos-polarizados.mjs";
import { GUIDE_LINKS, GUIDE_SLUGS, guidePath, link } from "../guides/shared.mjs";
import { formatPrice } from "../price-format.mjs";
import { fitDescription, listPhrase } from "../product-seo.mjs";
import {
  CHECKOUT_PHRASE,
  FREE_SHIPPING_PHRASE,
  INSTALLMENTS_PHRASE,
  STORE_LOCATION,
  STORE_PICKUP_PHRASE,
  TRANSFER_DISCOUNT_PHRASE,
} from "../store-copy.mjs";
import { PICKUP_FAQ_ANSWER } from "../store-faqs.mjs";
import { filterStorefrontProducts, getTransferPrice } from "../storefront.mjs";
import {
  audienceSentence,
  brandGroups,
  brandsPhrase,
  cheapestPerBrand,
  landingLinks,
  LANDING_PATHS,
  modelsPhrase,
  polarizedPhrase,
  PREMIUM_PATH,
  pricesLabel,
  pricesSpan,
  RAY_BAN_PATH,
  rayBanOf,
  STYLE_GUIDE_PATH,
  SUNGLASSES_PATH,
  sunglassesOf,
  unisexSentence,
} from "./shared.mjs";

/** ISO dates of the page's copy; update `modified` when the copy changes. */
export const ROSARIO_DATES = { published: "2026-11-10", modified: "2026-11-10" };

const CITY = STORE_LOCATION.locality;

/** Meta description: one sentence with the in-stock count and lowest price, 140-155 characters. */
function rosarioDescription(sunglasses, range) {
  if (!range) {
    return fitDescription({
      leads: [
        `Lentes y anteojos de sol originales en ${CITY}: mirá los modelos de Smile, con ${STORE_PICKUP_PHRASE} y envíos a todo el país.`,
        `Anteojos de sol originales en ${CITY}: mirá los modelos de Smile, con ${STORE_PICKUP_PHRASE} y envíos a todo el país.`,
      ],
    });
  }
  const count = modelsPhrase(sunglasses.length);
  const from = sunglasses.length === 1 ? `a ${formatPrice(range.min)}` : `desde ${formatPrice(range.min)}`;
  return fitDescription({
    leads: [
      `Lentes y anteojos de sol originales en ${CITY}: ${count} con stock ${from}, ${STORE_PICKUP_PHRASE} y envíos al país.`,
      `Anteojos de sol originales en ${CITY}: ${count} con stock ${from}, ${STORE_PICKUP_PHRASE} y envíos al país.`,
      `Anteojos de sol originales en ${CITY}: ${count} con stock ${from} y ${STORE_PICKUP_PHRASE}.`,
    ],
  });
}

function rosarioLead(sunglasses, range) {
  const store = `Smile es una tienda online de ${CITY}, ${STORE_LOCATION.region}, con anteojos de sol originales e importados`;
  if (!range) {
    return `${store}. Por el momento no hay modelos con stock: consultanos por WhatsApp por la reposición de los agotados. Cuando compres, elegís el ${STORE_PICKUP_PHRASE} o el envío a cualquier punto del país.`;
  }
  return `${store} y el precio de cada modelo a la vista. Hoy hay ${modelsPhrase(sunglasses.length)} con stock, ${pricesSpan(range, sunglasses.length)}. Comprás en la web, pagás en el ${CHECKOUT_PHRASE} y elegís el ${STORE_PICKUP_PHRASE} o el envío a cualquier punto del país.`;
}

const HOW_TO_BUY = {
  id: "como-comprar-en-rosario",
  heading: `Cómo comprar anteojos de sol en ${CITY}`,
  answer: `Elegís el modelo en la web, lo pagás online y después lo retirás en ${CITY} o lo recibís en tu casa. Smile funciona online: el retiro se acuerda de antemano por WhatsApp, y si estás en otra ciudad, el pedido viaja con envío a todo el país.`,
  blocks: [
    {
      type: "steps",
      items: [
        {
          title: "Elegí el modelo",
          text: `Cada ficha muestra el precio, el stock y las especificaciones. Podés empezar por ${link("todos los anteojos de sol", SUNGLASSES_PATH)} o por la ${link("colección Ray-Ban", RAY_BAN_PATH)}.`,
        },
        {
          title: "Pagá online",
          text: `La compra se confirma en el ${CHECKOUT_PHRASE}, en ${INSTALLMENTS_PHRASE} o con ${TRANSFER_DISCOUNT_PHRASE}.`,
        },
        {
          title: "Retirá o recibí tu pedido",
          text: `Coordinamos el retiro por WhatsApp o te lo mandamos a domicilio con envío a todo el país. ${FREE_SHIPPING_PHRASE}.`,
        },
      ],
    },
    {
      type: "paragraph",
      text: "¿Tenés dudas sobre un modelo, su medida o su disponibilidad? Escribinos por WhatsApp desde la ficha del producto antes de pagar.",
    },
  ],
  items: [],
};

/** Prices by brand: a row per brand with stock, or the no-stock answer. */
function pricesSection(sunglasses, { brandLabel, brandHref }) {
  const base = { id: "precios-por-marca", heading: `Lentes de sol en ${CITY}: precios por marca`, items: [] };
  if (sunglasses.length === 0) {
    return {
      ...base,
      answer: `Por el momento no hay anteojos de sol con stock, así que no hay precios actualizados para mostrar. Podés ver los modelos agotados en ${link("anteojos de sol", SUNGLASSES_PATH)} y consultarnos por WhatsApp por su reposición y su precio.`,
      blocks: [],
    };
  }
  const groups = brandGroups(sunglasses, brandLabel);
  const brands = groups.length === 1 ? "una marca" : `${groups.length} marcas`;
  return {
    ...base,
    answer: `Hoy hay anteojos de sol con stock de ${brands}. Los precios son los publicados en la tienda: se sincronizan con Tiendanube cada hora y pueden cambiar. La tabla muestra cuántos modelos tiene cada marca y su rango de precios; el precio por transferencia y las cuotas se calculan sobre esos valores.`,
    blocks: [
      {
        type: "table",
        catalog: true,
        caption: "Anteojos de sol con stock en Smile por marca, con el rango de precios publicado.",
        head: ["Marca", "Modelos con stock", "Precios"],
        rows: groups.map(({ brand, products }) => {
          const href = brandHref(brand);
          const range = priceRange(products);
          return [href ? link(brand, href) : brand, String(products.length), range ? pricesLabel(range) : "Consultar"];
        }),
      },
    ],
  };
}

function samplesSection(sunglasses, brandLabel) {
  const picks = cheapestPerBrand(sunglasses, brandLabel);
  return {
    id: "modelos-con-stock",
    heading: "Algunos modelos con stock",
    answer: `Un modelo por marca, el más económico de cada una, para que veas la variedad de la colección. Los ${modelsPhrase(sunglasses.length)} con stock están en ${link("anteojos de sol", SUNGLASSES_PATH)}.`,
    blocks: [],
    items: picks.map((product) => ({ product, label: brandLabel(product.brand) })),
  };
}

function audienceSection(sunglasses, audienceHubs, brandLabel) {
  const formats = hubFacts(sunglasses, { brandLabel }).formats.slice(0, 6);
  return {
    id: "mujer-y-hombre",
    heading: "Anteojos de sol para mujer y para hombre",
    answer: [
      unisexSentence(sunglasses),
      formats.length > 0 ? `Hay formatos ${listPhrase(formats)}, de ${brandsPhrase(sunglasses, brandLabel)}.` : "",
      audienceSentence(audienceHubs),
    ]
      .filter(Boolean)
      .join(" "),
    blocks: [
      {
        type: "paragraph",
        text: `¿No sabés qué formato elegir? La ${link("guía de estilo", STYLE_GUIDE_PATH)} explica qué anteojos favorecen a cada forma de rostro.`,
      },
    ],
    items: [],
  };
}

function collectionsSection(sunglasses, brandLabel) {
  const rayBan = rayBanOf(sunglasses);
  const lines = RAY_BAN_MODEL_HUBS.filter((hub) => rayBan.some(hub.matches)).map((hub) => hub.name);
  const premium = filterStorefrontProducts(sunglasses, "premium");
  const polarized = sunglasses.filter(isPolarizedProduct);
  const polarizedGuide = link("qué son los anteojos polarizados y cuándo convienen", guidePath(GUIDE_SLUGS.polarized));

  return {
    id: "ray-ban-polarizados-y-premium",
    heading: "Ray-Ban, polarizados y marcas premium",
    answer: [
      rayBan.length > 0
        ? `En la ${link("colección Ray-Ban", RAY_BAN_PATH)} hay ${modelsPhrase(rayBan.length)} con stock${
            lines.length > 0 ? `, con líneas como ${listPhrase(lines)}` : ""
          }.`
        : `La ${link("colección Ray-Ban", RAY_BAN_PATH)} no tiene modelos con stock por el momento.`,
      premium.length > 0
        ? `Las ${link("marcas premium", PREMIUM_PATH)} suman ${modelsPhrase(premium.length)}, de ${brandsPhrase(premium, brandLabel)}.`
        : "",
      polarized.length > 0
        ? `Si vas a manejar o a pasar el día cerca del agua, hay ${polarizedPhrase(polarized.length)}; la guía ${polarizedGuide} explica qué cambia.`
        : `Si vas a manejar o a pasar el día cerca del agua, mirá ${polarizedGuide}.`,
    ]
      .filter(Boolean)
      .join(" "),
    blocks: [
      {
        type: "paragraph",
        text: `Si buscás Ray-Ban en particular, la guía ${link("dónde comprar Ray-Ban originales en Rosario", guidePath(GUIDE_SLUGS.rayBanRosario))} reúne los precios por línea y los controles para comprobar el modelo antes de pagar.`,
      },
    ],
    items: [],
  };
}

const ORIGINALS = {
  id: "como-reconocer-originales",
  heading: "Cómo reconocer anteojos de sol originales",
  answer:
    "Smile vende anteojos de sol originales e importados. En cualquier compra, la regla es la misma: pedí el código de modelo y la medida antes de pagar, y comprobá que coincidan con los que publica la marca. En los Ray-Ban, además, el lente derecho lleva grabado el logo y el izquierdo, las iniciales «RB».",
  blocks: [
    {
      type: "paragraph",
      text: `La tabla de códigos y medidas de los modelos clásicos, las señales de una falsificación y las fuentes están en la guía ${link("cómo saber si unos Ray-Ban son originales", guidePath(GUIDE_SLUGS.rayBanOriginals))}.`,
    },
  ],
  items: [],
};

function rosarioFaqs(sunglasses, range) {
  return [
    {
      question: `¿Dónde comprar anteojos de sol en ${CITY}?`,
      answer: `En Smile, una tienda online de ${CITY} que vende anteojos de sol originales e importados, con el precio y el stock de cada modelo a la vista. Comprás en la web y elegís retiro en ${CITY} o envío a domicilio.`,
    },
    {
      question: `¿Cuánto cuestan los lentes de sol en ${CITY}?`,
      answer: range
        ? `En Smile, ${
            sunglasses.length === 1
              ? `el único modelo con stock cuesta ${formatPrice(range.min)}`
              : `los ${sunglasses.length} modelos con stock cuestan ${pricesSpan(range, sunglasses.length)}`
          }. Podés pagar en ${INSTALLMENTS_PHRASE} o con ${TRANSFER_DISCOUNT_PHRASE}: el más económico queda en ${formatPrice(getTransferPrice(range.min))} por transferencia.`
        : `Por el momento no hay anteojos de sol con stock en Smile. Consultanos por WhatsApp por precio y reposición; cuando vuelvan a estar en stock, podés pagar en ${INSTALLMENTS_PHRASE} o con ${TRANSFER_DISCOUNT_PHRASE}.`,
    },
    { question: `¿Puedo retirar en ${CITY}?`, answer: PICKUP_FAQ_ANSWER },
    {
      question: "¿Los anteojos de sol de Smile son originales?",
      answer:
        "Sí. Smile vende anteojos de sol originales e importados. Si querés comprobar un modelo antes de comprar, consultanos por WhatsApp el código y la medida, y comparalos con los que publica la marca.",
    },
    {
      question: `¿Hacen envíos fuera de ${CITY}?`,
      answer: `Sí, Smile envía a todo el país. ${FREE_SHIPPING_PHRASE}.`,
    },
  ];
}

/**
 * The Rosario landing page from the products in stock. `audienceHubs` are
 * the indexed mujer / hombre sunglasses hubs; `brandHref` gives a brand's
 * page, or null.
 */
export function rosarioLanding({ inStock, brandLabel, brandHref, audienceHubs, date = new Date() }) {
  const sunglasses = sunglassesOf(inStock);
  // Without stock or prices, the page says so instead of showing figures.
  const range = priceRange(sunglasses);
  const links = landingLinks(date);
  const priceBlock = range ? hubPriceBlock(SUNGLASSES_HUB, sunglasses, formatPrice) : null;
  const sections = [
    HOW_TO_BUY,
    pricesSection(sunglasses, { brandLabel, brandHref }),
    ...(range
      ? [samplesSection(sunglasses, brandLabel), audienceSection(sunglasses, audienceHubs, brandLabel)]
      : []),
    collectionsSection(sunglasses, brandLabel),
    ORIGINALS,
  ];

  return {
    key: "rosario",
    path: LANDING_PATHS.rosario,
    title: `Anteojos de sol en ${CITY}: precios y modelos`,
    h1: `Anteojos y lentes de sol en ${CITY}`,
    eyebrow: `${CITY}, ${STORE_LOCATION.region}`,
    crumb: `En ${CITY}`,
    linkLabel: links.rosario.label,
    summary: `Anteojos de sol originales desde ${CITY}: precios por marca de los modelos con stock, retiro en ${CITY} y envíos a todo el país.`,
    description: rosarioDescription(sunglasses, range),
    lead: rosarioLead(sunglasses, range),
    priceBlock: priceBlock && { ...priceBlock, heading: `Precios de anteojos de sol en ${CITY}` },
    sections,
    faqTitle: `Preguntas frecuentes sobre anteojos de sol en ${CITY}`,
    faqs: rosarioFaqs(sunglasses, range),
    links: [
      { label: "Todos los anteojos de sol", href: SUNGLASSES_PATH },
      ...audienceHubs.map((hub) => ({ label: hub.linkLabel, href: hub.path })),
      { label: "Ray-Ban", href: RAY_BAN_PATH },
      { label: "Marcas premium", href: PREMIUM_PATH },
      links.summer,
      GUIDE_LINKS.rayBanRosario,
      GUIDE_LINKS.polarized,
      GUIDE_LINKS.rayBanOriginals,
    ],
    products: sections.flatMap((section) => section.items.map((item) => item.product)),
    datePublished: ROSARIO_DATES.published,
    dateModified: ROSARIO_DATES.modified,
  };
}
