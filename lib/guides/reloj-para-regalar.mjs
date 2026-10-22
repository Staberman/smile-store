// Guide: how to choose a watch as a gift. Styles come from Invicta's manual
// (diver's bezel, chronograph counters) and Watches of Switzerland (dress
// watches); quartz and automatic, from Invicta's manual, Seiko and Worn &
// Wound; case size, from Shinola's size guide; water resistance, from Seiko,
// Citizen and Invicta. Counts, prices, movements, diameters and ratings are
// read from the catalog at build time: nothing about Smile's stock or prices
// is written by hand.
import { productGender } from "../collection-hubs.mjs";
import { listPhrase } from "../product-seo.mjs";
import {
  GUIDE_SLUGS,
  guidePath,
  link,
  STORE_LOCATION_SENTENCE,
  STORE_PAYMENT_SENTENCE,
} from "./shared.mjs";
import {
  brandLinksPhrase,
  brandsOf,
  caseDiameter,
  fromBrandsPhrase,
  hasRotatingBezel,
  isWatchProduct,
  modelsPhrase,
  movementType,
  productsPriceLabel,
  WATCH_AUDIENCE_HUBS,
  WATCH_BRAND_HUBS,
  WATCHES_PATH,
  waterResistance,
} from "./watch-facts.mjs";

const NO_STOCK = "Sin stock por el momento";

const SOURCES = [
  {
    publisher: "Invicta",
    title: "Manual (PDF)",
    url: "https://www.invictawatch.com/storage/settings/November2024/qxEaYIdiLmqp1DrdGEXs.pdf",
  },
  {
    publisher: "Watches of Switzerland Group",
    title: "The Complete Calibre Guide To Dress Watches",
    url: "https://www.watches-of-switzerland.co.uk/calibre/in-depth/the-calibre-complete-guide-to-dress-watches",
  },
  {
    publisher: "Seiko",
    title: "Accuracy of Mechanical watches (preguntas frecuentes)",
    url: "https://www.seikowatches.com/global-en/customerservice/faq/mechanical",
  },
  {
    publisher: "Worn & Wound",
    title: "Horological Irony: The Dead-Beat Seconds (2016)",
    url: "https://wornandwound.com/horological-irony-dead-beat-seconds/",
  },
  {
    publisher: "Shinola",
    title: "Watch Size Guide",
    url: "https://www.shinola.com/pages/watch-size-guide",
  },
  {
    publisher: "Seiko",
    title: "Water Resistance (preguntas frecuentes)",
    url: "https://www.seikowatches.com/global-en/customerservice/faq/general-information-8",
  },
  {
    publisher: "Citizen",
    title: "Water Resistance (precauciones de uso)",
    url: "https://www.citizenwatch-global.com/support/html/en/e81/precaution_08_e81.html",
  },
];

function watchesPhrase(count) {
  return `${count} ${count === 1 ? "reloj" : "relojes"}`;
}

/** "18 a 20", "43", for spans read from the sheets. */
function span(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? `${min}` : `${min} a ${max}`;
}

/** In-stock watches with a rotating bezel on their sheet. */
function bezelNote(watches) {
  const bezel = watches.filter(hasRotatingBezel);
  if (bezel.length === 0) return "";
  return `En Smile, ${modelsPhrase(bezel.length)} con stock indican bisel giratorio en su ficha, ${fromBrandsPhrase(bezel)}.`;
}

/** Quartz and automatic watches in stock, by their sheets. */
function movementNote(watches) {
  const quartz = watches.filter((product) => movementType(product) === "cuarzo");
  const automatic = watches.filter((product) => movementType(product) === "automático");
  if (quartz.length + automatic.length === 0) {
    return "Las fichas de los relojes con stock en Smile no detallan el movimiento: si te interesa un modelo, consultanos por WhatsApp.";
  }
  const parts = [
    quartz.length > 0 ? `${modelsPhrase(quartz.length)} de cuarzo` : "",
    automatic.length > 0 ? `${automatic.length} ${automatic.length === 1 ? "automático" : "automáticos"}` : "",
  ];
  return `Entre los relojes con stock en Smile, las fichas indican ${listPhrase(parts)}, ${fromBrandsPhrase([...quartz, ...automatic])}; las demás no detallan el movimiento, así que podés consultarnos por WhatsApp.`;
}

