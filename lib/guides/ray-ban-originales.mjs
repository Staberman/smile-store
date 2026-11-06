// Guide: how to tell genuine Ray-Ban sunglasses. Lens marks, temple codes and
// sizes come from Ray-Ban's own pages (archived copies: ray-ban.com blocks
// automated readers); red flags from Ray-Ban, EssilorLuxottica and ESET.
// Smile's own claim stays the site's: "originales e importados", nothing more.
import {
  GUIDE_SLUGS,
  guidePath,
  link,
  STORE_LOCATION_SENTENCE,
  STORE_PAYMENT_SENTENCE,
} from "./shared.mjs";

const RAY_BAN_PATH = "/tienda/marcas/ray-ban";
const model = (slug) => `${RAY_BAN_PATH}/${slug}`;

// Ray-Ban product pages (ray-ban.com, United States), archived.
export const RAY_BAN_PRODUCT_SOURCES = {
  aviador: {
    publisher: "Ray-Ban",
    title: "Aviator Classic RB3025 (ficha de producto, copia archivada)",
    url: "https://web.archive.org/web/20260713093614/https://www.ray-ban.com/usa/sunglasses/RB3025%20MALE%20082-aviator%20classic-gold/805289114567?category_Id=26253",
  },
  wayfarer: {
    publisher: "Ray-Ban",
    title: "Original Wayfarer Classic RB2140 (ficha de producto, copia archivada)",
    url: "https://web.archive.org/web/20250824133724/https://www.ray-ban.com/usa/sunglasses/RB2140%20UNISEX%20062-original%20wayfarer%20classic-black/805289126577",
  },
  round: {
    publisher: "Ray-Ban",
    title: "Round Metal RB3447 (ficha de producto, copia archivada)",
    url: "https://web.archive.org/web/20250818121422/https://www.ray-ban.com/usa/sunglasses/RB3447%20MALE%20001-round%20metal-bronze-copper/8053672684322",
  },
  hexagonal: {
    publisher: "Ray-Ban",
    title: "Hexagonal Flat Lenses RB3548N (ficha de producto, copia archivada)",
    url: "https://web.archive.org/web/20251209085113/https://www.ray-ban.com/usa/sunglasses/RB3548N%20MALE%20009-hexagonal%20flat%20lenses-gold/8053672689679",
  },
  erika: {
    publisher: "Ray-Ban",
    title: "Erika Classic RB4171 (ficha de producto, copia archivada)",
    url: "https://web.archive.org/web/20260508120816/https://www.ray-ban.com/usa/sunglasses/RB4171%20UNISEX%20015-erika%20classic-tortoise/8053672495744?category_Id=1386626",
  },
};

const SOURCES = [
  {
    publisher: "Ray-Ban",
    title: "Frequently Asked Questions (Estados Unidos, copia archivada)",
    url: "https://web.archive.org/web/20260615115659/https://www.ray-ban.com/usa/c/frequently-asked-questions",
  },
  {
    publisher: "Ray-Ban",
    title: "Size guide (Estados Unidos, copia archivada)",
    url: "https://web.archive.org/web/20170424022818/http://www.ray-ban.com/usa/size-guide?pid=IP01_G-DSA_DSA_DSA",
  },
  RAY_BAN_PRODUCT_SOURCES.aviador,
  RAY_BAN_PRODUCT_SOURCES.wayfarer,
  RAY_BAN_PRODUCT_SOURCES.round,
  RAY_BAN_PRODUCT_SOURCES.hexagonal,
  RAY_BAN_PRODUCT_SOURCES.erika,
  {
    publisher: "Ray-Ban",
    title: "Store locator",
    url: "https://www.ray-ban.com/usa/c/store-locator",
  },
  {
    publisher: "Ray-Ban",
    title: "Ray-Ban certified premium store (copia archivada)",
    url: "https://web.archive.org/web/20250720053953/https://www.ray-ban.com/row/l/cr-program",
  },
  {
    publisher: "Ray-Ban",
    title: "Report fakes",
    url: "https://www.ray-ban.com/usa/getsupport/report-fakes",
  },
  {
    publisher: "EssilorLuxottica",
    title: "2025 Universal Registration Document",
    url: "https://www.essilorluxottica.com/api/getCapContent/?id=284320&download=false",
  },
  {
    publisher: "ESET WeLiveSecurity",
    title: "Buying Ray-Bans? Don't fall for this Facebook scam (2016)",
    url: "https://www.welivesecurity.com/2016/04/06/buying-ray-bans-dont-fall-for-this-facebook-scam/",
  },
];

