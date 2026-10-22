// Peso amounts as the site shows them: "$ 182.700", es-AR grouping, whole
// pesos. Plain JavaScript so plain-JS copy (lib/store-copy.mjs), the sync
// scripts and node:test format prices the same way; lib/format.ts re-exports
// it for the app. No imports: client components pull this in.
const PRICE_FORMAT = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatPrice(value) {
  if (value === null || value === undefined) return "Consultar";
  return PRICE_FORMAT.format(value);
}
