// Guide: what polarized lenses do, how they differ from UV protection, when
// they help or get in the way, and how to check them. Every claim is backed
// by a source in SOURCES; the polarized models come from the catalog.
import { isSunglassesProduct } from "../collection-hubs.mjs";
import {
  capList,
  GUIDE_SLUGS,
  guidePath,
  link,
  normalize,
  STORE_LOCATION_SENTENCE,
  STORE_PAYMENT_SENTENCE,
} from "./shared.mjs";

const SUNGLASSES_PATH = "/tienda/anteojos-de-sol";
const RAY_BAN_PATH = "/tienda/marcas/ray-ban";

/**
 * Polarized sunglasses, by product name ("Aviador Polarizado 3025"). The
 * name is the reliable signal: each of these descriptions says polarized
 * too, while the "gafas de sol polarizadas" tag sits on most of the catalog.
 */
export function isPolarizedProduct(product) {
  return isSunglassesProduct(product) && /\bpolarizad[oa]s?\b/.test(normalize(product.name));
}

const SOURCES = [
  {
    publisher: "American Academy of Ophthalmology",
    title: "What Are Polarized Lenses?",
    url: "https://www.aao.org/eye-health/glasses-contacts/polarized-lenses",
  },
  {
    publisher: "American Academy of Ophthalmology",
    title: "How to Choose the Best Sunglasses to Avoid Sun Damage",
    url: "https://www.aao.org/eye-health/glasses-contacts/sunglasses-3",
  },
  {
    publisher: "American Academy of Ophthalmology",
    title: "The Sun, UV Light and Your Eyes",
    url: "https://www.aao.org/eye-health/tips-prevention/sun",
  },
  {
    publisher: "American Optometric Association",
    title: "The heat is on: Ensure patients' protective eyewear is, too",
    url: "https://www.aoa.org/news/clinical-eye-care/health-and-wellness/protecting-patients-eye-summer",
  },
  {
    publisher: "Organización Mundial de la Salud",
    title: "Ultraviolet radiation (hoja informativa)",
    url: "https://www.who.int/news-room/fact-sheets/detail/ultraviolet-radiation",
  },
  {
    publisher: "Cancer Council Australia",
    title: "Eye protection (fact sheet)",
    url: "https://www.cancer.org.au/about-us/policy-and-advocacy/prevention/uv-radiation/related-resources/fact-sheet-eye-protection",
  },
  {
    publisher: "Federal Aviation Administration (FAA)",
    title: "Sunglasses for Pilots (folleto de seguridad, 2024)",
    url: "https://www.faa.gov/pilots/safety/pilotsafetybrochures/Sunglasses.pdf",
  },
  {
    publisher: "College of Optometrists (Reino Unido)",
    title: "Tints and driving",
    url: "https://www.college-optometrists.org/clinical-guidance/guidance/knowledge,-skills-and-performance/examining-patients-who-drive/tints-and-driving",
  },
  {
    publisher: "Association of British Dispensing Opticians (ABDO)",
    title: "Protective Eyewear",
    url: "https://www.abdo.org.uk/wp-content/uploads/2012/06/Protective-eyewear-2014.pdf",
  },
  {
    publisher: "ZEISS Vision Care",
    title: "Polarised sunglasses: Comfortable vision without distracting glare",
    url: "https://www.zeiss.com/vision-care/en/eye-health-and-care/sports-leisure/polarised-sunglasses-comfortable-vision-without-distracting-glare.html",
  },
  {
    publisher: "All About Vision",
    title: "Polarized sunglasses and LCD screens",
    url: "https://www.allaboutvision.com/eyewear/sunglasses/lenses/polarized-lenses-and-lcd-screens/",
  },
  {
    publisher: "ANMAT (Argentina)",
    title: "Disposición 562/2019: anteojos para sol",
    url: "https://www.argentina.gob.ar/normativa/nacional/disposici%C3%B3n-562-2019-318985/texto",
  },
];

function modelsPhrase(count) {
  return `${count} ${count === 1 ? "modelo" : "modelos"}`;
}

/** The store section: polarized models in stock, or the sunglasses hub without any. */
function storeSection(polarized, displayName) {
  const sunglasses = link("anteojos de sol", SUNGLASSES_PATH);
  const rayBan = link("colección Ray-Ban", RAY_BAN_PATH);
  const closing = { type: "paragraph", text: `${STORE_LOCATION_SENTENCE} ${STORE_PAYMENT_SENTENCE}` };

  if (polarized.length === 0) {
    return {
      answer: `Por el momento no hay modelos con stock que el catálogo de Smile marque como polarizados en el nombre del producto. Podés ver todos los ${link("anteojos de sol disponibles", SUNGLASSES_PATH)} y revisar en cada ficha el tipo de lente y la protección UV declarada, o consultarnos por WhatsApp por la reposición.`,
      blocks: [closing],
    };
  }

  const { shown, more } = capList(polarized);
  return {
    answer: `Hoy hay ${modelsPhrase(polarized.length)} con stock que el catálogo de Smile marca como polarizados en el nombre del producto. Antes de comprar, revisá en cada ficha el tipo de lente, el armazón y la protección UV declarada; si te queda alguna duda sobre un modelo, podés consultarnos por WhatsApp.`,
    blocks: [
      {
        type: "links",
        catalog: true,
        items: [
          ...shown.map((product) => ({
            label: displayName(product),
            href: `/tienda/productos/${product.slug}`,
          })),
          ...(more > 0 ? [{ label: `Y ${modelsPhrase(more)} más en anteojos de sol`, href: SUNGLASSES_PATH }] : []),
        ],
      },
      { type: "paragraph", text: `También podés ver todos los ${sunglasses} o la ${rayBan}.` },
      closing,
    ],
  };
}