export function rayBanOriginalsGuide() {
  return {
    slug: GUIDE_SLUGS.rayBanOriginals,
    title: "Cómo saber si unos Ray-Ban son originales",
    h1: "Cómo saber si unos Ray-Ban son originales",
    description:
      "Cómo reconocer unos Ray-Ban originales: grabados en los lentes, código y medida en la patilla, señales de alerta y dónde comprar, con datos de Ray-Ban.",
    summary:
      "Los grabados de los lentes, el código y la medida de la patilla, las señales de una falsificación y dónde conviene comprar.",
    crumb: "Ray-Ban originales",
    datePublished: "2026-10-22",
    dateModified: "2026-11-06",
    about: ["Ray-Ban", "Falsificaciones", "Anteojos de sol"],
    lead: "Para saber si unos Ray-Ban son originales, revisá que el lente izquierdo tenga grabadas las iniciales «RB» y el derecho el logo de la marca, que la patilla izquierda muestre el código de modelo y la medida, y que esos datos coincidan con los que publica Ray-Ban. Desconfiá de descuentos enormes y de los sitios sin conexión segura.",
    sections: [
      {
        id: "marcas-en-los-lentes",
        heading: "¿Qué marcas tienen los lentes de unos Ray-Ban originales?",
        answer:
          "Según Ray-Ban, sus lentes llevan dos grabados: el logo completo de la marca en el lente derecho y las iniciales «RB» en el izquierdo. Son marcas sutiles, que la empresa presenta como un sello que ayuda a verificar la autenticidad. Si el lente es polarizado, además lleva una «P» junto al logo del lente derecho.",
        blocks: [
          {
            type: "paragraph",
            text: `Ray-Ban lo detalla en sus preguntas frecuentes al hablar de sus lentes personalizados, y aclara que la ubicación de los grabados es la misma en lentes de sol y de receta. La «P» de los polarizados figura en el glosario de esa misma página. Si no sabés qué cambia un lente polarizado, mirá ${link("qué son los anteojos polarizados y cuándo convienen", guidePath(GUIDE_SLUGS.polarized))}.`,
          },
        ],
      },
      {
        id: "codigo-y-medida-en-la-patilla",
        heading: "¿Qué dice la patilla de unos Ray-Ban originales?",
        answer:
          "Del lado interno de la patilla izquierda, Ray-Ban imprime el código de modelo, formado por dos letras y cuatro números, como RB3025, y la medida: el ancho del lente y el del puente en milímetros, a veces seguidos del largo de la patilla. Esos datos tienen que coincidir con el modelo que te ofrecen.",
        blocks: [
          {
            type: "paragraph",
            text: "Por ejemplo, Ray-Ban identifica uno de sus Aviador Classic como «RB3025 001/58 58-14», donde 58-14 indica 58 milímetros de lente y 14 de puente. La tabla resume el código y las medidas que la marca publica para cinco modelos clásicos:",
          },
          {
            type: "table",
            caption: "Código y medidas (lente-puente y largo de patilla, en milímetros) según las fichas de ray-ban.com.",
            head: ["Modelo", "Código", "Medidas que publica Ray-Ban"],
            rows: [
              [link("Aviador Classic", model("aviador")), "RB3025", "55-14, 58-14 y 62-14; patilla de 135"],
              [link("Wayfarer original", model("wayfarer")), "RB2140", "50-22 y 54-18; patilla de 150"],
              [link("Round Metal", model("round")), "RB3447", "47-21, 50-21 y 53-21; patilla de 145"],
              [link("Hexagonal", model("hexagonal")), "RB3548N", "48-21, 51-21 y 54-21; patilla de 145"],
              [link("Erika", model("erika")), "RB4171", "54-18; patilla de 145"],
            ],
          },
          {
            type: "paragraph",
            text: `Si la patilla muestra una medida que no figura entre las publicadas para ese código, preguntá antes de comprar. Para elegir entre estos modelos, mirá ${link("Aviador, Wayfarer o Round: cuál elegir", guidePath(GUIDE_SLUGS.rayBanModels))}.`,
          },
        ],
      },
      {
        id: "estuche-y-caja",
        heading: "¿Sirven el estuche y la caja para comprobar que son originales?",
        answer:
          "Solo como complemento. Ray-Ban entrega sus anteojos con estuche, pero ninguna de las páginas de la marca consultadas para esta guía presenta la caja, el estuche o los folletos como prueba de autenticidad. Los datos que sí podés contrastar con fuentes de la marca son los grabados de los lentes, el código de modelo y la medida.",
        blocks: [],
      },
      {
        id: "senales-de-falsificacion",
        heading: "¿Qué señales indican que unos Ray-Ban son falsos?",
        answer:
          "Las señales más claras son un descuento enorme e igual en todos los modelos, un sitio sin conexión segura, ofertas que llegan por redes sociales y datos que no coinciden: lentes sin los grabados, una patilla sin código o una medida que Ray-Ban no publica para ese modelo. Con una sola alcanza para frenar la compra.",
        blocks: [
          {
            type: "list",
            ordered: false,
            items: [
              "Precio: en 2016, la empresa de seguridad ESET documentó tiendas falsas de Ray-Ban que aplicaban el mismo descuento gigante a todos los modelos.",
              "Sitio sin HTTPS: esas mismas tiendas no cifraban la conexión, así que los datos de la tarjeta viajaban sin protección.",
              "Redes sociales: Ray-Ban advierte sobre estafas en Instagram y Facebook que usan la marca para robar datos personales.",
              "Datos que no coinciden: grabados ausentes, un código que no corresponde al modelo o una medida que no figura en la ficha oficial.",
            ],
          },
          {
            type: "paragraph",
            text: "Ray-Ban advierte que las falsificaciones pueden dañar la salud de quienes las compran, porque no cumplen estándares de calidad. Solo en 2025, EssilorLuxottica, el grupo dueño de Ray-Ban, informó la incautación de 5,5 millones de productos falsificados, el cierre de más de 1.400 dominios y la baja de cerca de 540.000 publicaciones en marketplaces.",
          },
        ],
      },
      {
        id: "donde-comprar",
        heading: "¿Dónde conviene comprar Ray-Ban originales?",
        answer:
          "Lo más seguro es comprar en tiendas de Ray-Ban o en comercios que la marca reconoce como revendedores certificados: su localizador de tiendas, en ray-ban.com, permite buscarlos. Si comprás en otra tienda, pedí el código de modelo y la medida antes de pagar, y verificá que coincidan con los que publica Ray-Ban.",
        blocks: [
          {
            type: "paragraph",
            text: `Smile vende anteojos de sol Ray-Ban originales e importados, y podés aplicar estos mismos controles a cualquier modelo de la ${link("colección Ray-Ban", RAY_BAN_PATH)}: si querés confirmar el código o la medida antes de comprar, consultanos por WhatsApp. Si estás en Rosario, mirá ${link("dónde comprar Ray-Ban originales en Rosario", guidePath(GUIDE_SLUGS.rayBanRosario))}. ${STORE_LOCATION_SENTENCE} ${STORE_PAYMENT_SENTENCE}`,
          },
        ],
      },
    ],
    faqs: [
      {
        question: "¿Unos Ray-Ban «Made in China» son falsos?",
        answer:
          "No necesariamente. EssilorLuxottica, el grupo dueño de Ray-Ban, fabrica armazones en Italia, China, Tailandia, Brasil, México, Estados Unidos, Japón e India, así que el país de origen no alcanza para juzgar un par. Lo que conviene revisar son los grabados, el código de modelo y la medida.",
      },
      {
        question: "¿Cómo denuncio una falsificación de Ray-Ban?",
        answer:
          "Ray-Ban tiene en su sitio un formulario para denunciar falsificaciones, donde se indica si se encontraron en una página web o en un local. En ese mismo sitio, la marca explica que Luxottica trabaja con aduanas y fuerzas de seguridad para interceptar productos falsos.",
      },
    ],
    sources: SOURCES,
  };
}
