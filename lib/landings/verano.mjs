// Landing page: anteojos de sol para el verano, at a URL without the year so
// it keeps its links from one season to the next. The season label ("verano
// 2027") and the Christmas angle follow the build date (summerSeason). Every
// list, count and price comes from the products in stock; best sellers only
// when the sales ranking names enough of them, else a sample by frame
// format. The offers section exists only while some card shows a
// promotional price. No trend, ranking or health claim is made up: UV copy
// is general and says what the product sheets state.
import { hubFacts, hubPriceBlock, priceRange, productGender, SUNGLASSES_HUB } from "../collection-hubs.mjs";
import { isPolarizedProduct } from "../guides/anteojos-polarizados.mjs";
import { GUIDE_LINKS, GUIDE_SLUGS, guidePath, link } from "../guides/shared.mjs";
import { formatPrice } from "../price-format.mjs";
import { fitDescription, listPhrase } from "../product-seo.mjs";
import {
  FREE_SHIPPING_PHRASE,
  INSTALLMENTS_PHRASE,
  STORE_LOCATION,
  STORE_PICKUP_PHRASE,
  TRANSFER_DISCOUNT_PHRASE,
} from "../store-copy.mjs";
import { RETURNS_FAQ_ANSWER } from "../store-faqs.mjs";
import { cardPrice, FREE_SHIPPING_MINIMUM_ARS, getTransferPrice } from "../storefront.mjs";
import {
  audienceProducts,
  audienceSentence,
  brandsPhrase,
  cheapestPerBrand,
  giftBands,
  LANDING_GRID_LIMIT,
  landingLinks,
  LANDING_PATHS,
  laterDate,
  modelsPhrase,
  onePerFormat,
  polarizedPhrase,
  PREMIUM_PATH,
  pricesLabel,
  pricesSpan,
  RAY_BAN_PATH,
  saleProducts,
  statesUvProtection,
  STYLE_GUIDE_PATH,
  summerSeason,
  SUNGLASSES_PATH,
  sunglassesOf,
  unisexSentence,
} from "./shared.mjs";

/**
 * ISO dates of the page's copy; update `modified` when the copy changes.
 * The page's dateModified is the later of this and the last calendar switch
 * (summerSeason().since).
 */
export const SUMMER_DATES = { published: "2026-11-10", modified: "2026-11-10" };

/** Fewer best sellers in stock than this and the page shows a sample instead. */
export const MIN_BEST_SELLERS = 4;

const POLARIZED_GUIDE_PATH = guidePath(GUIDE_SLUGS.polarized);

const capitalize = (text) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
const byBrand = (brandLabel) => (product) => ({ product, label: brandLabel(product.brand) });

/** The section without the `summary` the lead and FAQ read. */
function withoutSummary(section) {
  const copy = { ...section };
  delete copy.summary;
  return copy;
}

/** Meta description: one sentence, 140-155 characters, from the stock. */
function summerDescription(season, sunglasses, range, polarized) {
  const subjects = [`Anteojos y lentes de sol para el ${season.label}`, `Anteojos de sol para el ${season.label}`];
  if (!range) {
    return fitDescription({
      leads: subjects.map(
        (subject) => `${subject} en Smile: qué mirar en polarizados y protección UV, y cómo elegir anteojos originales para regalar.`,
      ),
    });
  }
  const stock =
    sunglasses.length === 1
      ? `1 modelo original con stock a ${formatPrice(range.min)}`
      : `${sunglasses.length} modelos originales con stock desde ${formatPrice(range.min)}`;
  const gifts = season.christmas ? ["ideas para regalar en Navidad", "ideas para regalar"] : ["ideas para regalar"];
  const tails = gifts.flatMap((gift) => [
    ...(polarized.length > 0 ? [`con polarizados, protección UV e ${gift}`] : []),
    `con protección UV e ${gift}`,
  ]);
  return fitDescription({
    leads: tails.flatMap((tail) => subjects.map((subject) => `${subject}: ${stock}, ${tail}.`)),
  });
}

