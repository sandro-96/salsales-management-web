export function buildDraftOrderForInvoice({
  cart,
  subtotal,
  taxPreview,
  pointsToRedeem,
  note,
  paymentMethod,
}) {
  const pointsDiscount = pointsToRedeem * 1000;
  const baseAfterPoints = Math.max(0, subtotal - pointsDiscount);
  const items = cart.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    quantity: item.quantity,
    price: item.hasDiscount ? item.originalPrice : item.price,
    priceAfterDiscount: item.price,
    sellByWeight: !!item.sellByWeight,
    weight: item.sellByWeight ? (item.weight ?? null) : null,
    weightUnit: item.sellByWeight ? (item.weightUnit ?? null) : null,
  }));
  return {
    items,
    totalPrice: baseAfterPoints,
    totalAmount: taxPreview?.grandTotal ?? baseAfterPoints,
    taxSnapshot: taxPreview,
    note: note || null,
    paid: false,
    paymentMethod,
    paymentTime: null,
    pointsRedeemed: pointsToRedeem > 0 ? pointsToRedeem : 0,
    pointsDiscount: pointsToRedeem > 0 ? pointsDiscount : 0,
  };
}
