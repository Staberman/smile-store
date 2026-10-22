// Pure formatting helpers. Keep this module free of catalog imports: client
// components import it, and anything it pulls in ships to the browser.

// Implemented in plain JavaScript so lib/store-copy.mjs and the node:test
// suites share it.
export { formatPrice } from "@/lib/price-format.mjs";
