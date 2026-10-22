// Guide: how to tell a genuine Invicta watch. The checks come from Invicta's
// own pages: the model number on the case back (Invicta Watch Europe), the
// specs of each model on invictawatch.com, the crown and movement notes of
// its manual. The seconds-hand test is Worn & Wound's; the shopping red
// flags, Argentina's consumer office. Serial numbers, crown logos and
// packaging are left out: no Invicta page consulted presents them as proof.
// The table of Invicta models in stock is read from the catalog sheets.
// Smile's own claim stays the site's: "originales e importados", nothing more.
import {
  capList,
  GUIDE_SLUGS,
  guidePath,
  link,
  moreSentence,
  normalize,
  STORE_LOCATION_SENTENCE,
  STORE_PAYMENT_SENTENCE,
} from "./shared.mjs";
import {
  caseDiameter,
  isWatchProduct,
  modelsPhrase,
  movementType,
  waterResistance,
  waterResistanceLabel,
} from "./watch-facts.mjs";

const INVICTA_PATH = "/tienda/marcas/invicta";
const NO_SPEC = "Sin dato en la ficha";

const SOURCES = [
  {
    publisher: "Invicta Watch Europe",
    title: "Important Information Concerning Your New Invicta Timepiece (PDF, 2015)",
    url: "https://images-na.ssl-images-amazon.com/images/G/02//watches/warranty/pdfs/696e7669637461/9/watch_warranty._TTD_.pdf",
  },
  {
    publisher: "Invicta",
    title: "Pro Diver model 30092 (ficha de producto)",
    url: "https://www.invictawatch.com/watches/detail/30092-pro-diver-men",
  },
  {
    publisher: "Invicta",
    title: "Pro Diver model 35129 (ficha de producto)",
    url: "https://www.invictawatch.com/watches/detail/35129-pro-diver-men",
  },
  {
    publisher: "Invicta",
    title: "Manual (PDF)",
    url: "https://www.invictawatch.com/storage/settings/November2024/qxEaYIdiLmqp1DrdGEXs.pdf",
  },
  {
    publisher: "Invicta",
    title: "Distributors",
    url: "https://www.invictawatch.com/distributors",
  },
  {
    publisher: "Worn & Wound",
    title: "Horological Irony: The Dead-Beat Seconds (2016)",
    url: "https://wornandwound.com/horological-irony-dead-beat-seconds/",
  },
  {
    publisher: "Secretaría de Comercio Interior (Argentina)",
    title: "Recomendaciones al consumidor para realizar compras on line (2020)",
    url: "https://www.argentina.gob.ar/noticias/recomendaciones-al-consumidor-para-realizar-compras-line",
  },
];

export function isInvictaProduct(product) {
  return isWatchProduct(product) && normalize(product.brand) === "invicta";
}

// Invicta lines by name ("Reloj Invicta Pro Diver 49277" -> Pro Diver).
const LINE_LABELS = new Map([
  ["pro diver", "Pro Diver"],
  ["speedway", "Speedway"],
]);

function invictaLine(product) {
  const match = normalize(product.name).match(/\binvicta\s+([a-z ]+?)\s+\d/);
  return match ? (LINE_LABELS.get(match[1]) ?? null) : null;
}

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * "En el catálogo de Smile, la línea Pro Diver tiene modelos de cuarzo y
 * automáticos; la línea Speedway, de cuarzo…", from every Invicta sheet
 * (in stock or not) that states its movement.
 */
function lineSummary(invicta) {
  const lines = new Map();
  for (const product of invicta) {
    const line = invictaLine(product);
    const type = movementType(product);
    if (!line || !type) continue;
    if (!lines.has(line)) lines.set(line, new Set());
    lines.get(line).add(type);
  }
  if (lines.size === 0) return "";
  const phrases = [...lines.entries()].map(([line, types], index) => {
    const kinds = types.size === 2 ? "de cuarzo y automáticos" : types.has("cuarzo") ? "de cuarzo" : "automáticos";
    return index === 0 ? `la línea ${line} tiene modelos ${kinds}` : `la línea ${line}, ${kinds}`;
  });
  return `En el catálogo de Smile, ${phrases.join("; ")}. El número de modelo define qué movimiento lleva cada reloj.`;
}

