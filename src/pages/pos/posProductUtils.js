export function hasBranchVariants(product) {
  return (
    Array.isArray(product?.branchVariants) && product.branchVariants.length > 0
  );
}

export function variantCatalogName(product, variantId) {
  const v = (product?.variants || []).find((x) => x.variantId === variantId);
  return v?.name || variantId || "";
}
