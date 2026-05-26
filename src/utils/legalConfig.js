function envFlag(key) {
  const value = import.meta.env?.[key];
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return null;
}

export function shouldShowPublicLegalDocs() {
  const configured = envFlag("VITE_PUBLIC_LEGAL_DOCS");
  if (configured !== null) return configured;
  return !import.meta.env.PROD;
}