function summerLead(season, sunglasses, range, { brandLabel, picksFrom }) {
  const intro = `Anteojos de sol originales para el ${season.label}`;
  if (!range) {
    return `${intro}. Por el momento no hay modelos con stock en Smile: consultanos por WhatsApp por la reposición. Mientras tanto, más abajo te contamos qué mirar en los polarizados y en la protección UV antes de elegir.`;
  }
  const gifts = season.christmas ? "precios para regalar en Navidad" : "precios para regalar";
  const count = sunglasses.length;
  const prices =
    count > 1 && range.min !== range.max ? `con precios ${pricesSpan(range, count)}` : pricesSpan(range, count);
  return `${intro}, con lo que hoy hay en stock en Smile: ${modelsPhrase(count)} de ${brandsPhrase(
    sunglasses,
    brandLabel,
  )}, ${prices}. Abajo están ${picksFrom}, los modelos para mujer y para hombre, los polarizados para playa y ruta y ${gifts}.`;
}

/**
 * "Los más elegidos" from the sales ranking when it names enough in-stock
 * sunglasses; otherwise one model per frame format (or per brand, when no
 * sheet states a format), with a heading that says which. `summary` names
 * the section in the lead and the FAQ; the page drops it.
 */
function picksSection(sunglasses, bestSellers, brandLabel) {
  const inStock = new Set(sunglasses.map((product) => product.id));
  const ranked = sunglassesOf(bestSellers).filter((product) => inStock.has(product.id));
  if (ranked.length >= MIN_BEST_SELLERS) {
    return {
      id: "los-mas-elegidos",
      heading: "Los más elegidos",
      answer: `Los anteojos de sol con stock que más se vendieron en Smile, según las ventas registradas en Tiendanube. Si buscás otro estilo, los ${modelsPhrase(sunglasses.length)} con stock están en ${link("anteojos de sol", SUNGLASSES_PATH)}.`,
      blocks: [],
      items: ranked.slice(0, LANDING_GRID_LIMIT).map(byBrand(brandLabel)),
      summary: "los más elegidos",
    };
  }

  const formats = onePerFormat(sunglasses, brandLabel);
  if (formats.length === 0) {
    return {
      id: "un-modelo-por-marca",
      heading: "Un modelo de cada marca",
      answer: `Un modelo por marca, el más económico de cada una, para que veas la variedad antes de elegir. Los ${modelsPhrase(sunglasses.length)} con stock están en ${link("anteojos de sol", SUNGLASSES_PATH)}.`,
      blocks: [],
      items: cheapestPerBrand(sunglasses, brandLabel).map(byBrand(brandLabel)),
      summary: "un modelo de cada marca",
    };
  }
  const names = formats.map((entry) => entry.format);
  return {
    id: "un-modelo-de-cada-formato",
    heading: "Un modelo de cada formato",
    answer: `Según sus fichas, hay anteojos de sol con stock en formato ${listPhrase(names)}. Acá va un modelo de cada uno, de marcas distintas cuando hay opción, para que compares estilos antes de elegir. Si no sabés cuál te queda mejor, la ${link("guía de estilo", STYLE_GUIDE_PATH)} explica qué formato favorece a cada forma de rostro.`,
    blocks: [],
    items: formats.map(({ format, product }) => ({ product, label: capitalize(format) })),
    summary: "un modelo de cada formato",
  };
}

/** "Para mujer hay 12 modelos con stock, incluidos los unisex, de $ … a $ …." */
function audienceLine(products, label) {
  const range = priceRange(products);
  if (products.length === 0 || !range) return `Para ${label}, por el momento no hay modelos con stock.`;
  const unisex = products.some((product) => productGender(product) === "unisex") ? ", incluidos los unisex" : "";
  return `Para ${label} hay ${modelsPhrase(products.length)} con stock${unisex}, ${pricesSpan(range, products.length)}.`;
}

