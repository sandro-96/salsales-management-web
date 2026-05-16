import { Banknote, CreditCard, ArrowRightLeft, Truck } from "lucide-react";

export function getPosPaymentMethods(t) {
  return [
    { value: "Cash", label: t("pages.pos.payment.cash"), icon: Banknote },
    { value: "Card", label: t("pages.pos.payment.card"), icon: CreditCard },
    {
      value: "Transfer",
      label: t("pages.pos.payment.transfer"),
      icon: ArrowRightLeft,
    },
    { value: "ShipCOD", label: t("pages.pos.payment.shipCod"), icon: Truck },
  ];
}

export function getPaymentMethodLabel(t, value) {
  if (!value) return null;
  if (value === "Ship COD") {
    return t("pages.pos.payment.shipCod");
  }
  return (
    getPosPaymentMethods(t).find((p) => p.value === value)?.label || value
  );
}

export function posNumberLocale(language) {
  return language?.startsWith("en") ? "en-US" : "vi-VN";
}
