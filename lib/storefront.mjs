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

export function getDisplayPrice(product, variant = null) {
  return (
    variant?.promotionalPrice ??
    variant?.price ??
    product.promotionalPrice ??
    product.price ??
    null
  );
}

export function getTransferPrice(price) {
  return price === null || price === undefined ? null : Math.round(price * 0.8);
}

export function getInstallmentPrice(price) {
  return price === null || price === undefined ? null : Math.round(price / 6);
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