/** Case diameters stated by the in-stock sheets. */
function diameterNote(watches) {
  const sized = watches.filter((product) => caseDiameter(product) !== null);
  if (sized.length === 0) {
    return "Las fichas de los relojes con stock en Smile no indican el diámetro de la caja: consultanos la medida por WhatsApp antes de comprar.";
  }
  return `En Smile, las fichas de ${modelsPhrase(sized.length)} con stock indican el diámetro de la caja, ${fromBrandsPhrase(sized)}: de ${span(sized.map(caseDiameter))} milímetros. Para los demás modelos, consultanos la medida por WhatsApp.`;
}

/** Water-resistance ratings stated by the in-stock sheets. */
function waterNote(watches) {
  const rated = watches.map(waterResistance).filter(Boolean);
  if (rated.length === 0) {
    return "Por el momento, ningún reloj con stock en Smile indica la resistencia al agua en su ficha: consultanos por WhatsApp el dato del modelo que te interese.";
  }
  const list = link("la lista de esos modelos", `${guidePath(GUIDE_SLUGS.waterResistance)}#relojes-en-smile`);
  return `En Smile, ${modelsPhrase(rated.length)} con stock indican la resistencia al agua en su ficha, de ${span(rated.map((rating) => rating.atm))} ATM: mirá ${list}, con el uso que admite cada uno.`;
}

/** Models in stock and their price range, per brand hub and per audience hub. */
function budgetRows(watches) {
  const row = (label, products) => [
    label,
    String(products.length),
    products.length > 0 ? (productsPriceLabel(products) ?? "Consultar por WhatsApp") : NO_STOCK,
  ];
  const listed = new Set(WATCH_BRAND_HUBS.map((hub) => hub.brand));
  return [
    ...WATCH_BRAND_HUBS.map((hub) => row(link(hub.label, hub.path), watches.filter((product) => product.brand === hub.brand))),
    ...brandsOf(watches)
      .filter((brand) => !listed.has(brand))
      .map((brand) => row(brand, watches.filter((product) => product.brand === brand))),
    ...WATCH_AUDIENCE_HUBS.map((hub) => row(link(hub.linkLabel, hub.path), watches.filter(hub.matches))),
  ];
}

/** The budget section: the price table, or the watches hub without stock. */
function budgetSection(watches) {
  const watchesHub = link("Relojes", WATCHES_PATH);
  if (watches.length === 0) {
    return {
      answer: `Por el momento no hay relojes con stock en Smile, así que no podemos darte un rango de precios actualizado. Podés ver los modelos agotados en la sección ${watchesHub} y consultarnos por WhatsApp por su reposición y su precio antes de decidir el regalo.`,
      blocks: [{ type: "paragraph", text: STORE_PAYMENT_SENTENCE }],
    };
  }

  const unclassified = brandsOf(watches.filter((product) => productGender(product) === null));
  return {
    answer: `Depende de la marca. Hoy hay ${watchesPhrase(watches.length)} con stock en Smile, de ${productsPriceLabel(watches) ?? "precio a consultar"}, y la tabla muestra cuántos modelos y qué rango de precios tiene cada marca y cada sección. Son los precios publicados en el catálogo de la tienda, que pueden cambiar.`,
    blocks: [
      {
        type: "table",
        caption: "Relojes con stock en Smile por marca y por sección, con el rango de precios publicado en pesos.",
        head: ["Marca o sección", "Modelos con stock", "Precios"],
        rows: budgetRows(watches),
      },
      {
        type: "paragraph",
        text: [
          STORE_PAYMENT_SENTENCE,
          unclassified.length > 0
            ? `Los relojes de ${brandLinksPhrase(unclassified)} no tienen clasificación por género en el catálogo y están en la sección ${watchesHub}.`
            : "",
        ]
          .filter(Boolean)
          .join(" "),
      },
    ],
  };
}

