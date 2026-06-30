const WINDOW_DAYS = 90;

export function buildSalesRanking(orders, now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - WINDOW_DAYS);
  const totals = new Map();

  for (const order of orders) {
    if (order?.status === "cancelled") continue;
    const createdAt = new Date(order?.created_at ?? 0);
    if (!Number.isFinite(createdAt.getTime()) || createdAt < cutoff) continue;

    for (const product of order.products ?? []) {
      const productId = Number(product?.product_id);
      const quantity = Number(product?.quantity);
      if (!Number.isInteger(productId) || productId <= 0 || quantity <= 0) continue;
      totals.set(productId, (totals.get(productId) ?? 0) + quantity);
    }
  }

  return [...totals.entries()]
    .map(([productId, units]) => ({ productId, units }))
    .sort((a, b) => b.units - a.units || a.productId - b.productId);
}

