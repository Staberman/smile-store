// Guide: which Ray-Ban to choose among the model hubs. Shapes, origins and
// sizes come from Ray-Ban's product pages; face-shape advice from Ray-Ban's
// own guide (round, oval, triangle, square) and All About Vision for the
// shapes Ray-Ban does not classify (pilot, hexagonal). Frame and lens columns
// are read from the catalog's spec lines, so they follow what Smile lists.
// The catalog's "Formato de cara recomendado" line is left out: it is the
// same boilerplate on every product.
import { hubFacts, RAY_BAN_MODEL_HUBS } from "../collection-hubs.mjs";
import { listPhrase } from "../product-seo.mjs";
import { RAY_BAN_PRODUCT_SOURCES } from "./ray-ban-originales.mjs";
import {
  GUIDE_SLUGS,
  guidePath,
  link,
  STORE_LOCATION_SENTENCE,
  STORE_PAYMENT_SENTENCE,
} from "./shared.mjs";

const RAY_BAN_PATH = "/tienda/marcas/ray-ban";
const NO_SPEC = "Sin dato en las fichas";

const hubBySlug = new Map(RAY_BAN_MODEL_HUBS.map((hub) => [hub.slug, hub]));
const hubLink = (slug, label = hubBySlug.get(slug).name) => link(label, hubBySlug.get(slug).path);

// Static columns per model hub, in table order. `shape` follows Ray-Ban's
// product pages; `faces` cites who recommends it.
const MODEL_ROWS = [
  {
    slug: "aviador",
    shape: "Piloto (Aviator Classic, RB3025)",
    faces: "Ovalado y cuadrado (All About Vision)",
  },
  {
    slug: "wayfarer",
    shape: "Cuadrada (Original Wayfarer, RB2140)",
    faces: "Ovalado y triangular; por ser anguloso, también suaviza un rostro redondo (Ray-Ban)",
  },
  {
    slug: "round",
    shape: "Redonda (Round Metal, RB3447)",
    faces: "Cuadrado, ovalado y triangular; en un rostro redondo, realza la forma (Ray-Ban)",
  },
  {
    slug: "hexagonal",
    shape: "Hexagonal, evolución del Round con lentes planos (RB3548N)",
    faces: "Corazón y alargado, como las formas geométricas (All About Vision)",
  },
  {
    slug: "erika",
    shape: "Redondeada, con lentes grandes (RB4171)",
    faces: "Como el Round: cuadrado, ovalado y triangular (Ray-Ban)",
  },
];

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "metal", "metal o acetato"; the fallback when no sheet says. */
function orList(items) {
  if (items.length === 0) return NO_SPEC;
  return capitalize(listPhrase(items).replace(/ y ([^,]+)$/, " o $1"));
}

/**
 * Frame materials the catalog's sheets give for a model hub, and its typical
 * use: polarized lenses (named or listed in the sheets) add driving and water,
 * where the AAO recommends them (see the polarized guide).
 */
function catalogColumns(hub, catalog) {
  const facts = hubFacts(catalog.filter(hub.matches));
  return {
    frame: orList(facts.frameMaterials),
    use: facts.lensTypes.includes("polarizados")
      ? "Uso diario; en versión polarizada, también ruta y agua"
      : "Uso diario; sin versión polarizada en el catálogo de Smile",
  };
}

const SOURCES = [
  {
    publisher: "Ray-Ban",
    title: "Face shape guide (Estados Unidos, copia archivada de 2021)",
    url: "https://web.archive.org/web/20210419181611/https://www.ray-ban.com/usa/face-shape-guide/clp",
  },
  {
    publisher: "Ray-Ban",
    title: "Choose the perfect frame (Estados Unidos, copia archivada de 2019)",
    url: "https://web.archive.org/web/20190626010643/https://www.ray-ban.com/usa/face-shape-guide",
  },
  RAY_BAN_PRODUCT_SOURCES.aviador,
  RAY_BAN_PRODUCT_SOURCES.wayfarer,
  RAY_BAN_PRODUCT_SOURCES.round,
  RAY_BAN_PRODUCT_SOURCES.hexagonal,
  RAY_BAN_PRODUCT_SOURCES.erika,
  {
    publisher: "Ray-Ban",
    title: "Ray-Ban glasses history (copia archivada)",
    url: "https://web.archive.org/web/20251217130712/https://www.ray-ban.com/usa/ray-ban-glasses-history",
  },
  {
    publisher: "All About Vision",
    title: "How to pick the best sunglasses for your face shape",
    url: "https://www.allaboutvision.com/eyewear/sunglasses/fit/best-sunglasses-for-face-shape/",
  },
];