export function polarizedGuide({ inStock, displayName }) {
  const polarized = inStock
    .filter(isPolarizedProduct)
    .sort((a, b) => displayName(a).localeCompare(displayName(b), "es"));
  const store = storeSection(polarized, displayName);

  return {
    slug: GUIDE_SLUGS.polarized,
    title: "Anteojos polarizados: qué son y cuándo conviene",
    h1: "Anteojos polarizados: qué son y cuándo conviene usarlos",
    description:
      "Qué hacen los lentes polarizados, por qué no son lo mismo que la protección UV, cuándo conviene usarlos y cómo comprobar si tus anteojos lo son.",
    summary:
      "Qué hace el filtro polarizado, por qué no reemplaza la protección UV, cuándo ayuda y cuándo no, y cómo comprobarlo en casa.",
    crumb: "Anteojos polarizados",
    datePublished: "2026-10-22",
    dateModified: "2026-11-06",
    about: ["Lentes polarizados", "Protección UV", "Anteojos de sol"],
    lead: "Los anteojos polarizados tienen un filtro que bloquea el reflejo que rebota en superficies planas, como el agua, la nieve, el asfalto mojado o el capó de un auto. Reducen el encandilamiento al manejar o cerca del agua, pero no equivalen a protección UV: son dos características distintas y conviene verificar las dos.",
    sections: [
      {
        id: "que-hace-un-lente-polarizado",
        heading: "¿Qué hace un lente polarizado?",
        answer:
          "Un lente polarizado tiene un filtro especial que deja pasar la luz que llega en sentido vertical y frena la que rebota en sentido horizontal sobre superficies lisas. Ese reflejo es el que encandila en el agua, en la nieve o en una ruta mojada; al bloquearlo, la imagen se ve con más contraste y menos molestia.",
        blocks: [
          {
            type: "paragraph",
            text: "La Academia Americana de Oftalmología (AAO) compara ese filtro con una persiana que solo deja pasar la luz orientada en una dirección. Por eso son tan usados para pescar: al cortar el reflejo de la superficie, dejan ver mejor dentro del agua. La Administración Federal de Aviación (FAA) de Estados Unidos los describe como útiles contra la luz reflejada en superficies horizontales como el agua o la nieve.",
          },
        ],
      },
      {
        id: "polarizado-o-proteccion-uv",
        heading: "¿Polarizado es lo mismo que protección UV?",
        answer:
          "No. La polarización reduce el reflejo, pero por sí sola no bloquea la radiación ultravioleta, según la AAO. Un lente puede ser polarizado y no filtrar UV, o al revés. Lo que protege los ojos de esa radiación es el filtro UV: buscá en la etiqueta la indicación UV400 o el bloqueo de los rayos UVA y UVB.",
        blocks: [
          {
            type: "table",
            caption: "Polarización y protección UV: qué hace cada una",
            head: ["Característica", "Polarización", "Protección UV"],
            rows: [
              ["Qué hace", "Bloquea el reflejo horizontal que encandila", "Filtra los rayos UVA y UVB"],
              [
                "Para qué sirve",
                "Ver con más comodidad y contraste cerca del agua, en la nieve o en la ruta",
                "Reducir el riesgo de daño ocular por radiación UV",
              ],
              [
                "Cómo se identifica",
                "La etiqueta o la ficha dice «polarizado»; la prueba de la pantalla lo confirma",
                "La etiqueta indica UV400 o el bloqueo de UVA y UVB",
              ],
            ],
          },
          {
            type: "paragraph",
            text: "La AAO y la Organización Mundial de la Salud (OMS) relacionan la exposición a los rayos UV con cataratas, pterigión (un crecimiento de tejido sobre la superficie del ojo) y fotoqueratitis, una quemadura de la córnea.",
          },
          {
            type: "paragraph",
            text: "En la Argentina, la Disposición 562/2019 de la ANMAT exige que el rótulo de los anteojos para sol que se fabrican o importan indique la categoría de filtro, de 0 a 4, y el cumplimiento de la protección ocular UV. En las fichas de Smile, ese dato aparece en la línea «Protección» cuando el modelo lo informa.",
          },
        ],
      },
      {
        id: "cuando-conviene",
        heading: "¿Cuándo conviene usar anteojos polarizados?",
        answer:
          "Convienen cuando el problema es el reflejo: para manejar de día, sobre todo con el asfalto mojado, y para actividades cerca del agua como pescar, navegar o pasar el día en la playa. También ayudan con el resplandor de la nieve, aunque en una pista de esquí tienen límites que conviene conocer.",
        blocks: [
          {
            type: "list",
            ordered: false,
            items: [
              "Manejar de día: la AAO, la Asociación Americana de Optometría (AOA) y la asociación británica de ópticos ABDO los recomiendan para reducir el reflejo en la ruta; ABDO destaca su utilidad con pavimento mojado y sol.",
              "Pesca, navegación y deportes acuáticos: cortan el reflejo del agua y dejan ver mejor debajo de la superficie.",
              "Playa y golf: la AAO los menciona por el resplandor del agua y de la arena, y por la comodidad en la cancha.",
              "Nieve: suelen ayudar con el resplandor, con las salvedades de la sección siguiente.",
            ],
          },
          {
            type: "paragraph",
            text: `Si estás eligiendo un modelo, la ${link("comparación de Ray-Ban Aviador, Wayfarer y Round", guidePath(GUIDE_SLUGS.rayBanModels))} resume el estilo y el armazón de cada uno.`,
          },
        ],
      },
      {
        id: "cuando-no-conviene",
        heading: "¿Cuándo no conviene usarlos?",
        answer:
          "Pueden jugar en contra cuando necesitás leer pantallas LCD, como el tablero del auto, el celular o un cajero automático, porque se ven oscuras en ciertos ángulos. Tampoco se recomiendan para pilotar aviones ni para esquiar en pistas con hielo, y la AAO advierte que los polarizados para manejar de noche pueden ser contraproducentes.",
        blocks: [
          {
            type: "list",
            ordered: false,
            items: [
              "Pantallas: el filtro del lente y el de la pantalla se contrarrestan, así que tableros, celulares, cajeros y algunos relojes pueden verse oscuros. Según ZEISS, la mayoría de los autos modernos se leen bien.",
              "Aviación: la FAA indica que no se recomiendan en la cabina, porque pueden reducir o eliminar la visibilidad de instrumentos con filtros antirreflejo.",
              "Hielo y esquí: pueden hacer más difícil distinguir placas de hielo en la ruta o en la pista (AAO) y disimular los relieves de la pista (ABDO).",
              "De noche: ABDO indica que los filtros de sol de categoría 1 a 4 no son aptos para manejar de noche.",
            ],
          },
        ],
      },
      {
        id: "como-saber-si-son-polarizados",
        heading: "¿Cómo saber si unos anteojos son polarizados?",
        answer:
          "Lo más simple es leer la etiqueta o la ficha del producto, que lo indica cuando el lente es polarizado. Para comprobarlo en casa, mirá una pantalla LCD a través del lente y girá los anteojos unos 90 grados: si son polarizados, la pantalla se oscurece. Si tenés dudas, un óptico puede verificarlo.",
        blocks: [
          {
            type: "steps",
            items: [
              {
                title: "Etiqueta o ficha",
                text: "buscá la palabra «polarizado». En el catálogo de Smile, los modelos polarizados lo indican en el nombre del producto.",
              },
              {
                title: "Prueba de la pantalla",
                text: "sostené los anteojos frente a un monitor o una pantalla LCD y giralos unos 90 grados. Si la imagen se oscurece mucho o se pone negra, el lente es polarizado.",
              },
              {
                title: "Prueba del espejo",
                text: "mirá a través del lente un reflejo, por ejemplo en un espejo de mano, y girá los anteojos unos 90 grados: con un lente polarizado, el reflejo empieza a desaparecer.",
              },
            ],
          },
          {
            type: "paragraph",
            text: `Estas pruebas confirman la polarización, no la protección UV: para eso hay que mirar la etiqueta. Si además querés comprobar que un Ray-Ban sea auténtico, revisá ${link("cómo saber si unos Ray-Ban son originales", guidePath(GUIDE_SLUGS.rayBanOriginals))}, y si comprás desde Rosario, mirá ${link("dónde comprar Ray-Ban originales en Rosario", guidePath(GUIDE_SLUGS.rayBanRosario))}.`,
          },
        ],
      },
      {
        id: "polarizados-en-smile",
        heading: "¿Qué anteojos polarizados hay en Smile?",
        answer: store.answer,
        blocks: store.blocks,
      },
    ],
    faqs: [
      {
        question: "¿Los lentes más oscuros protegen más del sol?",
        answer:
          "No necesariamente. Según la AAO y Cancer Council Australia, ni la oscuridad ni el color del lente indican cuánta radiación UV bloquea. Lo que importa es que la etiqueta indique UV400 o el bloqueo de los rayos UVA y UVB.",
      },
      {
        question: "¿Qué categoría de filtro sirve para manejar?",
        answer:
          "La norma internacional ISO 12312-1 clasifica los filtros solares en categorías de 0 a 4, de más claro a más oscuro. Según el College of Optometrists británico, para manejar sirven las categorías 0 a 3; la categoría 4 es demasiado oscura y no es apta para conducir.",
      },
    ],
    sources: SOURCES,
  };
}