/** The store section: the Invicta models in stock and what their sheets state. */
function storeSection(inStock, catalog, displayName) {
  const collection = link("colección Invicta", INVICTA_PATH);
  const closing = {
    type: "paragraph",
    text: `Smile vende relojes Invicta originales e importados, y podés aplicar estos controles a cualquier modelo de la ${collection}. ${STORE_LOCATION_SENTENCE} ${STORE_PAYMENT_SENTENCE}`,
  };
  const summary = lineSummary(catalog);

  if (inStock.length === 0) {
    return {
      answer: `Por el momento no hay relojes Invicta con stock en Smile. Podés ver los modelos agotados en la ${collection} y consultarnos por WhatsApp por su reposición; cuando vuelvan, revisá en cada ficha el número de modelo y comparalo con la ficha de ese modelo en invictawatch.com.`,
      blocks: [...(summary ? [{ type: "paragraph", text: summary }] : []), closing],
    };
  }

  const { shown, more } = capList(inStock);
  const rest = moreSentence(more, `la ${collection}`);
  return {
    answer: `Hoy hay ${modelsPhrase(inStock.length)} de Invicta con stock en Smile. La tabla resume lo que declara la ficha de cada uno; antes de comprar, comparalo con la ficha de su número de modelo en invictawatch.com y, si querés fotos del fondo o de la corona, consultanos por WhatsApp.`,
    blocks: [
      {
        type: "table",
        catalog: true,
        caption: "Invicta con stock: movimiento, diámetro y resistencia al agua según las fichas del catálogo de Smile.",
        head: ["Modelo", "Movimiento", "Diámetro de la caja", "Resistencia al agua"],
        rows: shown.map((product) => {
          const type = movementType(product);
          const diameter = caseDiameter(product);
          const water = waterResistance(product);
          return [
            link(displayName(product), `/tienda/productos/${product.slug}`),
            type ? capitalize(type) : NO_SPEC,
            diameter ? `${diameter} mm` : NO_SPEC,
            water ? waterResistanceLabel(water) : NO_SPEC,
          ];
        }),
      },
      ...(rest ? [{ type: "paragraph", catalog: true, text: rest }] : []),
      ...(summary ? [{ type: "paragraph", text: summary }] : []),
      closing,
    ],
  };
}

