// COD fee actually charged on an order. Orders don't store it separately, so it's
// whatever the total holds beyond subtotal + shipping - discount (discount already
// includes loyalty points). Orders placed before the fee was dropped (Oct 2026) come
// out as ₹50, newer ones as ₹0 — so old invoices and shipments stay correct.
export function orderCodCharge(order: {
  paymentMethod: string;
  subtotal: number;
  shipping?: number | null;
  discount?: number | null;
  total: number;
}): number {
  if (order.paymentMethod !== 'COD') return 0;
  const extra = order.total - order.subtotal - (order.shipping ?? 0) + (order.discount ?? 0);
  return Math.max(0, Math.round(extra));
}
