// Guide: what a watch's water-resistance rating means. Uses per rating follow
// Seiko's and Citizen's tables (Invicta's manual agrees on swimming and
// diving); the standards come from ISO's abstracts and the Swiss watch
// industry federation (FH); why the figure is not a depth, from IWC, Seiko
// and Fratello; care tips from Seiko, Invicta and IWC. The watches listed
// are the in-stock ones whose catalog sheet states a rating.
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
  fromBrandsPhrase,
  isWatchProduct,
  modelsPhrase,
  WATCHES_PATH,
  waterResistance,
  waterResistanceLabel,
} from "./watch-facts.mjs";

const SOURCES = [
  {
    publisher: "ISO",
    title: "ISO 22810:2010 Horology — Water-resistant watches (copia archivada)",
    url: "https://web.archive.org/web/20260718175149/https://www.iso.org/standard/45334.html",
  },
  {
    publisher: "ISO",
    title: "ISO 6425:2018 Horology — Divers' watches (copia archivada)",
    url: "https://web.archive.org/web/20250423230214/https://www.iso.org/standard/66517.html",
  },
  {
    publisher: "Federación de la Industria Relojera Suiza (FH)",
    title: "Water-resistance of watches (copia archivada)",
    url: "https://web.archive.org/web/20260419053517/https://www.fhs.swiss/eng/resistancy.html",
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
  {
    publisher: "Invicta",
    title: "Manual (PDF)",
    url: "https://www.invictawatch.com/storage/settings/November2024/qxEaYIdiLmqp1DrdGEXs.pdf",
  },
  {
    publisher: "IWC Schaffhausen",
    title: "Water Resistant (copia archivada)",
    url: "https://web.archive.org/web/20250708044237/https://www.iwc.com/en/specials/water-resistant.html",
  },
  {
    publisher: "Fratello",
    title: "Water Resistance In Watches — Why “30m” Doesn’t Always Mean The Same Thing (2025)",
    url: "https://www.fratellowatches.com/water-resistance-in-watches-why-30m-doesnt-always-mean-the-same-thing/",
  },
];

// Seiko's table, by the rating on the case back (Citizen and Invicta agree).
const USE_BY_ATM = new Map([
  [3, "Salpicaduras y lluvia; no para nadar"],
  [5, "Hasta natación; no para snorkel"],
  [10, "Hasta snorkel y buceo libre; no para buceo con tanque"],
  [20, "Hasta snorkel y buceo libre; no para buceo con tanque"],
]);

/** What the rating allows according to the table, or a pointer to the brand. */
export function waterUse(atm) {
  return USE_BY_ATM.get(atm) ?? "Revisá la tabla de la marca";
}

/** The store section: in-stock watches whose sheet states a rating, or the watches hub. */
function storeSection(watches, displayName) {
  const rated = watches
    .map((product) => ({ product, rating: waterResistance(product) }))
    .filter((entry) => entry.rating)
    .sort((a, b) => a.rating.atm - b.rating.atm || displayName(a.product).localeCompare(displayName(b.product), "es"));
  const unrated = brandsOf(watches.filter((product) => !waterResistance(product)));
  const guides = {
    type: "paragraph",
    text: `Si estás eligiendo un reloj, mirá ${link("cómo elegir un reloj para regalar", guidePath(GUIDE_SLUGS.watchGift))}; y si es un Invicta, ${link("cómo saber si un reloj Invicta es original", guidePath(GUIDE_SLUGS.invictaOriginals))}. ${STORE_LOCATION_SENTENCE} ${STORE_PAYMENT_SENTENCE}`,
  };

  if (rated.length === 0) {
    return {
      answer: `Por el momento, ningún reloj con stock en Smile indica la resistencia al agua en su ficha. Podés ver todos los ${link("relojes disponibles", WATCHES_PATH)} y consultarnos por WhatsApp para confirmar el dato de un modelo antes de usarlo en el agua; la tabla de esta guía te ayuda a interpretar lo que diga el fondo.`,
      blocks: [guides],
    };
  }

  const from = fromBrandsPhrase(
    rated.map((entry) => entry.product),
    { links: false },
  );
  return {
    answer: `Hoy hay ${modelsPhrase(rated.length)} con stock cuya ficha indica la resistencia al agua, ${from}. La tabla muestra ese dato y el uso que le corresponde según la tabla de Seiko. Si un modelo no lo indica, consultanos por WhatsApp antes de usarlo en el agua.`,
    blocks: [
      {
        type: "table",
        caption: "Relojes con stock en Smile cuya ficha indica la resistencia al agua; uso según la tabla de Seiko.",
        head: ["Modelo", "Resistencia según la ficha", "Uso según la tabla"],
        rows: rated.map(({ product, rating }) => [
          link(displayName(product), `/tienda/productos/${product.slug}`),
          waterResistanceLabel(rating),
          waterUse(rating.atm),
        ]),
      },
      {
        type: "paragraph",
        text: [
          unrated.length > 0
            ? `Los relojes con stock de ${brandLinksPhrase(unrated)} no indican la resistencia al agua en su ficha: si te importa ese dato, consultanos antes de comprar.`
            : "",
          `Podés ver todos los ${link("relojes disponibles", WATCHES_PATH)}.`,
        ]
          .filter(Boolean)
          .join(" "),
      },
      guides,
    ],
  };
}

export function waterResistanceGuide({ inStock, displayName }) {
  const store = storeSection(inStock.filter(isWatchProduct), displayName);

  return {
    slug: GUIDE_SLUGS.waterResistance,
    title: "Resistencia al agua en relojes: qué significa",
    h1: "Resistencia al agua en relojes: qué significan 3, 5, 10 y 20 ATM",
    description:
      "Qué significan 3, 5, 10 y 20 ATM en un reloj: tabla de usos para lluvia, ducha, natación y buceo, normas ISO 22810 e ISO 6425 y cómo cuidar la corona.",
    summary:
      "Qué permite cada indicación, de 3 a 20 ATM, por qué los metros no son una profundidad de buceo y cómo cuidar la hermeticidad.",
    crumb: "Resistencia al agua",
    datePublished: "2026-10-22",
    dateModified: "2026-10-22",
    about: ["Resistencia al agua", "Relojes de buceo", "ISO 22810", "ISO 6425"],
    lead: "La resistencia al agua de un reloj indica la presión que soportó en una prueba, no la profundidad a la que podés llevarlo. Según Seiko y Citizen, 3 ATM (30 m) alcanza para salpicaduras y lluvia, 5 ATM (50 m) para nadar, 10 y 20 ATM para snorkel, y solo un reloj de buceo sirve para bucear con tanque.",
    sections: [
      {
        id: "que-significa-cada-indicacion",
        heading: "¿Qué significan 3, 5, 10 y 20 ATM en un reloj?",
        answer:
          "Son niveles de presión: según Citizen, 1 ATM equivale a 1 bar, y según Invicta, 1 bar equivale a unos 10 metros de agua; por eso 3 ATM también se escribe 30 m. Pero cada nivel tiene un uso recomendado mucho más acotado que esa profundidad, y las marcas lo publican en tablas como esta:",
        blocks: [
          {
            type: "table",
            caption: "Usos según la tabla de Seiko; Citizen e Invicta coinciden en natación y buceo.",
            head: ["Indicación en el reloj", "Salpicaduras y lluvia", "Ducha", "Natación", "Snorkel y buceo libre", "Buceo con tanque"],
            rows: [
              ["3 ATM, 3 bar o 30 m", "Sí", "No", "No", "No", "No"],
              ["5 ATM, 5 bar o 50 m", "Sí", "Sí", "Sí", "No", "No"],
              ["10 ATM, 10 bar o 100 m", "Sí", "Sí", "Sí", "Sí", "No"],
              ["20 ATM, 20 bar o 200 m", "Sí", "Sí", "Sí", "Sí", "No"],
              ["Reloj de buceo (DIVER'S, norma ISO 6425)", "Sí", "Sí", "Sí", "Sí", "Sí"],
            ],
          },
          {
            type: "paragraph",
            text: "El manual de Invicta coincide en lo esencial: con 30 metros, solo salpicaduras y lavado de manos; con 50, natación a poca profundidad; con 100 o 200, natación, snorkel y deportes acuáticos, pero no buceo. Invicta reserva el buceo para sus relojes de 300 metros o más.",
          },
        ],
      },
      {
        id: "por-que-no-es-profundidad",
        heading: "¿Por qué un reloj de 30 metros no sirve para bajar a 30 metros?",
        answer:
          "Porque el número resume una prueba de presión en laboratorio, con el reloj quieto y sin cambios de temperatura. Según la revista Fratello, mover el brazo en el agua, una ola o pasar de una ducha caliente al aire fresco generan picos de presión que superan esas condiciones. IWC advierte que los metros no equivalen a profundidad de buceo.",
        blocks: [
          {
            type: "paragraph",
            text: "Además, las tablas no son iguales en todas las marcas: IWC admite nadar con 3 bar, mientras que Seiko, Citizen e Invicta piden al menos 5 bar o 50 metros. Por eso, la Federación de la Industria Relojera Suiza (FH) recomienda seguir las condiciones de uso que indica la marca de cada reloj.",
          },
        ],
      },
      {
        id: "normas-iso",
        heading: "¿Qué dicen las normas ISO 22810 e ISO 6425?",
        answer:
          "La ISO 22810:2010 fija los requisitos y los ensayos de los relojes resistentes al agua y las indicaciones que el fabricante puede ponerles. La ISO 6425:2018 hace lo mismo con los relojes de buceo: tienen que resistir al menos 100 metros y medir el tiempo de inmersión con un sistema que se vea en la oscuridad.",
        blocks: [
          {
            type: "list",
            ordered: false,
            items: [
              "Resistente al agua (ISO 22810): según la FH, el reloj tiene que soportar como mínimo una sobrepresión de 2 bar, equivalente a 20 metros, indique o no una profundidad.",
              "Reloj de buceo (ISO 6425): además de la profundidad, la FH enumera visibilidad nocturna, indicador del tiempo de inmersión, resistencia a golpes y a campos magnéticos y solidez de la malla.",
              "Cómo reconocerlo: en la tabla de Citizen, los relojes de buceo llevan la marca «DIVER'S 200m» o «DIVER'S WATCH 200m»; los que dicen «WATER RESIST» o «W.R.» con una cantidad de bar son de uso cotidiano.",
            ],
          },
        ],
      },
      {
        id: "cuidados",
        heading: "¿Cómo cuidar la resistencia al agua de un reloj?",
        answer:
          "Usá la corona siempre cerrada y no la toques ni aprietes botones con el reloj mojado. Evitá el sauna y los cambios bruscos de temperatura, enjuagalo con agua dulce después del mar y hacé revisar la hermeticidad en cada service, porque las juntas envejecen y se desgastan con el paso del tiempo.",
        blocks: [
          {
            type: "steps",
            items: [
              {
                title: "Corona",
                text: "mantenela empujada hasta el fondo y, si es a rosca, bien enroscada: Invicta advierte que, si queda floja, el reloj pierde la resistencia al agua. Seiko, Invicta e IWC piden no usarla con el reloj mojado o bajo el agua.",
              },
              {
                title: "Temperatura",
                text: "Invicta recomienda no usar el reloj en el sauna ni en lugares donde se caliente demasiado, y sacárselo antes del baño; IWC advierte que los cambios de temperatura pueden afectar la hermeticidad.",
              },
              {
                title: "Agua de mar",
                text: "después de usarlo en el mar, enjuagalo con agua dulce y secalo con un paño suave, como indican Seiko e Invicta.",
              },
              {
                title: "Juntas",
                text: "Seiko explica que la hermeticidad no es permanente, porque las juntas envejecen y un golpe puede deformar piezas, y recomienda un service periódico para controlarla. IWC pide probarla al menos una vez por año en sus relojes, y Fratello sugiere lo mismo si usás el reloj seguido en el mar o en la pileta.",
              },
            ],
          },
        ],
      },
      {
        id: "relojes-en-smile",
        heading: "¿Qué relojes de Smile indican su resistencia al agua?",
        answer: store.answer,
        blocks: store.blocks,
      },
    ],
    faqs: [
      {
        question: "¿Puedo ducharme con el reloj puesto?",
        answer:
          "Depende de la marca. Seiko admite la ducha desde 5 bar, pero Invicta pide sacarse el reloj antes del baño y no ponerlo bajo el chorro de la canilla, e IWC advierte que los cambios de temperatura afectan la hermeticidad. Ante la duda, sacátelo.",
      },
      {
        question: "¿Un reloj que dice «Water Resistant» sin número sirve para nadar?",
        answer:
          "No conviene. En la tabla de Citizen, la marca «WATER RESIST» sin otra indicación corresponde a 3 atmósferas, apta solo para salpicaduras ocasionales. Para nadar, Seiko, Citizen e Invicta piden al menos 5 bar o 50 metros.",
      },
    ],
    sources: SOURCES,
  };
}
