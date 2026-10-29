// Rules of the site search overlay (components/search/SearchOverlay.tsx),
// kept pure so node:test covers them: which products it features, when typing
// replaces them with results, keyboard highlight and the catalog link.
// Options are the listed products, plus one "Ver los N resultados" row after
// results; highlight indexes are -1 when nothing is highlighted.
import { normalizeSearchText, searchProducts } from "./product-search.mjs";

/** Characters typed (accents and extra spaces aside) before results replace the featured products. */
export const MIN_QUERY_LENGTH = 2;

/** Products the overlay lists: featured ones before typing, best matches after. */
export const RESULT_LIMIT = 6;

/** Query parameter of the homepage catalog search field. */
export const CATALOG_QUERY_PARAM = "q";

/** Id of the homepage catalog section (components/store/TiendaCatalog.tsx). */
export const CATALOG_ANCHOR = "catalogo";

/**
 * The products the overlay features before anything is typed, from what the
 * homepage highlights: its hero slides (`slides`) and its watch showcase
 * (`watches`), alternating one of each, a slide first. Only products of
 * `products` (the purchasable, published list) are kept, each once; when the
 * highlights give fewer than `count`, the rest of `products` tops them up in
 * catalog order. Returns the `products` entries.
 */
export function featuredSearchProducts(products, { slides = [], watches = [] } = {}, count = RESULT_LIMIT) {
  const listed = new Map(products.map((product) => [product.slug, product]));
  const picked = new Map();
  const add = (product) => {
    const entry = product && listed.get(product.slug);
    if (entry && picked.size < count) picked.set(entry.slug, entry);
  };
  for (let i = 0; i < Math.max(slides.length, watches.length); i++) {
    add(slides[i]);
    add(watches[i]);
  }
  products.forEach(add);
  return [...picked.values()];
}

/** Whether the query is long enough for results: two characters, so one letter does not list half the store. */
export const canSuggest = (query) => normalizeSearchText(query).length >= MIN_QUERY_LENGTH;

/**
 * What the overlay lists for `query`:
 * - `featured`: under two characters, the featured products;
 * - `loading`: the product list has not arrived yet (`products` is null);
 * - `empty`: nothing matches;
 * - `results`: the best `limit` matches, with `resultCount` matches in all.
 */
export function searchPanel(query, { featured, products, extraText, limit = RESULT_LIMIT }) {
  if (!canSuggest(query)) return { kind: "featured", items: featured.slice(0, limit), resultCount: 0 };
  if (!products) return { kind: "loading", items: [], resultCount: 0 };
  const ranked = searchProducts(products, query, { extraText });
  if (ranked.length === 0) return { kind: "empty", items: [], resultCount: 0 };
  return { kind: "results", items: ranked.slice(0, limit), resultCount: ranked.length };
}

/** The product rows, plus the "Ver los N resultados" row after results. */
export const optionCountFor = (panel) =>
  panel.kind === "results" ? panel.items.length + 1 : panel.items.length;

/** `active` while it still points at an option, else -1: the options change under a highlight. */
export const clampHighlight = (active, optionCount) => (active >= 0 && active < optionCount ? active : -1);

/**
 * The highlight after an arrow key, wrapping around: from nothing, down goes
 * to the first option and up to the last one. -1 when there are no options.
 */
export function moveHighlight(active, step, optionCount) {
  if (optionCount <= 0) return -1;
  if (clampHighlight(active, optionCount) === -1) return step > 0 ? 0 : optionCount - 1;
  return (active + step + optionCount) % optionCount;
}

/**
 * What Enter does: open the highlighted product, otherwise (nothing or the
 * results row highlighted) show the catalog filtered by the query. A blank
 * field does nothing.
 */
export function enterAction(query, highlighted, panel) {
  if (highlighted >= 0 && highlighted < panel.items.length) return { action: "product", index: highlighted };
  if (!String(query ?? "").trim()) return { action: "none" };
  return { action: "results" };
}

/** Text of the row that opens the filtered catalog. */
export const seeAllResultsLabel = (count) =>
  count === 1 ? "Ver el resultado en la tienda" : `Ver los ${count} resultados en la tienda`;

/** Count the overlay announces to screen readers. */
export const resultCountLabel = (count) => (count === 1 ? "1 resultado" : `${count} resultados`);

/** The homepage catalog filtered by `query`: "/?q=ray+ban#catalogo". */
export function catalogSearchHref(query) {
  const params = new URLSearchParams({ [CATALOG_QUERY_PARAM]: String(query ?? "").trim() });
  return `/?${params}#${CATALOG_ANCHOR}`;
}

/**
 * The catalog search field's text after the address changes: a new, non-empty
 * `?q=` fills it (a link from the overlay); otherwise it keeps what the
 * visitor typed, including when the field itself drops `?q=` from the address.
 */
export const searchFromAddress = (previousParam, param, search) =>
  param && param !== previousParam ? param : search;
