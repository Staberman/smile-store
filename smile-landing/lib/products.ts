const CDN = "https://acdn-us.mitiendanube.com/stores/003/759/046/products";
const STORE = "https://www.smiletiendaimp.com.ar/productos";

export type Product = {
  id: string;
  name: string;
  subtitle: string;
  brand: "ray-ban" | "invicta" | "tommy";
  collection: string; // filter key
  price: number;
  image: string;
  storeUrl: string;
  featured?: boolean;
  badge?: string; // e.g. "Ferrari Collection", "Polarizado"
};

// ─── RAY-BAN ─────────────────────────────────────────────────────────────────

export const raybanProducts: Product[] = [
  // FEATURED (carousel)
  {
    id: "rb-aviador-classic",
    name: "Aviador Classic",
    subtitle: "3025 · Dorado / Verde",
    brand: "ray-ban",
    collection: "Aviador",
    price: 182700,
    image: `${CDN}/aviador-classic-doradoverde-1-64204a86eac68f740b17121121526969-1024-1024.webp`,
    storeUrl: `${STORE}/aviador-classic-dorado-verde1`,
    featured: true,
  },
  {
    id: "rb-wayfarer",
    name: "Wayfarer",
    subtitle: "2140 · Negro / Verde",
    brand: "ray-ban",
    collection: "Wayfarer",
    price: 175900,
    image: `${CDN}/wayfarer-negroverde-1-2ce5f79bb2e258002817157492457980-1024-1024.webp`,
    storeUrl: `${STORE}/wayfarer-2140`,
    featured: true,
  },
  {
    id: "rb-clubmaster",
    name: "Clubmaster Classic",
    subtitle: "3016 · Negro-Dorado / Verde",
    brand: "ray-ban",
    collection: "Clubmaster",
    price: 182700,
    image: `${CDN}/clubmaster-classic-negro-doradoverde-1-8ee8cf5b015369ff3b17121488611694-1024-1024.webp`,
    storeUrl: `${STORE}/clubmaster-classic-3016`,
    featured: true,
  },
  {
    id: "rb-round-metal",
    name: "Round Metal Classic",
    subtitle: "3447 · Dorado / Verde",
    brand: "ray-ban",
    collection: "Round",
    price: 182700,
    image: `${CDN}/round-metal-doradoverde-2076586d783f532bb717113631167425-1024-1024.webp`,
    storeUrl: `${STORE}/round-metal-classic-3447`,
    featured: true,
  },
  {
    id: "rb-ferrari-wayfarer",
    name: "Wayfarer Liteforce",
    subtitle: "4195 · Scuderia Ferrari Collection",
    brand: "ray-ban",
    collection: "Ferrari Collection",
    price: 245500,
    image: `${CDN}/scuderia-ferrari-collection-wayfarer-liteforce-grisplateado-espejado-6efbcfbb43dc7c536d17156013893024-1024-1024.webp`,
    storeUrl: `${STORE}/wayfarer-liteforce-4195-scuderia-ferrari-collection`,
    featured: true,
    badge: "Ferrari Collection",
  },
  // GRID extras
  {
    id: "rb-erika",
    name: "Erika",
    subtitle: "4171 · Negro / Gris degradé",
    brand: "ray-ban",
    collection: "Otros",
    price: 179900,
    image: `${CDN}/erika-negrogris-degrade-1-50993267a30527c76417125018526848-1024-1024.webp`,
    storeUrl: `${STORE}/erika-4171`,
  },
  {
    id: "rb-hexagonal",
    name: "Hexagonal Classic",
    subtitle: "3548 · Dorado / Verde",
    brand: "ray-ban",
    collection: "Otros",
    price: 182700,
    image: `${CDN}/hexagonal-dorado-verde-3548-001-1-74e2c9508ebf01532017610789127331-1024-1024.webp`,
    storeUrl: `${STORE}/hexagonal-classic-3548`,
  },
  {
    id: "rb-justin-pol",
    name: "Justin Polarizado",
    subtitle: "4165 · Negro / Gris degradé",
    brand: "ray-ban",
    collection: "Otros",
    price: 236700,
    image: `${CDN}/justin-negrogris-degrade-polarizado-1-9745a2757f07ea5d1117157417400492-1024-1024.webp`,
    storeUrl: `${STORE}/justin-4165-polarizados`,
    badge: "Polarizado",
  },
  {
    id: "rb-mega-clubmaster",
    name: "Mega Clubmaster",
    subtitle: "0316S · Negro-Dorado / Verde",
    brand: "ray-ban",
    collection: "Clubmaster",
    price: 182700,
    image: `${CDN}/clubmaster-mega-negro-doradoverde-c75061612f9c89d31817125164502752-1024-1024.webp`,
    storeUrl: `${STORE}/mega-clubmaster-0316s`,
  },
  {
    id: "rb-aviador-pol",
    name: "Aviador Polarizado",
    subtitle: "3025 · Negro / Verde polarizado",
    brand: "ray-ban",
    collection: "Aviador",
    price: 215000,
    image: `${CDN}/aviador-classic-doradoverde-1-64204a86eac68f740b17121121526969-1024-1024.webp`,
    storeUrl: `${STORE}/aviador-polarizado-30251`,
    badge: "Polarizado",
  },
  {
    id: "rb-wayfarer-blaze",
    name: "Wayfarer Blaze",
    subtitle: "4440 · Espejado",
    brand: "ray-ban",
    collection: "Wayfarer",
    price: 215000,
    image: `${CDN}/wayfarer-negroverde-1-2ce5f79bb2e258002817157492457980-1024-1024.webp`,
    storeUrl: `${STORE}/wayfarer-blaze-4440`,
  },
  {
    id: "rb-ferrari-blue",
    name: "Wayfarer Liteforce Ferrari",
    subtitle: "4195 · Azul / Azul espejado",
    brand: "ray-ban",
    collection: "Ferrari Collection",
    price: 245500,
    image: `${CDN}/scuderia-ferrari-collection-wayfarer-liteforce-azul-azul-espejado-1-0504ba78c1d96a545017156014045934-1024-1024.webp`,
    storeUrl: `${STORE}/wayfarer-liteforce-4195-scuderia-ferrari-collection`,
    badge: "Ferrari Collection",
  },
];

