import {
  Banknote,
  CreditCard,
  ArrowRightLeft,
  Truck,
} from "lucide-react";

export const PAYMENT_METHODS = [
  { value: "Cash", label: "Tiền mặt", icon: Banknote },
  { value: "Card", label: "Thẻ", icon: CreditCard },
  { value: "Transfer", label: "Chuyển khoản", icon: ArrowRightLeft },
  { value: "ShipCOD", label: "Ship COD", icon: Truck },
];

export const ALL_CATEGORY = "__ALL__";
