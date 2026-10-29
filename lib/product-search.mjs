// Product search shared by the catalog grids (components/brand/ProductGrid.tsx)
// and the site search overlay (components/search/SearchOverlay.tsx): grids
// filter with `matchesSearch` and the overlay ranks with `searchProducts`, so
// both always find the same products. Plain JavaScript so node:test checks the
// same matcher the site runs. No imports: client components pull this in.

/** Combining marks NFD splits off accented letters ("á" -> "a" + U+0301, "ñ" -> "n" + U+0303). */
const DIACRITICS = /[̀-ͯ]/g;

/**
 * Text as the search compares it: lowercase, without accents, with single
 * spaces, trimmed. "  Reloj  DAMA " -> "reloj dama"; "Montaña" -> "montana".
 */
export function normalizeSearchText(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** The words of a query, normalized: "Ray  BAN" -> ["ray", "ban"]. */
export function searchTokens(query) {
  const normalized = normalizeSearchText(query);
  return normalized ? normalized.split(" ") : [];
}

/**
 * A product's text as the search compares it: its name and brand on their own
 * (they rank matches) and everything it is found by. Words never span two
 * fields: they are joined with spaces and a query word has none.
 */
function searchFields(product, extraText) {
  const name = normalizeSearchText(product.name);
  const brand = normalizeSearchText(product.brand);
  const all = normalizeSearchText(
    [product.name, product.brand, ...(product.categories ?? []), extraText?.(product) ?? ""].join(" "),
  );
  return { name, brand, all };
}

const containsAll = (text, tokens) => tokens.every((token) => text.includes(token));

/**
 * Whether a product is a result for `query`: every word of the query appears
 * in its name, brand, categories or `extraText` (the grid's collection label
 * and the lazily loaded search index: tags, description, SEO copy), ignoring
 * accents and case. An empty query matches every product, so a grid shows its
 * whole list.
 */
export function matchesSearch(product, query, { extraText } = {}) {
  const tokens = searchTokens(query);
  return tokens.length === 0 || containsAll(searchFields(product, extraText).all, tokens);
}

/**
 * Rank of a matching product, best first: 0 its name starts with the query,
 * 1 a word of its name starts with the first word of the query, 2 its name
 * contains every word, 3 its name and brand do, 4 it needs its categories or
 * extra text.
 */
function rankOf({ name, brand }, query, tokens) {
  if (containsAll(name, tokens)) {
    if (name.startsWith(query)) return 0;
    if (name.split(" ").some((word) => word.startsWith(tokens[0]))) return 1;
    return 2;
  }
  return containsAll(`${name} ${brand}`, tokens) ? 3 : 4;
}

/**
 * The products `matchesSearch` accepts for `query`, best match first (see
 * `rankOf`), products with the same rank in their input order, at most
 * `limit`. An empty or blank query returns none. Without a limit the length
 * is the number of products a grid shows for the query, so one call gives
 * the suggestions and the count.
 */
export function searchProducts(products, query, { limit = Infinity, extraText } = {}) {
  const tokens = searchTokens(query);
  if (tokens.length === 0 || !(limit > 0)) return [];
  const normalized = tokens.join(" ");
  return products
    .map((product, index) => ({ product, index, fields: searchFields(product, extraText) }))
    .filter(({ fields }) => containsAll(fields.all, tokens))
    .map((entry) => ({ ...entry, rank: rankOf(entry.fields, normalized, tokens) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .slice(0, limit)
    .map(({ product }) => product);
}
