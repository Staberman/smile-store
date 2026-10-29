function parseMoney(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function parseManagedStock(variant) {
  if (variant.stock_management === false) return 1;

  if (Number.isFinite(Number(variant.stock))) {
    return Math.max(0, Math.trunc(Number(variant.stock)));
  }

  if (Array.isArray(variant.inventory_levels)) {
    return variant.inventory_levels.reduce((total, level) => {
      const stock = Number(level?.stock);
      return total + (Number.isFinite(stock) ? Math.max(0, Math.trunc(stock)) : 0);
    }, 0);
  }

  return 0;
}

function normalizeApiVariant(variant, published) {
  const price = parseMoney(variant.price);
  const rawPromotionalPrice = parseMoney(variant.promotional_price);
  const promotionalPrice =
    rawPromotionalPrice !== null &&
    rawPromotionalPrice > 0 &&
    (price === null || rawPromotionalPrice < price)
      ? rawPromotionalPrice
      : null;
  const stock = published ? parseManagedStock(variant) : 0;

  return {
    id: Number(variant.id),
    price,
    promotionalPrice,
    stock,
    available: published && price !== null && stock > 0,
  };
}

function disableVariant(variant) {
  return {
    ...variant,
    stock: 0,
    available: false,
  };
}

// Product-level published state, stored only while unpublished: the site drops
// products with `published: false` (lib/catalog-published.mjs), and the field
// goes away once Tiendanube publishes the product again. Published products
// carry no field, so a sync only rewrites the ones whose state changed.
function withPublishedState(product, published) {
  const { published: _previous, ...rest } = product;
  return published ? rest : { ...rest, published: false };
}

function aggregateProduct(product, variants) {
  const prices = variants
    .map((variant) => variant.price)
    .filter((price) => price !== null);
  const promotionalPrices = variants
    .map((variant) => variant.promotionalPrice)
    .filter((price) => price !== null);

  return {
    ...product,
    price: prices.length > 0 ? Math.min(...prices) : product.price,
    promotionalPrice:
      promotionalPrices.length > 0 ? Math.min(...promotionalPrices) : null,
    stock: variants.reduce((total, variant) => total + variant.stock, 0),
    variants,
  };
}

export function mergeCatalogWithTiendanube(catalog, apiProducts) {
  if (!Array.isArray(catalog) || !Array.isArray(apiProducts)) {
    throw new Error("El catálogo y la respuesta de Tiendanube deben ser listas.");
  }

  const knownProductIds = new Set(
    catalog
      .map((product) => Number(product.tiendanubeProductId))
      .filter(Number.isFinite),
  );
  const apiProductsById = new Map();

  for (const product of apiProducts) {
    const productId = Number(product?.id);
    if (!Number.isFinite(productId)) {
      throw new Error("Tiendanube devolvió un producto sin ID válido.");
    }
    if (apiProductsById.has(productId)) {
      throw new Error(`Tiendanube devolvió el producto duplicado ${productId}.`);
    }
    apiProductsById.set(productId, product);
  }

  const matchedProducts = [...knownProductIds].filter((id) =>
    apiProductsById.has(id),
  ).length;
  if (
    knownProductIds.size === 0 ||
    matchedProducts / knownProductIds.size < 0.5
  ) {
    throw new Error(
      `Respuesta incompleta de Tiendanube: ${matchedProducts}/${knownProductIds.size} productos conocidos.`,
    );
  }

  let changedProducts = 0;
  let missingProducts = 0;
  let missingVariants = 0;
  let unpublishedProducts = 0;

  const mergedCatalog = catalog.map((product) => {
    const apiProduct = apiProductsById.get(Number(product.tiendanubeProductId));
    let variants;

    if (!apiProduct) {
      missingProducts += 1;
      variants = product.variants.map(disableVariant);
    } else {
      const published = apiProduct.published !== false;
      const apiVariantsById = new Map(
        (apiProduct.variants ?? []).map((variant) => [
          Number(variant.id),
          normalizeApiVariant(variant, published),
        ]),
      );

      variants = product.variants.map((variant) => {
        const apiVariant = apiVariantsById.get(Number(variant.id));
        if (!apiVariant) {
          missingVariants += 1;
          return disableVariant(variant);
        }

        return {
          ...variant,
          price: apiVariant.price,
          promotionalPrice: apiVariant.promotionalPrice,
          stock: apiVariant.stock,
          available: apiVariant.available,
        };
      });
    }

    const mergedProduct = aggregateProduct(
      // A product missing from the response keeps its last published state:
      // a short response must not unpublish it.
      apiProduct
        ? withPublishedState(product, apiProduct.published !== false)
        : product,
      variants,
    );
    if (JSON.stringify(mergedProduct) !== JSON.stringify(product)) {
      changedProducts += 1;
    }
    if (mergedProduct.published === false) unpublishedProducts += 1;
    return mergedProduct;
  });

  return {
    catalog: mergedCatalog,
    summary: {
      knownProducts: knownProductIds.size,
      apiProducts: apiProductsById.size,
      matchedProducts,
      changedProducts,
      missingProducts,
      missingVariants,
      unpublishedProducts,
    },
  };
}

export function parseNextPage(linkHeader) {
  if (!linkHeader) return null;

  for (const part of linkHeader.split(",")) {
    const match = part.match(/<([^>]+)>\s*;\s*rel=["']?next["']?/i);
    if (match) return match[1];
  }

  return null;
}
