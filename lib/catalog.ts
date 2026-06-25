import catalog from "@/data/tiendanube-catalog.json";

export type CatalogVariant = {
  id: number | null;
  sku: string;
  options: string[];
  price: number | null;
  promotionalPrice: number | null;
  stock: number;
  available: boolean;
  image: string | null;
};

export type CatalogProduct = {
  id: string;
  tiendanubeProductId: number | null;
  slug: string;
  name: string;
  brand: string;
  categories: string[];
  tags: string[];
  descriptionHtml: string;
  descriptionText: string;
  price: number | null;
  promotionalPrice: number | null;
  stock: number;
  images: string[];
  seoTitle: string;
  seoDescription: string;
  sourceUrl: string;
  variants: CatalogVariant[];
  importWarnings: string[];
};

export type CategoryNode = {
  label: string;
  slug: string;
  path: string[];
  count: number;
  children: CategoryNode[];
};

export const allProducts = catalog as CatalogProduct[];

export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return "Consultar";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getProductBySlug(slug: string): CatalogProduct | undefined {
  return allProducts.find((product) => product.slug === slug);
}

export function slugifyCategory(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getCategoryTree(): CategoryNode[] {
  const root: CategoryNode[] = [];

  for (const product of allProducts) {
    let level = root;
    const path: string[] = [];

    for (const label of product.categories) {
      path.push(label);
      const slug = slugifyCategory(label);
      let node = level.find((item) => item.label === label);
      if (!node) {
        node = { label, slug, path: [...path], count: 0, children: [] };
        level.push(node);
      }
      node.count += 1;
      level = node.children;
    }
  }

  return root;
}