export function rayBanModelsGuide({ catalog }) {
  const rows = MODEL_ROWS.map((row) => {
    const columns = catalogColumns(hubBySlug.get(row.slug), catalog);
    return [hubLink(row.slug), row.shape, columns.frame, columns.use, row.faces];
  });

  return {
    slug: GUIDE_SLUGS.rayBanModels,
    title: "Ray-Ban Aviador, Wayfarer o Round: cuál elegir",
    h1: "Ray-Ban Aviador, Wayfarer o Round: cuál elegir",
    description:
      "Compará los Ray-Ban Aviador, Wayfarer, Round, Hexagonal y Erika: forma, armazón, lentes y qué rostro favorece cada uno, según Ray-Ban y All About Vision.",
    summary:
      "Forma, armazón y lentes de los Ray-Ban Aviador, Wayfarer, Round, Hexagonal y Erika, y qué rostro favorece cada uno.",
    crumb: "Aviador, Wayfarer o Round",
    datePublished: "2026-10-22",
    dateModified: "2026-10-22",
    about: ["Ray-Ban Aviator", "Ray-Ban Wayfarer", "Ray-Ban Round", "Forma del rostro"],
    lead: `Elegí según tu rostro y el uso. Ray-Ban sugiere armazones en contraste con la cara: angulosos, como el ${hubLink("wayfarer")}, para rostros redondeados, y redondos, como el ${hubLink("round")} o el ${hubLink("erika")}, para rostros angulosos. El ${hubLink("aviador")} suele favorecer rostros ovalados y cuadrados. Para manejar o estar cerca del agua, conviene un lente polarizado.`,
    sections: [
      {
        id: "diferencias-entre-modelos",
        heading: "¿En qué se diferencian el Aviador, el Wayfarer, el Round, el Hexagonal y el Erika?",
        answer:
          "Se diferencian sobre todo por la forma y el material. El Aviador es de metal y forma piloto; el Wayfarer, de acetato y forma cuadrada; el Round Metal y el Hexagonal tienen armazón de metal con lentes redondos o hexagonales; y el Erika combina una forma redondeada con lentes de tamaño oversize.",
        blocks: [
          {
            type: "table",
            caption:
              "Forma según ray-ban.com; armazón y versión polarizada según las fichas del catálogo de Smile, con o sin stock; rostros según Ray-Ban y All About Vision.",
            head: ["Modelo", "Forma según Ray-Ban", "Armazón en Smile", "Uso típico", "Rostros que suele favorecer"],
            rows,
          },
        ],
      },
      {
        id: "segun-la-forma-del-rostro",
        heading: "¿Qué Ray-Ban le queda mejor a cada forma de rostro?",
        answer:
          "Ray-Ban propone una regla general: el armazón tiene que contrastar con la cara, con formas angulosas para rostros redondeados y formas redondeadas para rostros angulosos. Para saber cuál es tu forma, medí el ancho de la cara, el largo desde la frente hasta el mentón y el ancho de la frente y de la mandíbula.",
        blocks: [
          {
            type: "list",
            ordered: false,
            items: [
              `Rostro redondo, de ángulos suaves y frente y mandíbula del mismo ancho: un armazón rectangular lo suaviza y uno redondo lo realza. El ${hubLink("wayfarer")} es la opción más angulosa de esta comparación.`,
              `Rostro ovalado, con la frente y la mandíbula que se afinan apenas: formas cuadradas o redondas, como el Wayfarer, el ${hubLink("round")} o el ${hubLink("erika")}.`,
              "Rostro triangular o de corazón, más ancho en la frente que en la mandíbula: formas redondas o cuadradas.",
              "Rostro cuadrado, de líneas marcadas y pómulos, frente y mandíbula del mismo ancho: formas redondas o rectangulares, como el Round o el Erika.",
            ],
          },
          {
            type: "paragraph",
            text: `La guía de Ray-Ban no clasifica la forma piloto del ${hubLink("aviador")} ni la del ${hubLink("hexagonal")}, que la marca define como irregular. Según All About Vision, los aviadores favorecen los rostros ovalados y cuadrados, y las formas geométricas, los rostros de corazón y los alargados. Para más detalle por tipo de cara, mirá la ${link("guía de estilo", "/guia-de-estilo")}.`,
          },
        ],
      },
      {
        id: "cuando-elegir-aviador",
        heading: "¿Cuándo conviene un Ray-Ban Aviador?",
        answer:
          "Conviene si buscás uno de los modelos más reconocidos de la marca: Ray-Ban lo diseñó en 1937 para aviadores estadounidenses. Tiene armazón de metal y, en el Aviator Classic (RB3025), lentes de 55, 58 o 62 milímetros de ancho, los más grandes de esta comparación. Según All About Vision, favorece los rostros ovalados y cuadrados.",
        blocks: [
          {
            type: "paragraph",
            text: `Si lo vas a usar para manejar, fijate en la tabla si hay versión polarizada y leé ${link("qué hacen los lentes polarizados y cuándo convienen", guidePath(GUIDE_SLUGS.polarized))}. Modelos disponibles: ${hubLink("aviador", "Ray-Ban Aviador")}.`,
          },
        ],
      },
      {
        id: "cuando-elegir-wayfarer",
        heading: "¿Cuándo conviene un Ray-Ban Wayfarer?",
        answer:
          "Conviene si preferís un armazón de acetato y anguloso en lugar de uno de metal. Ray-Ban fecha su diseño inicial en 1952 y lo clasifica como forma cuadrada, que su guía recomienda para rostros ovalados y triangulares; por el contraste, también suaviza un rostro redondo. El Wayfarer original (RB2140) se ofrece en 50 y 54 milímetros.",
        blocks: [
          {
            type: "paragraph",
            text: `Modelos disponibles: ${hubLink("wayfarer", "Ray-Ban Wayfarer")}.`,
          },
        ],
      },
      {
        id: "cuando-elegir-round-hexagonal-erika",
        heading: "¿Cuándo conviene un Round, un Hexagonal o un Erika?",
        answer:
          "Convienen si buscás una forma redondeada, que según Ray-Ban favorece a los rostros ovalados, triangulares y cuadrados. El Round Metal (RB3447) se inspira en la contracultura de los años 60; el Hexagonal (RB3548N) es su evolución, con lentes planos; y el Erika (RB4171) suma lentes redondos de tamaño oversize.",
        blocks: [
          {
            type: "paragraph",
            text: `Ray-Ban ubica el origen de su línea Round en 1989. En Smile, cada uno tiene su sección: ${hubLink("round", "Ray-Ban Round")}, ${hubLink("hexagonal", "Ray-Ban Hexagonal")} y ${hubLink("erika", "Ray-Ban Erika")}.`,
          },
        ],
      },
      {
        id: "donde-ver-los-modelos",
        heading: "¿Dónde ver estos modelos en Smile?",
        answer: `Cada modelo tiene su sección en Smile, con los productos con stock y los agotados, dentro de la ${link("colección Ray-Ban", RAY_BAN_PATH)}. Antes de comprar, revisá en la ficha el código de modelo y la medida, y comparalos con los que publica la marca, como explica la ${link("guía para reconocer unos Ray-Ban originales", guidePath(GUIDE_SLUGS.rayBanOriginals))}.`,
        blocks: [
          {
            type: "paragraph",
            text: `${STORE_LOCATION_SENTENCE} ${STORE_PAYMENT_SENTENCE}`,
          },
        ],
      },
    ],
    faqs: [],
    sources: SOURCES,
  };
}