function audienceSection(sunglasses, audienceHubs) {
  const women = audienceProducts(sunglasses, "women").products;
  const men = audienceProducts(sunglasses, "men").products;
  const menIds = new Set(men.map((product) => product.id));
  // While every gendered model is unisex, both lists are the same: say it once.
  const same = women.length === men.length && women.every((product) => menIds.has(product.id));
  const range = priceRange(women);
  const lines =
    same && range
      ? [
          `Así, las selecciones para mujer y para hombre coinciden: ${modelsPhrase(women.length)} con stock, ${pricesSpan(
            range,
            women.length,
          )}.`,
        ]
      : [audienceLine(women, "mujer"), audienceLine(men, "hombre")];
  return {
    id: "mujer-y-hombre",
    heading: "Anteojos de sol para mujer y para hombre",
    answer: [unisexSentence(sunglasses), ...lines, audienceSentence(audienceHubs)].filter(Boolean).join(" "),
    blocks: [
      {
        type: "paragraph",
        text: `Más que seguir una tendencia, conviene elegir el formato que acompañe tu rostro y el uso que le vas a dar: la ${link("guía de estilo", STYLE_GUIDE_PATH)} explica qué anteojos favorecen a cada forma de cara.`,
      },
    ],
    items: [],
  };
}

/** Cards at a promotional price, the largest reduction first. Null without any. */
function offersSection(sale, brandLabel) {
  if (sale.length === 0) return null;
  const shown = sale.slice(0, LANDING_GRID_LIMIT);
  const more =
    sale.length > shown.length
      ? ` Acá están los ${shown.length} de mayor rebaja; el resto figura con su precio en ${link("anteojos de sol", SUNGLASSES_PATH)}.`
      : "";
  return {
    id: "ofertas",
    heading: "Anteojos de sol en oferta",
    answer: [
      `Hoy hay ${modelsPhrase(sale.length)} con stock y precio promocional: el precio de cada tarjeta ya tiene aplicada la rebaja publicada en la tienda.${more}`,
      unisexSentence(sale, { one: "modelo en oferta", many: "modelos en oferta" }),
    ]
      .filter(Boolean)
      .join(" "),
    blocks: [],
    items: shown.map(byBrand(brandLabel)),
  };
}

function polarizedSection(polarized, brandLabel) {
  const shown = [...polarized]
    .sort((a, b) => (cardPrice(a) ?? 0) - (cardPrice(b) ?? 0) || a.name.localeCompare(b.name, "es"))
    .slice(0, LANDING_GRID_LIMIT);
  return {
    id: "polarizados-para-playa-y-ruta",
    heading: "Polarizados para playa y ruta",
    answer: [
      "Los lentes polarizados bloquean el reflejo que rebota en superficies planas, como el agua, la nieve o el asfalto mojado: por eso se usan tanto en la playa, cerca del agua y para manejar de día.",
      polarized.length > 0
        ? `Hoy hay ${polarizedPhrase(polarized.length)} con stock en Smile.`
        : "Por el momento no hay modelos polarizados con stock: consultanos por WhatsApp por su reposición.",
    ].join(" "),
    blocks: [
      {
        type: "paragraph",
        text: `Antes de elegir, leé ${link("qué son los anteojos polarizados y cuándo convienen", POLARIZED_GUIDE_PATH)}: también cuenta cuándo no conviene usarlos, por ejemplo con pantallas.`,
      },
    ],
    items: shown.map(byBrand(brandLabel)),
  };
}

function uvSection(sunglasses) {
  const declared = sunglasses.filter(statesUvProtection).length;
  const total = sunglasses.length;
  let stock = "";
  if (total === 1 && declared === 1) {
    stock = "Según su ficha, el modelo con stock la declara.";
  } else if (total > 1 && declared > 0) {
    const share = declared === total ? `los ${total}` : `${declared} de los ${total}`;
    stock = `Según sus fichas, ${share} modelos con stock de Smile la declaran; si un modelo no la indica, consultanos antes de comprar.`;
  }
  return {
    id: "proteccion-uv",
    heading: "Protección UV: qué mirar en la ficha",
    answer: [
      "Lo que protege los ojos de la radiación ultravioleta es el filtro UV del lente, no qué tan oscuro es ni si es polarizado. En la ficha o en la etiqueta, buscá la indicación UV400 o el bloqueo de los rayos UVA y UVB.",
      stock,
    ]
      .filter(Boolean)
      .join(" "),
    blocks: [
      {
        type: "paragraph",
        text: `En la Argentina, la Disposición 562/2019 de la ANMAT exige que el rótulo de los anteojos para sol indique la categoría de filtro y el cumplimiento de la protección UV. La diferencia entre polarización y filtro UV está explicada en ${link("la guía de anteojos polarizados", `${POLARIZED_GUIDE_PATH}#polarizado-o-proteccion-uv`)}.`,
      },
    ],
    items: [],
  };
}

