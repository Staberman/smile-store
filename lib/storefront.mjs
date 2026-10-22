import storeTerms from "../data/store-terms.json" with { type: "json" };

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function productText(product) {
  return normalize(
    [product.name, product.brand, ...(product.categories ?? []), ...(product.tags ?? [])].join(" "),
  );
}

export function getAvailableVariants(product) {
  return (product.variants ?? []).filter(
    (variant) => {
      const price = variant.promotionalPrice ?? variant.price;
      return (
        variant.id !== null &&
        variant.available === true &&
        Number(variant.stock) > 0 &&
        price !== null &&
        price !== undefined &&
        Number.isFinite(Number(price))
      );
    },
  );
}

// Truthful stock signal: sum the real `stock` of the purchasable variants only.
// Never invents numbers — it only adds up what getAvailableVariants already
// vetted (available, in-stock, priced).
export function availableStock(product) {
  return getAvailableVariants(product).reduce(
    (total, variant) => total + Number(variant.stock ?? 0),
    0,
  );
}

// Subtle low-stock urgency label, derived only from real stock:
//   <= 0 -> null (out of stock, handled elsewhere)
//   === 1 -> "Última unidad"
//   <= 3 -> "Pocas unidades"
//   otherwise -> null (no badge)
export function stockUrgencyLabel(product) {
  const total = availableStock(product);
  if (total <= 0) return null;
  if (total === 1) return "Última unidad";
  if (total <= 3) return "Pocas unidades";
  return null;
}

export function getDisplayPrice(product, variant = null) {
  return (
    variant?.promotionalPrice ??
    variant?.price ??
    product.promotionalPrice ??
    product.price ??
    null
  );
}

// Store-wide payment and shipping benefits. Prices, cards and copy derive from
// these. Synced hourly from the Tiendanube storefront by
// scripts/tiendanube/sync-store-terms.mjs, so they follow the admin settings.
export const TRANSFER_DISCOUNT_PERCENT = storeTerms.transferDiscountPercent;
export const INTEREST_FREE_INSTALLMENTS = storeTerms.interestFreeInstallments;
// Order total (ARS) above which Tiendanube's checkout ships for free; 0 means
// every order ships free.
export const FREE_SHIPPING_MINIMUM_ARS = storeTerms.freeShippingMinimumArs;

export function getTransferPrice(price) {
  return price === null || price === undefined
    ? null
    : Math.round(price * (1 - TRANSFER_DISCOUNT_PERCENT / 100));
}

export function getInstallmentPrice(price) {
  return price === null || price === undefined
    ? null
    : Math.round(price / INTEREST_FREE_INSTALLMENTS);
}

export function isOffer(product) {
  return (
    Number.isFinite(Number(product.price)) &&
    Number.isFinite(Number(product.promotionalPrice)) &&
    Number(product.promotionalPrice) > 0 &&
    Number(product.promotionalPrice) < Number(product.price)
  );
}

export function isWatch(product) {
  return normalize(product.categories?.[0]) === "relojes";
}

function comparablePrice(product) {
  const value = product.promotionalPrice ?? product.price;
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

// Cross-category pairing for "Completá el look": given the current product,
// return purchasable products FROM THE OTHER category (watch -> sunglasses,
// sunglasses -> watch). Deterministic: closest comparable price first, then
// name. `products` must be the purchasable set (allProducts), never the
// out-of-stock set. Returns up to `limit` items.
export function getComplementaryProducts(product, products, limit = 4) {
  const wantWatches = !isWatch(product);
  const basePrice = comparablePrice(product);

  return (products ?? [])
    .filter(
      (candidate) =>
        candidate.id !== product.id && isWatch(candidate) === wantWatches,
    )
    .map((candidate) => ({ product: candidate, price: comparablePrice(candidate) }))
    .sort((a, b) => {
      if (basePrice !== null) {
        if (a.price !== null && b.price !== null) {
          const distance =
            Math.abs(a.price - basePrice) - Math.abs(b.price - basePrice);
          if (distance !== 0) return distance;
        } else if (a.price === null && b.price !== null) {
          return 1;
        } else if (a.price !== null && b.price === null) {
          return -1;
        }
      }
      return a.product.name.localeCompare(b.product.name);
    })
    .slice(0, limit)
    .map((entry) => entry.product);
}

/** Image a carousel slide shows: the product image, else the first variant image. */
export function carouselImage(product) {
  return product.image ?? product.variants.find((variant) => variant.image)?.image ?? null;
}

function hasStockedVariant(product) {
  return product.variants.some((variant) => variant.available && variant.stock > 0);
}

// Carousel slides for a list of products: the first ones with stock and an
// image, in list order, topped up with the rest when fewer qualify.
export function carouselSlides(products, limit = 5) {
  const imageProducts = products.filter((product) => Boolean(carouselImage(product)));
  const preferred = imageProducts.filter(hasStockedVariant);
  const source = preferred.length > 0 ? preferred : imageProducts.length > 0 ? imageProducts : products;
  const slides = [];
  const seen = new Set();
  const add = (candidates) => {
    for (const product of candidates) {
      if (slides.length >= limit) break;
      if (seen.has(product.slug)) continue;
      slides.push(product);
      seen.add(product.slug);
    }
  };

  add(source);
  if (preferred.length > 0) add(products);
  if (imageProducts.length > 0) add(imageProducts);
  return slides;
}

export function filterStorefrontProducts(products, view) {
  switch (view) {
    case "lentes":
      return products.filter((product) => !isWatch(product));
    case "relojes":
      return products.filter(isWatch);
    case "ray-ban":
      return products.filter((product) =>
        ["ray ban", "rayban"].includes(normalize(product.brand)),
      );
    case "ferrari":
      return products.filter((product) => productText(product).includes("ferrari"));
    case "premium":
      return products.filter((product) =>
        (product.categories ?? []).some(
          (category) => normalize(category) === "marcas premium",
        ),
      );
    case "offers":
      return products.filter(isOffer);
    default:
      return products;
  }
}