export function watchGiftGuide({ inStock }) {
  const watches = inStock.filter(isWatchProduct);
  const budget = budgetSection(watches);
  const waterGuide = guidePath(GUIDE_SLUGS.waterResistance);
  const bezel = bezelNote(watches);

  return {
    slug: GUIDE_SLUGS.watchGift,
    title: "Cómo elegir un reloj para regalar",
    h1: "Cómo elegir un reloj para regalar",
    description:
      "Cómo elegir un reloj para regalar a un hombre o una mujer: estilo, cuarzo o automático, tamaño de caja según la muñeca, resistencia al agua y presupuesto.",
    summary:
      "Estilo, movimiento, tamaño de caja, resistencia al agua y presupuesto, con los modelos y precios con stock en Smile.",
    crumb: "Reloj para regalar",
    datePublished: "2026-10-22",
    dateModified: "2026-10-22",
    about: ["Relojes", "Regalos", "Relojes para hombre", "Relojes para mujer"],
    lead: "Para elegir un reloj de regalo, empezá por cómo lo va a usar la persona: a diario, para hacer deporte o en ocasiones formales. Después definí el movimiento, de cuarzo o automático, un tamaño de caja acorde a su muñeca, la resistencia al agua que necesita y el presupuesto. Con esos cinco datos, la lista se achica rápido.",
    sections: [
      {
        id: "estilo",
        heading: "¿Qué estilo de reloj conviene regalar?",
        answer:
          "El que combine con su rutina. Un reloj deportivo o de buceo suele sumar bisel giratorio y más resistencia al agua; uno de vestir es delgado y simple, para usar con camisa; y un cronógrafo agrega contadores para medir tiempos. Si no sabés qué prefiere, fijate qué reloj o qué ropa usa más seguido.",
        blocks: [
          {
            type: "list",
            ordered: false,
            items: [
              `Deportivo o de buceo: según el manual de Invicta, la escala del bisel giratorio sirve para controlar el tiempo que se pasa bajo el agua. Para bucear con tanque, el reloj tiene que ser de buceo según la norma ISO 6425, como explica la ${link("guía de resistencia al agua", waterGuide)}.`,
              "De vestir: según la guía de Watches of Switzerland, es delgado, de menos de 15 milímetros de espesor, entra debajo del puño de la camisa y tiene una esfera simple, pocas funciones y malla de cuero; recomienda buscarlo de 33 a 41 milímetros.",
              "Cronógrafo: suma contadores para medir tiempos transcurridos. Según el manual de Invicta, pueden marcar horas, minutos y hasta décimas de segundo, y algunos agregan un taquímetro, que mide la velocidad sobre una distancia conocida.",
            ],
          },
          ...(bezel ? [{ type: "paragraph", text: bezel }] : []),
        ],
      },
      {
        id: "cuarzo-o-automatico",
        heading: "¿Cuarzo o automático: cuál conviene para regalar?",
        answer:
          "Si la persona no quiere ocuparse del reloj, un cuarzo es lo más simple: funciona a pila y no necesita cuerda. Un automático no lleva pila y se carga con el movimiento de la muñeca, pero pide uso frecuente: Seiko recomienda llevar sus relojes mecánicos más de ocho horas por día para mantener la cuerda.",
        blocks: [
          {
            type: "table",
            caption: "Cuarzo y automático, según el manual de Invicta, Seiko y Worn & Wound.",
            head: ["Característica", "Cuarzo", "Automático"],
            rows: [
              ["Energía", "Una pila", "El movimiento de la muñeca; también se le puede dar cuerda con la corona"],
              [
                "Mantenimiento",
                "Cambiar la pila cuando se agota",
                "Usarlo seguido o darle cuerda; Invicta sugiere guardarlo en una caja rotatoria (watch winder)",
              ],
              ["Segundero", "Salta una vez por segundo", "Da entre 5 y 10 pasos por segundo"],
              [
                "Precisión",
                "Según Invicta, un magnetismo fuerte puede alterar la hora",
                "Según Seiko, cambia levemente día a día con la temperatura, el magnetismo, los golpes y la posición",
              ],
            ],
          },
          {
            type: "paragraph",
            text: `${movementNote(watches)} Si elegís un Invicta, la guía para ${link("saber si un reloj Invicta es original", guidePath(GUIDE_SLUGS.invictaOriginals))} explica cómo reconocer cada movimiento y cómo poner en marcha un automático.`,
          },
        ],
      },
      {
        id: "tamano-de-caja",
        heading: "¿Qué tamaño de caja elegir según la muñeca?",
        answer:
          "Si podés, medí el contorno de su muñeca o fijate el tamaño del reloj que ya usa. La guía de talles de Shinola sugiere cajas de 38 a 42 milímetros para muñecas de unos 15 a 18 centímetros, y de 44 a 46 para muñecas de 19 a 20; además, las asas no deberían sobresalir de la muñeca.",
        blocks: [
          { type: "paragraph", text: diameterNote(watches) },
          {
            type: "paragraph",
            text: `Si la malla de metal queda grande, Invicta recomienda que la ajuste un relojero con experiencia, porque un ajuste mal hecho puede hacer que se suelte. La ${link("guía de estilo", "/guia-de-estilo")} resume cómo elegir el tamaño según el ancho de la muñeca.`,
          },
        ],
      },
      {
        id: "resistencia-al-agua",
        heading: "¿Qué resistencia al agua necesita un reloj de regalo?",
        answer: `Depende de lo que haga con él. Para el uso diario, con lluvia y lavado de manos, alcanza con 3 ATM (30 m); para nadar, Seiko, Citizen e Invicta piden al menos 5 ATM (50 m); y para bucear con tanque hace falta un reloj de buceo. La ${link("guía de resistencia al agua", waterGuide)} explica cada nivel.`,
        blocks: [{ type: "paragraph", text: waterNote(watches) }],
      },
      {
        id: "presupuesto",
        heading: "¿Cuánto cuesta un reloj para regalar en Smile?",
        answer: budget.answer,
        blocks: budget.blocks,
      },
      {
        id: "hombre-o-mujer",
        heading: "¿Qué reloj regalar a un hombre o a una mujer?",
        answer: `Más que el género, importan el estilo, el tamaño de la muñeca y el uso que le va a dar. En Smile, las secciones para hombre y para mujer reúnen los relojes que el catálogo clasifica para caballero o para dama, más los unisex; los modelos sin esa clasificación están en la sección ${link("Relojes", WATCHES_PATH)}.`,
        blocks: [
          {
            type: "links",
            items: [
              ...WATCH_AUDIENCE_HUBS.map((hub) => ({ label: hub.linkLabel, href: hub.path })),
              ...WATCH_BRAND_HUBS.map((hub) => ({ label: hub.label, href: hub.path })),
            ],
          },
          { type: "paragraph", text: STORE_LOCATION_SENTENCE },
        ],
      },
    ],
    faqs: [
      {
        question: "¿Se puede regalar un reloj sin saber la medida de la muñeca?",
        answer:
          "Sí. Una buena referencia es el reloj que la persona ya usa: el diámetro de su caja te orienta. Si después hay que acortar una malla de metal, Invicta recomienda que lo haga un relojero con experiencia, porque un ajuste mal hecho puede hacer que la malla se suelte.",
      },
      {
        question: "¿Conviene regalar un automático a alguien que no usa reloj todos los días?",
        answer:
          "Puede no ser lo más práctico. Un automático se carga con el movimiento de la muñeca, así que, si se usa poco, hay que darle cuerda con la corona o moverlo antes de ponérselo, como indica Invicta, que además sugiere guardarlo en una caja rotatoria. Para un uso ocasional, un cuarzo es más simple.",
      },
    ],
    sources: SOURCES,
  };
}
