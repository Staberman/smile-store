import catalog from "@/data/tiendanube-catalog.json";
import salesRankingData from "@/data/tiendanube-sales-ranking.json";

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

const importedProducts = catalog as CatalogProduct[];

export function hasPurchasableStock(product: CatalogProduct): boolean {
  return product.variants.some(
    (variant) =>
      product.tiendanubeProductId !== null &&
      variant.id !== null &&
      variant.available &&
      variant.stock > 0,
  );
}

export function isPurchasable(product: CatalogProduct): boolean {
  return hasPurchasableStock(product);
}

// Full set: every catalog product, including out-of-stock ones. The import step
// already excludes anything hidden from the store ("Mostrar en tienda" != "SI"),
// so out-of-stock products here stay listable-by-URL and indexable.
export const allProductsIncludingOutOfStock = importedProducts;

// Purchasable-only set used by every listing/grid, brand and collection page.
export const allProducts = importedProducts.filter(hasPurchasableStock);

// Listed by URL but not purchasable: collection hubs link them in a separate
// "Sin stock por ahora" section so their pages are reachable by crawlers.
export const outOfStockProducts = importedProducts.filter(
  (product) => !hasPurchasableStock(product),
);

const salesRanking = (
  salesRankingData as { ranking: Array<{ productId: number; units: number }> }
).ranking;

// Purchasable products present in the sales ranking, best sellers first.
export function getBestSellers(): CatalogProduct[] {
  const unitsByProductId = new Map(
    salesRanking.map((item) => [String(item.productId), item.units]),
  );
  return allProducts
    .filter((product) => unitsByProductId.has(String(product.tiendanubeProductId)))
    .sort(
      (a, b) =>
        (unitsByProductId.get(String(b.tiendanubeProductId)) ?? 0) -
        (unitsByProductId.get(String(a.tiendanubeProductId)) ?? 0),
    );
}

export function getProductBySlug(slug: string): CatalogProduct | undefined {
  return allProductsIncludingOutOfStock.find((product) => product.slug === slug);
}

function getComparablePrice(product: CatalogProduct): number | null {
  return product.promotionalPrice ?? product.price;
}

function normalizeSimilarityToken(value: string): string {
  return slugifyCategory(value.trim());
}

function countOverlap(source: string[], target: string[]): number {
  const sourceTokens = new Set(
    source.map(normalizeSimilarityToken).filter(Boolean),
  );
  return target.reduce((count, item) => {
    const token = normalizeSimilarityToken(item);
    return token && sourceTokens.has(token) ? count + 1 : count;
  }, 0);
}

function getRecommendationScore(
  product: CatalogProduct,
  candidate: CatalogProduct,
): number {
  const productTopCategory = product.categories[0];
  const candidateTopCategory = candidate.categories[0];
  const categoryOverlap = countOverlap(product.categories, candidate.categories);
  const tagOverlap = countOverlap(product.tags, candidate.tags);
  const productPrice = getComparablePrice(product);
  const candidatePrice = getComparablePrice(candidate);
  let score = 0;

  if (productTopCategory && productTopCategory === candidateTopCategory) score += 100;
  if (product.brand && product.brand === candidate.brand) score += 48;
  score += categoryOverlap * 22;
  score += tagOverlap * 14;
  if (candidate.stock > 0) score += 16;

  if (productPrice !== null && candidatePrice !== null) {
    const higherPrice = Math.max(productPrice, candidatePrice);
    if (higherPrice > 0) {
      const priceDistance = Math.abs(productPrice - candidatePrice) / higherPrice;
      score += Math.max(0, 36 - priceDistance * 36);
    }
  }

  return score;
}

export function getRecommendedProducts(
  product: CatalogProduct,
  limit = 4,
): CatalogProduct[] {
  const productPrice = getComparablePrice(product);

  return allProducts
    .filter((candidate) => candidate.id !== product.id)
    .map((candidate) => ({
      product: candidate,
      score: getRecommendationScore(product, candidate),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      const aPrice = getComparablePrice(a.product);
      const bPrice = getComparablePrice(b.product);
      if (productPrice !== null && aPrice !== null && bPrice !== null) {
        return (
          Math.abs(productPrice - aPrice) - Math.abs(productPrice - bPrice)
        );
      }

      return a.product.name.localeCompare(b.product.name);
    })
    .slice(0, limit)
    .map(({ product: recommendedProduct }) => recommendedProduct);
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