export function invictaOriginalsGuide({ catalog, inStock, displayName }) {
  const invictaInStock = inStock
    .filter(isInvictaProduct)
    .sort((a, b) => displayName(a).localeCompare(displayName(b), "es"));
  const store = storeSection(invictaInStock, catalog.filter(isInvictaProduct), displayName);

  return {
    slug: GUIDE_SLUGS.invictaOriginals,
    title: "Cómo saber si un reloj Invicta es original",
    h1: "Cómo saber si un reloj Invicta es original",
    description:
      "Cómo saber si un reloj Invicta es original: el número de modelo del fondo, la ficha de invictawatch.com, la corona, el movimiento y las señales de alerta.",
    summary:
      "El número de modelo del fondo, la ficha de cada modelo en invictawatch.com, la corona, el movimiento y las señales de una falsificación.",
    crumb: "Invicta original",
    datePublished: "2026-10-22",
    dateModified: "2026-10-22",
    about: ["Invicta", "Falsificaciones", "Relojes"],
    lead: "Para saber si un reloj Invicta es original, buscá el número de modelo en el fondo de la caja y comparalo con la ficha de ese modelo en invictawatch.com: el diámetro, la corona, el cristal, la resistencia al agua y el movimiento tienen que coincidir. Desconfiá si el vendedor no te da ese número o si algún dato no cierra.",
    sections: [
      {
        id: "numero-de-modelo",
        heading: "¿Dónde está el número de modelo de un Invicta y para qué sirve?",
        answer:
          "Invicta indica que el número de modelo figura en el fondo del reloj. Es la llave para verificarlo: con ese número, la ficha de invictawatch.com muestra la colección, el diámetro de la caja, el tipo de corona, el cristal, el calibre, la resistencia al agua y, en algunos modelos, el tipo de fondo.",
        blocks: [
          {
            type: "paragraph",
            text: "Por ejemplo, la ficha del Pro Diver 30092 indica una caja de acero de 42 milímetros, corona a rosca, cristal mineral, fondo transparente y resistencia al agua de 200 metros. La del Pro Diver 35129, de la misma línea, indica 43 milímetros, corona a presión, cristal Flame Fusion y 100 metros. Por eso el dato que importa es el número de modelo, no solo el nombre de la línea.",
          },
          {
            type: "paragraph",
            text: "Según el manual de Invicta, la resistencia al agua figura en la esfera, en el fondo o en ambos: tiene que coincidir con la de la ficha. Compará también el reloj con la foto de la ficha: el logo, los textos y los colores de la esfera tienen que ser los mismos.",
          },
        ],
      },
      {
        id: "corona",
        heading: "¿Cómo tiene que ser la corona de un Invicta original?",
        answer:
          "Tiene que coincidir con la ficha del modelo. El manual de Invicta explica que muchos de sus relojes, sobre todo los de buceo, tienen corona a rosca: hay que desenroscarla antes de tirar de ella para poner la hora y volver a enroscarla al terminar. Si la ficha dice «Screw Down» y la corona no se enrosca, desconfiá.",
        blocks: [
          {
            type: "paragraph",
            text: `Otros modelos tienen corona a presión, que la ficha indica como «Push»: en ese caso se tira de ella directamente. Según el mismo manual, si una corona a rosca queda floja, el reloj pierde su resistencia al agua. Para saber qué uso admite cada indicación, mirá ${link("qué significa la resistencia al agua en relojes", guidePath(GUIDE_SLUGS.waterResistance))}.`,
          },
        ],
      },
      {
        id: "movimiento",
        heading: "¿Cómo saber si el movimiento es de cuarzo o automático?",
        answer:
          "Compará lo que indica la ficha con cómo avanza el segundero. Según Invicta, un reloj de cuarzo funciona a pila y uno automático no la lleva: se carga con el movimiento de la muñeca. Según Worn & Wound, en un cuarzo el segundero salta una vez por segundo, y en uno mecánico da entre 5 y 10 pasos por segundo.",
        blocks: [
          {
            type: "paragraph",
            text: "Algunos automáticos tienen fondo transparente, que deja ver el movimiento: la ficha del modelo lo indica como «Exhibition». Si la ficha dice eso y el fondo del reloj es cerrado, el dato no cierra.",
          },
        ],
      },
      {
        id: "caja-y-papeles",
        heading: "¿Sirven la caja y los papeles para comprobar que es original?",
        answer:
          "Solo como complemento. Invicta publica en su sitio el manual de sus relojes, pero ninguna de las páginas de la marca consultadas para esta guía presenta la caja o los folletos como prueba de autenticidad. Los datos que sí podés contrastar con la marca son el número de modelo, la corona, el movimiento y la resistencia al agua.",
        blocks: [],
      },
      {
        id: "senales-de-alerta",
        heading: "¿Qué señales indican que un Invicta puede ser falso?",
        answer:
          "Las más claras son los datos que no coinciden con la ficha oficial: un número de modelo que no existe, otro diámetro, otra corona u otra resistencia al agua. También conviene frenar la compra si el vendedor no te da el número de modelo ni fotos del fondo, o si un supuesto automático tiene el segundero de un cuarzo.",
        blocks: [
          {
            type: "list",
            ordered: false,
            items: [
              "Número de modelo: no figura en el fondo, el vendedor no lo informa o no aparece en invictawatch.com.",
              "Movimiento: se vende como automático, pero el segundero salta una vez por segundo o el reloj lleva pila.",
              "Sitio y vendedor: la Secretaría de Comercio Interior recomienda comprar en sitios cuya dirección empiece con https://, conocer los datos del vendedor y comparar precios y referencias antes de pagar.",
            ],
          },
        ],
      },
      {
        id: "donde-comprar",
        heading: "¿Dónde conviene comprar un Invicta original?",
        answer:
          "Lo más seguro es comprar en tiendas que te muestren el número de modelo y fotos del reloj antes de pagar, para compararlos con la ficha oficial. Invicta publica en invictawatch.com su lista de distribuidores por región, con uno para América Latina, al que podés consultar si tenés dudas sobre un vendedor.",
        blocks: [
          {
            type: "paragraph",
            text: `Si estás pensando en regalar uno, la guía para ${link("elegir un reloj para regalar", guidePath(GUIDE_SLUGS.watchGift))} repasa el estilo, el movimiento y el tamaño de caja. También podés ver todos los ${link("relojes", "/tienda/relojes")} disponibles.`,
          },
        ],
      },
      {
        id: "invicta-en-smile",
        heading: "¿Qué relojes Invicta hay hoy en Smile?",
        answer: store.answer,
        blocks: store.blocks,
      },
    ],
    faqs: [
      {
        question: "¿Cómo se pone en marcha un Invicta automático?",
        answer:
          "Según el manual de Invicta, se puede girar la corona varias vueltas en sentido horario en su posición normal, después de desenroscarla si es a rosca, o mover el reloj de lado a lado durante unos 30 segundos. Con el uso diario, el movimiento de la muñeca le va dando cuerda.",
      },
      {
        question: "¿Invicta tiene un verificador de números de serie?",
        answer:
          "En las páginas de Invicta consultadas para esta guía no hay un verificador de números de serie. El dato que la marca permite contrastar es el número de modelo: en invictawatch.com, cada modelo tiene su ficha con el diámetro, la corona, el cristal, el calibre y la resistencia al agua.",
      },
    ],
    sources: SOURCES,
  };
}
