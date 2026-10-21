// Pure formatting helpers. Keep this module free of catalog imports: client
// components import it, and anything it pulls in ships to the browser.

export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return "Consultar";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}
