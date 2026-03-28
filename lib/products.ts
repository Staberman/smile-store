const CDN = "https://acdn-us.mitiendanube.com/stores/003/759/046/products";
const STORE = "https://www.smiletiendaimp.com.ar/productos";

export type Variant = {
  label: string;
  inStock: boolean;
  price?: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  brand: string;
  collection: string;
  subcollection?: string;
  price: number;
  images: string[];
  storeUrl: string;
  variants?: Variant[];
  description?: string;
  featured?: boolean;
  badge?: string;
};

// ─── RAY-BAN ─────────────────────────────────────────────────────────────────

export const raybanProducts: Product[] = [
  {
    id: "rb-aviador-classic",
    slug: "aviador-classic-3025",
    name: "Aviador Classic",
    subtitle: "3025",
    brand: "ray-ban",
    collection: "Aviador",
    price: 182700,
    images: [
      `${CDN}/aviador-classic-doradoverde-1-64204a86eac68f740b17121121526969-1024-1024.webp`,
      `${CDN}/aviador-classic-negroverde-1-60721f750523b34ce317156040149919-1024-1024.webp`,
      `${CDN}/aviador-classic-doradomarron-2-e8fd34829749543aa517156040163906-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/aviador-classic-dorado-verde1`,
    variants: [
      { label: "Dorado / Verde", inStock: true },
      { label: "Negro / Verde", inStock: true },
      { label: "Dorado / Marrón", inStock: true },
      { label: "Dorado / Marrón degradé", inStock: true, price: 215000 },
    ],
    description: "El ícono atemporal. La forma de gota de lágrima clásica que definió generaciones de estilo. Fabricado con materiales de alta calidad, el Aviador 3025 es una pieza que trasciende tendencias.",
    featured: true,
  },
  {
    id: "rb-wayfarer",
    slug: "wayfarer-2140",
    name: "Wayfarer",
    subtitle: "2140",
    brand: "ray-ban",
    collection: "Wayfarer",
    price: 175900,
    images: [
      `${CDN}/wayfarer-negroverde-1-2ce5f79bb2e258002817157492457980-1024-1024.webp`,
      `${CDN}/wayfarer-careyverde-75e9684e2a8fdd76b917157495924916-1024-1024.webp`,
      `${CDN}/wayfarer-carey-marron-degrade-1-f1d46f92c0f98dec3317157492463098-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/wayfarer-2140`,
    variants: [
      { label: "Negro / Verde", inStock: true },
      { label: "Carey / Verde", inStock: true, price: 215000 },
      { label: "Carey / Marrón degradé", inStock: false },
    ],
    description: "El modelo más icónico de la historia del eyewear. Introducido en 1952, el Wayfarer 2140 combina una silueta atemporal con la versatilidad para adaptarse a cualquier estilo.",
    featured: true,
  },
  {
    id: "rb-clubmaster",
    slug: "clubmaster-classic-3016",
    name: "Clubmaster Classic",
    subtitle: "3016",
    brand: "ray-ban",
    collection: "Clubmaster",
    price: 182700,
    images: [
      `${CDN}/clubmaster-classic-negro-doradoverde-1-8ee8cf5b015369ff3b17121488611694-1024-1024.webp`,
      `${CDN}/clubmaster-classic-carey-doradoverde-5537b919de6e04153517156092397133-1024-1024.webp`,
      `${CDN}/clubmaster-classic-carey-doradomarron-degrade-142351e7d14d244f4917156092412633-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/clubmaster-classic-3016`,
    variants: [
      { label: "Negro-Dorado / Verde", inStock: true },
      { label: "Carey-Dorado / Verde", inStock: true, price: 215000 },
      { label: "Carey-Dorado / Marrón degradé", inStock: true },
    ],
    description: "Inspirado en el diseño browline de los años 50, el Clubmaster fusiona el retro con lo contemporáneo. Una pieza que comunica sofisticación y carácter intelectual.",
    featured: true,
  },
  {
    id: "rb-round-metal",
    slug: "round-metal-classic-3447",
    name: "Round Metal Classic",
    subtitle: "3447",
    brand: "ray-ban",
    collection: "Round",
    price: 182700,
    images: [
      `${CDN}/round-metal-doradoverde-2076586d783f532bb717113631167425-1024-1024.webp`,
      `${CDN}/round-metal-negroverde-1-417ca7cfa8fea8292f17155672491179-1024-1024.webp`,
      `${CDN}/round-metal-doradomarron-degrade-1-cb4ed33035559fb52b17155672500165-1024-1024.webp`,
      `${CDN}/round-metal-doradoazul-degrade-a43acc24262a71173117155672487778-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/round-metal-classic-3447`,
    variants: [
      { label: "Dorado / Verde", inStock: true },
      { label: "Negro / Verde", inStock: true },
      { label: "Dorado / Marrón degradé", inStock: true },
      { label: "Dorado / Azul degradé", inStock: true, price: 215000 },
    ],
    description: "Formas geométricas perfectas con montura de metal delgada. El Round Metal 3447 es un símbolo de expresión artística y libre pensamiento.",
    featured: true,
  },
  {
    id: "rb-cats",
    slug: "cats-5000-rb4125",
    name: "Cats 5000",
    subtitle: "RB4125",
    brand: "ray-ban",
    collection: "Otros",
    price: 215000,
    images: [
      `${CDN}/cats-negrogris-degrade-bdadae022f09166b5f17156276190219-1024-1024.webp`,
      `${CDN}/cats-negroverde-303657501dfe40482a17156276191221-1024-1024.webp`,
      `${CDN}/cats-careymarron-degrade-a0c8eb386169a75a5117156276192632-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/cats-5000-rb4125`,
    variants: [
      { label: "Negro / Gris degradé", inStock: true },
      { label: "Negro / Verde", inStock: true },
      { label: "Carey / Marrón degradé", inStock: false },
    ],
    description: "Silueta cat-eye icónica. El Cats 5000 aporta una sensualidad visual innata con su forma alargada característica.",
    featured: false,
  },
  {
    id: "rb-erika",
    slug: "erika-4171",
    name: "Erika",
    subtitle: "4171",
    brand: "ray-ban",
    collection: "Otros",
    price: 179900,
    images: [
      `${CDN}/erika-negrogris-degrade-1-50993267a30527c76417125018526848-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/erika-4171`,
    variants: [
      { label: "Negro / Gris degradé", inStock: true },
    ],
    description: "El Erika combina una silueta redonda con material de acetato ligero. Diseño delicado con actitud fuerte.",
  },
  {
    id: "rb-erika-pol",
    slug: "erika-polarizado-4171",
    name: "Erika Polarizado",
    subtitle: "4171",
    brand: "ray-ban",
    collection: "Otros",
    price: 236700,
    images: [
      `${CDN}/erika-negrogris-degrade-polarizado-2-10db04f4c7802276a217125027158092-1024-1024.webp`,
      `${CDN}/erika-careymarron-degrade-polarizado-1-c74678d5c86199f3c817156099003970-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/erika-polarizado-4171`,
    variants: [
      { label: "Carey / Marrón degradé polarizado", inStock: true },
    ],
    badge: "Polarizado",
  },
  {
    id: "rb-hexagonal",
    slug: "hexagonal-classic-3548",
    name: "Hexagonal Classic",
    subtitle: "3548",
    brand: "ray-ban",
    collection: "Otros",
    price: 182700,
    images: [
      `${CDN}/hexagonal-dorado-verde-3548-001-1-74e2c9508ebf01532017610789127331-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/hexagonal-classic-3548`,
    variants: [
      { label: "Dorado / Verde", inStock: true },
    ],
    description: "Forma hexagonal única que aporta geometría y modernidad a cualquier look.",
  },
  {
    id: "rb-justin-pol",
    slug: "justin-4165-polarizados",
    name: "Justin Polarizado",
    subtitle: "4165",
    brand: "ray-ban",
    collection: "Otros",
    price: 236700,
    images: [
      `${CDN}/justin-negrogris-degrade-polarizado-1-9745a2757f07ea5d1117157417400492-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/justin-4165-polarizados`,
    variants: [
      { label: "Negro / Gris degradé", inStock: true },
    ],
    badge: "Polarizado",
  },
  {
    id: "rb-mega-clubmaster",
    slug: "mega-clubmaster-0316s",
    name: "Mega Clubmaster",
    subtitle: "0316S",
    brand: "ray-ban",
    collection: "Clubmaster",
    price: 182700,
    images: [
      `${CDN}/clubmaster-mega-negro-doradoverde-c75061612f9c89d31817125164502752-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/mega-clubmaster-0316s`,
    variants: [
      { label: "Negro-Dorado / Verde", inStock: true },
    ],
  },
  {
    id: "rb-clubmaster-blaze",
    slug: "clubmaster-blaze-3576",
    name: "Clubmaster Blaze",
    subtitle: "3576",
    brand: "ray-ban",
    collection: "Clubmaster",
    price: 182700,
    images: [
      `${CDN}/blaze-clubmaster-dorado-verde-43f074696d313a549a17612412935343-1024-1024.webp`,
      `${CDN}/clubmaster-blaze-broncerojo-degrade-espejado-160ec92d5be297a3a117155687300197-1024-1024.webp`,
      `${CDN}/clubmaster-blaze-doradorosa-espejado-2-c16bd6c351f2f9c67d17155687304995-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/clubmaster-blaze-3576`,
    variants: [
      { label: "Dorado / Verde", inStock: true },
      { label: "Bronce / Rojo degradé espejado", inStock: true },
      { label: "Dorado / Rosa espejado", inStock: true },
    ],
  },
  {
    id: "rb-round-fleck",
    slug: "round-fleck-2447",
    name: "Round Fleck",
    subtitle: "2447",
    brand: "ray-ban",
    collection: "Round",
    price: 182700,
    images: [
      `${CDN}/round-fleck-careymarron-liso-d538e55d2173f9134f17125429890284-1024-1024.webp`,
      `${CDN}/round-fleck-careyverde-1-7afcdef40f0cf24b9217157465902944-1024-1024.webp`,
      `${CDN}/round-fleck-negroverde-6395e6484423cc49cf17157465881914-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/round-fleck-2447`,
    variants: [
      { label: "Carey / Marrón", inStock: true },
      { label: "Carey / Verde", inStock: true },
      { label: "Negro / Verde", inStock: true },
    ],
  },
  {
    id: "rb-square",
    slug: "square-1971",
    name: "Square",
    subtitle: "1971",
    brand: "ray-ban",
    collection: "Otros",
    price: 182700,
    images: [
      `${CDN}/square-doradomarron-degrade-1-9b02ea075bd7ebba0117125847361511-1024-1024.webp`,
      `${CDN}/square-doradoverde-bdf4de3acf923801e717157478821284-1024-1024.webp`,
      `${CDN}/square-plateadogris-degrade-61139e2157c476f05d17157478817563-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/square-19711`,
    variants: [
      { label: "Dorado / Verde", inStock: true },
      { label: "Plateado / Gris degradé", inStock: true, price: 215000 },
      { label: "Dorado / Azul liso", inStock: true },
    ],
  },
  {
    id: "rb-aviador-pol",
    slug: "aviador-polarizado-30251",
    name: "Aviador Polarizado",
    subtitle: "3025",
    brand: "ray-ban",
    collection: "Aviador",
    price: 215000,
    images: [
      `${CDN}/aviador-classic-doradoverde-1-64204a86eac68f740b17121121526969-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/aviador-polarizado-30251`,
    variants: [
      { label: "Dorado / Verde polarizado", inStock: true },
    ],
    badge: "Polarizado",
  },
  // Ferrari Collection
  {
    id: "rb-ferrari-wayfarer",
    slug: "wayfarer-liteforce-ferrari",
    name: "Wayfarer Liteforce",
    subtitle: "4195M · Ferrari Collection",
    brand: "ray-ban",
    collection: "Ferrari Collection",
    subcollection: "ferrari",
    price: 245500,
    images: [
      `${CDN}/scuderia-ferrari-collection-wayfarer-liteforce-grisplateado-espejado-6efbcfbb43dc7c536d17156013893024-1024-1024.webp`,
      `${CDN}/scuderia-ferrari-collection-wayfarer-liteforce-azul-azul-espejado-1-0504ba78c1d96a545017156014045934-1024-1024.webp`,
      `${CDN}/scuderia-ferrari-collection-wayfarer-4195m-f60271-negro-verde-3275e965f47daed12717074187253868-1024-1024.webp`,
      `${CDN}/scuderia-ferrari-collection-wayfarer-4195m-f602h2-negro-plateado-degrade-espejado-9a2c9c04c8f7c1f2c017074187259266-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/wayfarer-liteforce-4195-scuderia-ferrari-collection`,
    variants: [
      { label: "Gris / Plateado espejado", inStock: false },
      { label: "Azul / Azul espejado", inStock: false },
      { label: "Negro / Verde", inStock: false },
      { label: "Negro / Plateado degradé espejado", inStock: false },
    ],
    description: "La colaboración entre Ray-Ban y Scuderia Ferrari. El Wayfarer Liteforce incorpora materiales de ingeniería de Fórmula 1 en un diseño icónico con identidad Ferrari.",
    featured: true,
    badge: "Ferrari Collection",
  },
  {
    id: "rb-ferrari-cats",
    slug: "cats-ferrari-collection",
    name: "Cats 5000 Ferrari",
    subtitle: "RB4125M · Ferrari Collection",
    brand: "ray-ban",
    collection: "Ferrari Collection",
    subcollection: "ferrari",
    price: 245500,
    images: [
      `${CDN}/cats-negrogris-degrade-bdadae022f09166b5f17156276190219-1024-1024.webp`,
    ],
    storeUrl: "https://www.smiletiendaimp.com.ar/lentes-de-sol/ray-ban/scuderia-ferrari-collection",
    variants: [
      { label: "Negro / Gris Ferrari", inStock: true },
    ],
    description: "El diseño cat-eye clásico con los acabados exclusivos de la Scuderia Ferrari Collection.",
    featured: true,
    badge: "Ferrari Collection",
  },
  {
    id: "rb-ferrari-aviador",
    slug: "aviador-ferrari-collection",
    name: "Aviador Ferrari",
    subtitle: "3025M · Ferrari Collection",
    brand: "ray-ban",
    collection: "Ferrari Collection",
    subcollection: "ferrari",
    price: 252000,
    images: [
      `${CDN}/aviador-classic-doradoverde-1-64204a86eac68f740b17121121526969-1024-1024.webp`,
    ],
    storeUrl: "https://www.smiletiendaimp.com.ar/lentes-de-sol/ray-ban/scuderia-ferrari-collection",
    variants: [
      { label: "Dorado / Verde Ferrari", inStock: true },
    ],
    description: "El icónico Aviador reimaginado con los materiales y la identidad visual de la Scuderia Ferrari.",
    featured: true,
    badge: "Ferrari Collection",
  },
];

// ─── INVICTA ──────────────────────────────────────────────────────────────────

export const invictaProducts: Product[] = [
  {
    id: "inv-prodiver-49277",
    slug: "invicta-pro-diver-49277",
    name: "Pro Diver",
    subtitle: "49277",
    brand: "invicta",
    collection: "Pro Diver",
    price: 320000,
    images: ["/images/card-relojes.jpg"],
    storeUrl: "https://www.smiletiendaimp.com.ar/relojes/invicta",
    variants: [
      { label: "Negro / Dorado", inStock: true },
    ],
    description: "El Pro Diver de Invicta combina robustez y elegancia. Sumergible hasta 200 metros, con movimiento japonés de cuarzo y cristal mineral.",
    featured: true,
  },
  {
    id: "inv-prodiver-49274",
    slug: "invicta-pro-diver-49274",
    name: "Pro Diver",
    subtitle: "49274",
    brand: "invicta",
    collection: "Pro Diver",
    price: 305000,
    images: ["/images/card-relojes.jpg"],
    storeUrl: "https://www.smiletiendaimp.com.ar/relojes/invicta",
    variants: [
      { label: "Plateado / Azul", inStock: true },
    ],
    description: "El Pro Diver en su versión plateada con esfera azul. Diseño clásico de buceo con identidad visual contundente.",
    featured: true,
  },
  {
    id: "inv-prodiver-auto",
    slug: "invicta-pro-diver-automatico",
    name: "Pro Diver Automático",
    subtitle: "Movimiento automático",
    brand: "invicta",
    collection: "Pro Diver",
    price: 380000,
    images: ["/images/card-relojes.jpg"],
    storeUrl: "https://www.smiletiendaimp.com.ar/relojes/invicta",
    variants: [
      { label: "Dorado / Esfera dorada", inStock: true },
    ],
    description: "Movimiento automático de 21 joyas. Una pieza mecánica con la identidad visual característica de Invicta.",
    featured: true,
  },
  {
    id: "inv-cronografo",
    slug: "invicta-cronografo",
    name: "Pro Diver Cronógrafo",
    subtitle: "Cronógrafo multifunción",
    brand: "invicta",
    collection: "Cronógrafo",
    price: 420000,
    images: ["/images/card-relojes.jpg"],
    storeUrl: "https://www.smiletiendaimp.com.ar/relojes/invicta",
    variants: [
      { label: "Negro / Rojo", inStock: true },
    ],
    description: "Cronógrafo con subdiales para segundos, minutos y horas. Presencia imponente en la muñeca.",
    featured: true,
    badge: "Cronógrafo",
  },
  {
    id: "inv-limited",
    slug: "invicta-pro-diver-limited",
    name: "Pro Diver Limited",
    subtitle: "Edición Limitada",
    brand: "invicta",
    collection: "Pro Diver",
    price: 450000,
    images: ["/images/card-relojes.jpg"],
    storeUrl: "https://www.smiletiendaimp.com.ar/relojes/invicta",
    variants: [
      { label: "Dorado / Rojo", inStock: true },
    ],
    description: "Edición limitada con acabados en oro y detalles rojo Ferrari. Una pieza coleccionable.",
    featured: true,
    badge: "Limited Edition",
  },
];

// ─── TOMMY HILFIGER ───────────────────────────────────────────────────────────

export const tommyProducts: Product[] = [
  {
    id: "th-1",
    slug: "tommy-hilfiger-classic",
    name: "Tommy Hilfiger",
    subtitle: "Classic · Carey / Marrón",
    brand: "tommy",
    collection: "Clásicos",
    price: 195000,
    images: ["/images/bg-tommy.jpg"],
    storeUrl: "https://www.smiletiendaimp.com.ar/lentes-de-sol/tommy-hilfiger",
    variants: [
      { label: "Carey / Marrón", inStock: true },
    ],
    featured: true,
  },
  {
    id: "th-2",
    slug: "tommy-hilfiger-square",
    name: "Tommy Hilfiger",
    subtitle: "Square · Negro / Gris",
    brand: "tommy",
    collection: "Cuadrados",
    price: 185000,
    images: ["/images/bg-tommy.jpg"],
    storeUrl: "https://www.smiletiendaimp.com.ar/lentes-de-sol/tommy-hilfiger",
    variants: [
      { label: "Negro / Gris", inStock: true },
    ],
    featured: true,
  },
  {
    id: "th-3",
    slug: "tommy-hilfiger-aviator",
    name: "Tommy Hilfiger",
    subtitle: "Aviator · Dorado / Marrón",
    brand: "tommy",
    collection: "Aviadores",
    price: 210000,
    images: ["/images/bg-tommy.jpg"],
    storeUrl: "https://www.smiletiendaimp.com.ar/lentes-de-sol/tommy-hilfiger",
    variants: [
      { label: "Dorado / Marrón", inStock: true },
    ],
    featured: true,
  },
  {
    id: "th-4",
    slug: "tommy-hilfiger-rectangular",
    name: "Tommy Hilfiger",
    subtitle: "Rectangular · Carey",
    brand: "tommy",
    collection: "Rectangulares",
    price: 190000,
    images: ["/images/bg-tommy.jpg"],
    storeUrl: "https://www.smiletiendaimp.com.ar/lentes-de-sol/tommy-hilfiger",
    variants: [
      { label: "Carey", inStock: true },
    ],
    featured: true,
  },
  {
    id: "th-5",
    slug: "tommy-hilfiger-round",
    name: "Tommy Hilfiger",
    subtitle: "Round · Carey / Verde",
    brand: "tommy",
    collection: "Redondos",
    price: 195000,
    images: ["/images/bg-tommy.jpg"],
    storeUrl: "https://www.smiletiendaimp.com.ar/lentes-de-sol/tommy-hilfiger",
    variants: [
      { label: "Carey / Verde", inStock: true },
    ],
    featured: true,
  },
];

// ─── PRADA ────────────────────────────────────────────────────────────────────

export const pradaProducts: Product[] = [
  {
    id: "prada-spr19w",
    slug: "prada-symbole-spr19w",
    name: "Prada Symbole",
    subtitle: "SPR19W",
    brand: "prada",
    collection: "Symbole",
    price: 408700,
    images: [
      `${CDN}/pra025-negro-2-f87b225d96837b968f17133605429693-1024-1024.webp`,
      `${CDN}/pra026-negro-azul-degrade-2-5b471c8ab3cd46223b17133605549660-1024-1024.webp`,
      `${CDN}/pra027-carey-2-a6858da7fbd2aff99917133605675087-1024-1024.webp`,
      `${CDN}/pra028-negro-amarillo-2-e68fcb9215c15bc66717133605778514-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/prada-symbole-spr19w`,
    variants: [
      { label: "Negro", inStock: false },
      { label: "Negro / Azul degradé", inStock: false },
      { label: "Carey", inStock: false },
      { label: "Negro / Amarillo", inStock: true },
    ],
    description: "La Prada Symbole SPR19W encarna el lujo contemporáneo de la maison italiana. Cristal mineral con protección UV400 y montura de acetato premium.",
    featured: true,
    badge: "Premium",
  },
  {
    id: "prada-spr17w",
    slug: "prada-symbole-spr17w",
    name: "Prada Symbole",
    subtitle: "SPR17W",
    brand: "prada",
    collection: "Symbole",
    price: 437300,
    images: [
      `${CDN}/pr001-negro-1-68f6646e0930cf37bc17133170792904-1024-1024.webp`,
      `${CDN}/pr003-rosa-1-cfa996c847e9340c5517133171362234-1024-1024.webp`,
      `${CDN}/pr004-blanco-2-627060dfb8a75e6b6317133171468262-1024-1024.webp`,
      `${CDN}/pr002-carey-2-ad7488fecac33f9db617133171001799-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/prada-symbole-spr17w`,
    variants: [
      { label: "Negro", inStock: true },
      { label: "Rosa", inStock: true },
      { label: "Blanco", inStock: true },
      { label: "Carey", inStock: true },
    ],
    description: "Lentes polarizadas Prada SPR17W — símbolo de elegancia sin concesiones. Certificados UV400 con montura de acetato de alta gama.",
    featured: true,
    badge: "Premium",
  },
];

// ─── CHRISTIAN DIOR ───────────────────────────────────────────────────────────

export const diorProducts: Product[] = [
  {
    id: "dior-cd027",
    slug: "christian-dior-cd027",
    name: "Christian Dior",
    subtitle: "CD027",
    brand: "christian-dior",
    collection: "CD",
    price: 408700,
    images: [
      `${CDN}/christian-dior6-73a68326855194c58d17555447888574-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/christian-dior-cd027`,
    variants: [{ label: "Unisex", inStock: true }],
    description: "La maison Christian Dior presenta su visión del eyewear de lujo. Montura de acetato con cristal mineral UV400 y el sello de identidad parisina.",
    featured: true,
    badge: "Premium",
  },
  {
    id: "dior-cd016",
    slug: "christian-dior-cd016",
    name: "Christian Dior",
    subtitle: "CD016",
    brand: "christian-dior",
    collection: "CD",
    price: 408700,
    images: [
      `${CDN}/christian-dior-5-e4e5225606f976282c17555446278628-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/christian-dior-cd016`,
    variants: [{ label: "Unisex", inStock: true }],
    description: "Diseño Dior que combina elegancia estructural con protección UV400. Acetato premium de línea clásica con espíritu contemporáneo.",
    featured: true,
    badge: "Premium",
  },
];

// ─── VERSACE ──────────────────────────────────────────────────────────────────

export const versaceProducts: Product[] = [
  {
    id: "versace-ve02264",
    slug: "versace-ve02264",
    name: "Versace",
    subtitle: "VE02264",
    brand: "versace",
    collection: "VE",
    price: 437300,
    images: [
      `${CDN}/versace5-46021a8623d41eb22317555459378482-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/versace-ve02264`,
    variants: [{ label: "Unisex · UV400", inStock: true }],
    description: "Versace VE02264 — audacia y presencia absoluta. Lentes de cristal mineral con montura unisex y protección UV400.",
    featured: true,
    badge: "Premium",
  },
  {
    id: "versace-ve4469",
    slug: "versace-ve4469",
    name: "Versace",
    subtitle: "VE4469",
    brand: "versace",
    collection: "VE",
    price: 437300,
    images: [
      `${CDN}/versace4-3439b5fdfe70029e6817555456342623-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/versace-ve4469`,
    variants: [{ label: "Acetato · UV400", inStock: true }],
    description: "Versace VE4469 en montura de acetato. La estética Medusa se traduce en un eyewear de carácter inconfundible.",
    featured: true,
    badge: "Premium",
  },
];

// ─── GUCCI ────────────────────────────────────────────────────────────────────

export const gucciProducts: Product[] = [
  {
    id: "gucci-gg1443s",
    slug: "gucci-gg1443s",
    name: "Gucci",
    subtitle: "GG1443S",
    brand: "gucci",
    collection: "GG",
    price: 408700,
    images: [
      `${CDN}/aded9519-72f8-403d-b86c-5bb589e1ec72-d5119835ef7cb481c417558905195023-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/gucci-gg1443s`,
    variants: [{ label: "Unisex · Crystal", inStock: true }],
    description: "Gucci GG1443S — icono de la casa florentina. Cristal mineral con montura premium. Incluye estuche y gamuza protectora.",
    featured: true,
    badge: "Premium",
  },
  {
    id: "gucci-gg1528s",
    slug: "gucci-gg1528s",
    name: "Gucci",
    subtitle: "GG1528S",
    brand: "gucci",
    collection: "GG",
    price: 408700,
    images: [
      `${CDN}/1ad361c0-d40b-407b-ba96-8dc52897707f-6d8603c4bd5c15762617558902168726-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/gucci-gg1528s`,
    variants: [{ label: "Unisex · Acetato", inStock: true }],
    description: "Gucci GG1528S en acetato de alta calidad. El monograma de la maison en una pieza de eyewear contemporánea.",
    featured: true,
    badge: "Premium",
  },
];

// ─── BALENCIAGA ───────────────────────────────────────────────────────────────

export const balenciagaProducts: Product[] = [
  {
    id: "balenciaga-ba001",
    slug: "balenciaga-ba001",
    name: "Balenciaga",
    subtitle: "BA001",
    brand: "balenciaga",
    collection: "BA",
    price: 408700,
    images: [
      `${CDN}/balenciaga5-d8926557be5e8a967717555486304146-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/balenciaga-ba001`,
    variants: [{ label: "Unisex · Crystal UV400", inStock: true }],
    description: "Balenciaga BA001 — maximalismo editorial hecho eyewear. Cristal mineral UV400 en montura unisex de acetato.",
    featured: true,
    badge: "Premium",
  },
  {
    id: "balenciaga-ba014",
    slug: "balenciaga-ba014",
    name: "Balenciaga",
    subtitle: "BA014",
    brand: "balenciaga",
    collection: "BA",
    price: 408700,
    images: [
      `${CDN}/balenciaga3-c449eb126c5d22e0a917555482397663-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/balenciaga-ba014`,
    variants: [{ label: "Unisex · Acetato", inStock: true }],
    description: "BA014 — la silhouette Balenciaga redefinida en un lente de sol unisex. Lentes de cristal mineral con protección UV400.",
    featured: true,
    badge: "Premium",
  },
];

// ─── LOUIS VUITTON ────────────────────────────────────────────────────────────

export const louisVuittonProducts: Product[] = [
  {
    id: "lv-lv1008",
    slug: "louis-vuitton-lv1008",
    name: "Louis Vuitton",
    subtitle: "LV1008",
    brand: "louis-vuitton",
    collection: "LV",
    price: 437300,
    images: [
      `${CDN}/louis-vuitton-6-689ae6add2aa4d415d17555498701592-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/louis-vuitton-lv1008`,
    variants: [{ label: "Unisex · Crystal UV400", inStock: true }],
    description: "Louis Vuitton LV1008 — el patrimonio de la maison parisina en un eyewear de distinción absoluta. Cristal mineral con protección UV400.",
    featured: true,
    badge: "Premium",
  },
  {
    id: "lv-lv1026",
    slug: "louis-vuitton-lv1026",
    name: "Louis Vuitton",
    subtitle: "LV1026",
    brand: "louis-vuitton",
    collection: "LV",
    price: 408700,
    images: [
      `${CDN}/louis-vuitton-5-408506aec387aede2e17555497313502-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/louis-vuitton-lv1026`,
    variants: [{ label: "Unisex · Acetato premium", inStock: true }],
    description: "LV1026 — montura de acetato premium de Louis Vuitton. El savoir-faire francés traducido en eyewear contemporáneo.",
    featured: true,
    badge: "Premium",
  },
];

// ─── SAINT LAURENT ────────────────────────────────────────────────────────────

export const saintLaurentProducts: Product[] = [
  {
    id: "sl-sl009",
    slug: "saint-laurent-sl009",
    name: "Saint Laurent",
    subtitle: "SL009",
    brand: "saint-laurent",
    collection: "SL",
    price: 408700,
    images: [
      `${CDN}/saint-6-5f77c0c0687609a53017558007128358-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/saint-laurent-sl009`,
    variants: [{ label: "Unisex · Crystal", inStock: true }],
    description: "Saint Laurent SL009 — la síntesis de elegancia parisina y actitud rock. Lentes de cristal mineral unisex con UV400.",
    featured: true,
    badge: "Premium",
  },
  {
    id: "sl-sl001",
    slug: "saint-laurent-sl001",
    name: "Saint Laurent",
    subtitle: "SL001",
    brand: "saint-laurent",
    collection: "SL",
    price: 408700,
    images: [
      `${CDN}/saint-5-d18639fc7531f6c72017558005924965-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/saint-laurent-sl001`,
    variants: [{ label: "Unisex · Crystal UV400", inStock: true }],
    description: "SL001 — elegancia y confort en una sola pieza. El diseño exclusivo Saint Laurent con protección UV400.",
    featured: true,
    badge: "Premium",
  },
];

// ─── FENDI ────────────────────────────────────────────────────────────────────

export const fendiProducts: Product[] = [
  {
    id: "fendi-fe016",
    slug: "fendi-fe016",
    name: "Fendi",
    subtitle: "FE016",
    brand: "fendi",
    collection: "FE",
    price: 408700,
    images: [
      `${CDN}/fendi4-da1a671bf3bbf35c3317558014734456-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/fendi-fe016`,
    variants: [{ label: "Unisex · Acetato", inStock: true }],
    description: "Fendi FE016 — eyewear que refleja el espíritu romano de la maison. Montura de acetato con cristal mineral UV400. Incluye estuche.",
    featured: true,
    badge: "Premium",
  },
  {
    id: "fendi-fe013",
    slug: "fendi-fe013",
    name: "Fendi",
    subtitle: "FE013",
    brand: "fendi",
    collection: "FE",
    price: 408700,
    images: [
      `${CDN}/fendi-3-6e24e54c7814b769d617558013308821-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/fendi-fe013`,
    variants: [{ label: "Unisex · Crystal UV400", inStock: true }],
    description: "FE013 — la doble F de Fendi en un lente de sol unisex de cristal mineral. Elegancia y protección en una sola pieza.",
    featured: true,
    badge: "Premium",
  },
];

// ─── CARTIER ──────────────────────────────────────────────────────────────────

export const cartierProducts: Product[] = [
  {
    id: "cartier-ca005",
    slug: "cartier-ca005",
    name: "Cartier",
    subtitle: "CA005",
    brand: "cartier",
    collection: "CA",
    price: 408700,
    images: [
      `${CDN}/cartier3-5ee9f236927a5c252217558022001834-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/cartier-ca005`,
    variants: [{ label: "Unisex · Crystal UV400", inStock: true }],
    description: "Cartier CA005 — elegancia y protección UV400 premium. La joyería óptica de la maison en su máxima expresión.",
    featured: true,
    badge: "Premium",
  },
];

// ─── DOLCE & GABBANA ──────────────────────────────────────────────────────────

export const dolceGabbanaProducts: Product[] = [
  {
    id: "dg-dg005",
    slug: "dolcegabbana-dg005",
    name: "Dolce&Gabbana",
    subtitle: "DG005",
    brand: "dolce-gabbana",
    collection: "DG",
    price: 408700,
    images: [
      `${CDN}/dolce3-1940328df5696fae8117558028205069-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/dolcegabbana-dg005`,
    variants: [{ label: "Unisex · Crystal", inStock: true }],
    description: "Dolce&Gabbana DG005 — el espíritu mediterráneo de la maison en un eyewear audaz y sofisticado. Cristal mineral UV400.",
    featured: true,
    badge: "Premium",
  },
  {
    id: "dg-dg004",
    slug: "dolcegabbana-dg004",
    name: "Dolce&Gabbana",
    subtitle: "DG004",
    brand: "dolce-gabbana",
    collection: "DG",
    price: 437300,
    images: [
      `${CDN}/dolce2-d2e595f86fd0ebb77217558026989104-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/dolcegabbana-dg004`,
    variants: [{ label: "Unisex · Acetato premium", inStock: true }],
    description: "DG004 — diseño de Dolce&Gabbana que combina estilo y protección. Montura de acetato con cristal mineral UV400.",
    featured: true,
    badge: "Premium",
  },
];

// ─── CELINE ───────────────────────────────────────────────────────────────────

export const celineProducts: Product[] = [
  {
    id: "celine-cl40194u",
    slug: "celine-paris-cl40194u",
    name: "Celine Paris",
    subtitle: "CL40194U",
    brand: "celine",
    collection: "CL",
    price: 408700,
    images: [
      `${CDN}/3098f49f-114c-4046-a420-84e84ae1e650-cb08dfd11b35ca6ee417558899702242-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/celine-paris-cl40194u`,
    variants: [{ label: "Unisex · Crystal UV400", inStock: true }],
    description: "Celine Paris CL40194U — minimalismo parisino en su máxima expresión. Montura de acetato con lentes de cristal mineral UV400.",
    featured: true,
    badge: "Premium",
  },
  {
    id: "celine-cl40282u",
    slug: "celine-paris-cl40282u",
    name: "Celine Paris",
    subtitle: "CL40282U",
    brand: "celine",
    collection: "CL",
    price: 408700,
    images: [
      `${CDN}/03e8e43d-34bf-47e9-bece-d3f23710d9fc-ae47a33a262362347e17558895772910-1024-1024.webp`,
    ],
    storeUrl: `${STORE}/celine-paris-cl40282u`,
    variants: [{ label: "Unisex · Acetato", inStock: true }],
    description: "CL40282U — el rigor estético de Celine Paris en un lente de sol contemporáneo. Acetato premium con cristal mineral y UV400.",
    featured: true,
    badge: "Premium",
  },
];

// ─── OMEGA × SWATCH ───────────────────────────────────────────────────────────

const OMEGA_STORE = "https://www.smiletiendaimp.com.ar/relojes/omega-x-swacht";

export const omegaSwatchProducts: Product[] = [
  {
    id: "omega-swatch-moon",
    slug: "moonswatch-mission-to-the-moon",
    name: "MoonSwatch",
    subtitle: "Mission to the Moon",
    brand: "omega-swatch",
    collection: "MoonSwatch",
    price: 320000,
    images: [`${CDN}/moonswatch-moon-1024-1024.webp`],
    storeUrl: OMEGA_STORE,
    variants: [{ label: "Bioceramic · Blanco", inStock: true }],
    description: "La colaboración histórica entre Omega y Swatch. Bioceramic de alta tecnología, Super-LumiNova y correa VELCRO. Inspirado en el Speedmaster Moonwatch.",
    featured: true,
    badge: "Collab Edition",
  },
  {
    id: "omega-swatch-mars",
    slug: "moonswatch-mission-to-mars",
    name: "MoonSwatch",
    subtitle: "Mission to Mars",
    brand: "omega-swatch",
    collection: "MoonSwatch",
    price: 320000,
    images: [`${CDN}/moonswatch-mars-1024-1024.webp`],
    storeUrl: OMEGA_STORE,
    variants: [{ label: "Bioceramic · Naranja", inStock: true }],
    description: "Mission to Mars — el MoonSwatch en naranja Marte. Bioceramic, cronógrafo, Super-LumiNova y correa VELCRO.",
    featured: true,
    badge: "Collab Edition",
  },
  {
    id: "omega-swatch-earth",
    slug: "moonswatch-mission-to-earth",
    name: "MoonSwatch",
    subtitle: "Mission to Earth",
    brand: "omega-swatch",
    collection: "MoonSwatch",
    price: 320000,
    images: [`${CDN}/moonswatch-earth-1024-1024.webp`],
    storeUrl: OMEGA_STORE,
    variants: [{ label: "Bioceramic · Azul", inStock: true }],
    featured: true,
    badge: "Collab Edition",
  },
  {
    id: "omega-swatch-saturn",
    slug: "moonswatch-mission-to-saturn",
    name: "MoonSwatch",
    subtitle: "Mission to Saturn",
    brand: "omega-swatch",
    collection: "MoonSwatch",
    price: 320000,
    images: [`${CDN}/moonswatch-saturn-1024-1024.webp`],
    storeUrl: OMEGA_STORE,
    variants: [{ label: "Bioceramic · Khaki", inStock: true }],
    featured: true,
    badge: "Collab Edition",
  },
  {
    id: "omega-swatch-jupiter",
    slug: "moonswatch-mission-to-jupiter",
    name: "MoonSwatch",
    subtitle: "Mission to Jupiter",
    brand: "omega-swatch",
    collection: "MoonSwatch",
    price: 320000,
    images: [`${CDN}/moonswatch-jupiter-1024-1024.webp`],
    storeUrl: OMEGA_STORE,
    variants: [{ label: "Bioceramic · Caramelo", inStock: true }],
    featured: true,
    badge: "Collab Edition",
  },
  {
    id: "omega-swatch-venus",
    slug: "moonswatch-mission-to-venus",
    name: "MoonSwatch",
    subtitle: "Mission to Venus",
    brand: "omega-swatch",
    collection: "MoonSwatch",
    price: 320000,
    images: [`${CDN}/moonswatch-venus-1024-1024.webp`],
    storeUrl: OMEGA_STORE,
    variants: [{ label: "Bioceramic · Crema", inStock: true }],
    featured: true,
    badge: "Collab Edition",
  },
];

// ─── ALL PRODUCTS ─────────────────────────────────────────────────────────────

export const premiumSunglassesProducts: Product[] = [
  ...pradaProducts,
  ...diorProducts,
  ...versaceProducts,
  ...gucciProducts,
  ...balenciagaProducts,
  ...louisVuittonProducts,
  ...saintLaurentProducts,
  ...fendiProducts,
  ...cartierProducts,
  ...dolceGabbanaProducts,
  ...celineProducts,
];

export const allProducts: Product[] = [
  ...raybanProducts,
  ...invictaProducts,
  ...tommyProducts,
  ...premiumSunglassesProducts,
  ...omegaSwatchProducts,
];

export function getProductBySlug(slug: string): Product | undefined {
  return allProducts.find((p) => p.slug === slug);
}

export function formatPrice(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(n);
}