// ─── INVICTA ──────────────────────────────────────────────────────────────────

export const invictaProducts: Product[] = [
  {
    id: "inv-prodiver-49277",
    name: "Pro Diver",
    subtitle: "49277 · Negro / Dorado",
    brand: "invicta",
    collection: "Pro Diver",
    price: 320000,
    image: `${CDN}/invicta-pro-diver-negro-dorado-1-1024-1024.webp`,
    storeUrl: "https://www.smiletiendaimp.com.ar/relojes/invicta",
    featured: true,
  },
  {
    id: "inv-prodiver-49274",
    name: "Pro Diver",
    subtitle: "49274 · Plateado / Azul",
    brand: "invicta",
    collection: "Pro Diver",
    price: 305000,
    image: `${CDN}/invicta-pro-diver-plateado-azul-1-1024-1024.webp`,
    storeUrl: "https://www.smiletiendaimp.com.ar/relojes/invicta",
    featured: true,
  },
  {
    id: "inv-prodiver-3",
    name: "Pro Diver",
    subtitle: "Automático · Dorado",
    brand: "invicta",
    collection: "Pro Diver",
    price: 380000,
    image: `${CDN}/invicta-pro-diver-dorado-1-1024-1024.webp`,
    storeUrl: "https://www.smiletiendaimp.com.ar/relojes/invicta",
    featured: true,
  },
  {
    id: "inv-prodiver-4",
    name: "Pro Diver",
    subtitle: "Cronógrafo · Negro",
    brand: "invicta",
    collection: "Cronógrafo",
    price: 420000,
    image: `${CDN}/invicta-cronografo-negro-1-1024-1024.webp`,
    storeUrl: "https://www.smiletiendaimp.com.ar/relojes/invicta",
    featured: true,
  },
  {
    id: "inv-prodiver-5",
    name: "Pro Diver",
    subtitle: "Limited · Rojo / Dorado",
    brand: "invicta",
    collection: "Pro Diver",
    price: 450000,
    image: `${CDN}/invicta-pro-diver-rojo-dorado-1-1024-1024.webp`,
    storeUrl: "https://www.smiletiendaimp.com.ar/relojes/invicta",
    featured: true,
    badge: "Limited Edition",
  },
];

// ─── TOMMY HILFIGER ───────────────────────────────────────────────────────────

export const tommyProducts: Product[] = [
  {
    id: "th-1",
    name: "Tommy Hilfiger",
    subtitle: "Classic · Carey / Marrón",
    brand: "tommy",
    collection: "Clásicos",
    price: 195000,
    image: `${CDN}/bg-tommy-1-1024-1024.webp`,
    storeUrl: "https://www.smiletiendaimp.com.ar/lentes-de-sol/tommy-hilfiger",
    featured: true,
  },
  {
    id: "th-2",
    name: "Tommy Hilfiger",
    subtitle: "Square · Negro / Gris",
    brand: "tommy",
    collection: "Cuadrados",
    price: 185000,
    image: `${CDN}/bg-tommy-2-1024-1024.webp`,
    storeUrl: "https://www.smiletiendaimp.com.ar/lentes-de-sol/tommy-hilfiger",
    featured: true,
  },
  {
    id: "th-3",
    name: "Tommy Hilfiger",
    subtitle: "Aviator · Dorado / Marrón",
    brand: "tommy",
    collection: "Aviadores",
    price: 210000,
    image: `${CDN}/bg-tommy-3-1024-1024.webp`,
    storeUrl: "https://www.smiletiendaimp.com.ar/lentes-de-sol/tommy-hilfiger",
    featured: true,
  },
  {
    id: "th-4",
    name: "Tommy Hilfiger",
    subtitle: "Rectangular · Carey",
    brand: "tommy",
    collection: "Rectangulares",
    price: 190000,
    image: `${CDN}/bg-tommy-4-1024-1024.webp`,
    storeUrl: "https://www.smiletiendaimp.com.ar/lentes-de-sol/tommy-hilfiger",
    featured: true,
  },
  {
    id: "th-5",
    name: "Tommy Hilfiger",
    subtitle: "Round · Carey / Verde",
    brand: "tommy",
    collection: "Redondos",
    price: 195000,
    image: `${CDN}/bg-tommy-5-1024-1024.webp`,
    storeUrl: "https://www.smiletiendaimp.com.ar/lentes-de-sol/tommy-hilfiger",
    featured: true,
  },
];

export const allProducts = [...raybanProducts, ...invictaProducts, ...tommyProducts];

export function formatPrice(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(n);
}