function giftsSection(season, sunglasses, brandLabel) {
  const heading = season.christmas ? "Anteojos de sol para regalar en Navidad" : "Anteojos de sol para regalar";
  const watchGift = `Y si el regalo es un reloj, mirá ${link("cómo elegir un reloj para regalar", guidePath(GUIDE_SLUGS.watchGift))}.`;
  const bands = giftBands(sunglasses, { minimumArs: FREE_SHIPPING_MINIMUM_ARS, brandLabel });
  if (bands.length === 0) {
    return {
      id: "para-regalar",
      heading,
      answer: `Por el momento no hay anteojos de sol con stock para regalar: consultanos por WhatsApp por la reposición. ${watchGift}`,
      blocks: [],
      items: [],
    };
  }
  return {
    id: "para-regalar",
    heading,
    answer: `${season.christmas ? "Para Navidad" : "Para un regalo"}, el presupuesto suele mandar: la tabla agrupa los modelos con stock por precio. Todos se pueden pagar en ${INSTALLMENTS_PHRASE} o con ${TRANSFER_DISCOUNT_PHRASE}. ${FREE_SHIPPING_PHRASE}.`,
    blocks: [
      {
        type: "table",
        catalog: true,
        caption: "Anteojos de sol con stock en Smile por presupuesto, con el rango de precios publicado.",
        head: ["Presupuesto", "Modelos con stock", "Precios", "Marcas"],
        rows: bands.map((band) => [band.label, String(band.count), pricesLabel(band.range), band.brands]),
      },
      {
        type: "paragraph",
        text: `Si lo necesitás para una fecha, consultanos por WhatsApp los tiempos de envío antes de comprar, o coordiná el retiro en ${STORE_LOCATION.locality}. ${watchGift}`,
      },
    ],
    items: [],
  };
}

function summerFaqs(season, sunglasses, range, sale, { brandLabel, picksFrom }) {
  const formats = hubFacts(sunglasses, { brandLabel }).formats.slice(0, 5);
  const trend = range
    ? `En Smile no armamos rankings de moda: mostramos lo que hay con stock. Hoy hay ${modelsPhrase(sunglasses.length)} de ${brandsPhrase(
        sunglasses,
        brandLabel,
      )}${formats.length > 0 ? `, en formatos ${listPhrase(formats)}` : ""}. Más arriba tenés ${picksFrom}, y la guía de estilo explica qué formato favorece a cada forma de rostro.`
    : "En Smile no armamos rankings de moda: mostramos lo que hay con stock, y por el momento no hay modelos disponibles. Consultanos por WhatsApp por la reposición.";
  const faqs = [
    { question: `¿Qué anteojos de sol están de moda para el ${season.label}?`, answer: trend },
    {
      question: "¿Cuánto cuestan los anteojos de sol en Smile?",
      answer: range
        ? `${
            sunglasses.length === 1
              ? `El único modelo con stock cuesta ${formatPrice(range.min)}`
              : `Los ${sunglasses.length} modelos con stock cuestan ${pricesSpan(range, sunglasses.length)}`
          }. Podés pagar en ${INSTALLMENTS_PHRASE} o con ${TRANSFER_DISCOUNT_PHRASE}: el más económico queda en ${formatPrice(getTransferPrice(range.min))} por transferencia.`
        : `Por el momento no hay anteojos de sol con stock. Consultanos por WhatsApp por precio y reposición; cuando vuelvan a estar en stock, podés pagar en ${INSTALLMENTS_PHRASE} o con ${TRANSFER_DISCOUNT_PHRASE}.`,
    },
  ];
  if (sale.length > 0) {
    faqs.push({
      question: "¿Hay anteojos de sol en oferta?",
      answer: `Sí. Hoy hay ${modelsPhrase(sale.length)} con stock y precio promocional publicado en la tienda; el precio que ves en cada tarjeta ya incluye la rebaja. Las promociones las define la tienda y pueden cambiar con cada actualización del catálogo.`,
    });
  }
  faqs.push(
    {
      question: "¿Conviene que los anteojos de sol sean polarizados?",
      answer:
        "Convienen si te molesta el reflejo: para manejar de día o para la playa y el agua. La polarización reduce ese reflejo, pero no reemplaza el filtro UV: son dos características distintas y conviene verificar las dos en la ficha.",
    },
    { question: "¿Se puede cambiar un regalo?", answer: RETURNS_FAQ_ANSWER },
    {
      question: "¿Hacen envíos a todo el país?",
      answer: `Sí, hacemos envíos a todo el país, y en ${STORE_LOCATION.locality} hay ${STORE_PICKUP_PHRASE}. ${FREE_SHIPPING_PHRASE}. Si lo necesitás para una fecha, consultanos por WhatsApp los tiempos de envío antes de comprar.`,
    },
  );
  return faqs;
}

