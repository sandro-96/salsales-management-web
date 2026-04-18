import { PAYMENT_METHODS } from "./posConstants";

export function getPaymentMethodLabel(value) {
  if (!value) return null;
  if (value === "Ship COD") return "Ship COD";
  return PAYMENT_METHODS.find((p) => p.value === value)?.label || value;
}