/**
 * The summer landing page from the products in stock at `date` (the build
 * date by default). `bestSellers` is the sales ranking (lib/catalog
 * getBestSellers); `audienceHubs` are the indexed mujer / hombre hubs.
 */
export function summerLanding({ inStock, bestSellers = [], brandLabel, audienceHubs, date = new Date() }) {
  const season = summerSeason(date);
  const sunglasses = sunglassesOf(inStock);
  // Without stock or prices, the page says so instead of showing figures.
  const range = priceRange(sunglasses);
  const polarized = sunglasses.filter(isPolarizedProduct);
  const sale = saleProducts(sunglasses);
  const picks = range ? picksSection(sunglasses, bestSellers, brandLabel) : null;
  const picksFrom = picks?.summary ?? "";
  const links = landingLinks(date);
  const priceBlock = range ? hubPriceBlock(SUNGLASSES_HUB, sunglasses, formatPrice) : null;

  const sections = [
    ...(picks ? [withoutSummary(picks)] : []),
    ...(range ? [audienceSection(sunglasses, audienceHubs)] : []),
    offersSection(sale, brandLabel),
    polarizedSection(polarized, brandLabel),
    uvSection(sunglasses),
    giftsSection(season, sunglasses, brandLabel),
  ].filter(Boolean);

  return {
    key: "summer",
    path: LANDING_PATHS.summer,
    title: `Anteojos de sol ${season.label}: modelos y precios`,
    h1: `Anteojos de sol para el ${season.label}`,
    eyebrow: "Lentes de sol de temporada",
    crumb: capitalize(season.label),
    linkLabel: links.summer.label,
    season,
    summary: `Anteojos de sol para el ${season.label}: modelos con stock, polarizados, protección UV y precios para regalar.`,
    description: summerDescription(season, sunglasses, range, polarized),
    lead: summerLead(season, sunglasses, range, { brandLabel, picksFrom }),
    priceBlock: priceBlock && { ...priceBlock, heading: `Precios de anteojos de sol para el ${season.label}` },
    sections,
    faqTitle: `Preguntas frecuentes sobre anteojos de sol para el ${season.label}`,
    faqs: summerFaqs(season, sunglasses, range, sale, { brandLabel, picksFrom }),
    links: [
      { label: "Todos los anteojos de sol", href: SUNGLASSES_PATH },
      ...audienceHubs.map((hub) => ({ label: hub.linkLabel, href: hub.path })),
      { label: "Ray-Ban", href: RAY_BAN_PATH },
      { label: "Marcas premium", href: PREMIUM_PATH },
      links.rosario,
      GUIDE_LINKS.polarized,
      GUIDE_LINKS.rayBanModels,
      GUIDE_LINKS.watchGift,
    ],
    // Each product once, in the order the page shows it.
    products: [...new Map(sections.flatMap((section) => section.items).map((item) => [item.product.id, item.product])).values()],
    datePublished: SUMMER_DATES.published,
    dateModified: laterDate(SUMMER_DATES.modified, season.since),
  };
}
