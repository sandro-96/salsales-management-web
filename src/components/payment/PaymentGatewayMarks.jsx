import { cn } from "@/lib/utils";

/** Gợi nhớ thương hiệu VNPay — chỉ dùng làm icon chọn phương thức trên UI. */
export function VnPayMark({ className, ...props }) {
  return (
    <svg
      viewBox="0 0 88 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "h-6 w-auto max-w-full shrink md:h-7",
        className,
      )}
      aria-hidden
      {...props}
    >
      <title>VNPay</title>
      <rect width="88" height="28" rx="6" fill="#0E4499" />
      <text
        x="44"
        y="19"
        textAnchor="middle"
        fill="#fff"
        fontSize="12"
        fontWeight="700"
        fontFamily="system-ui, Segoe UI, sans-serif"
      >
        VNPay
      </text>
    </svg>
  );
}

/** Gợi nhớ thương hiệu MoMo — chỉ dùng làm icon chọn phương thức trên UI. */
export function MomoMark({ className, ...props }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-9 w-9 shrink-0", className)}
      aria-hidden
      {...props}
    >
      <title>MoMo</title>
      <circle cx="20" cy="20" r="20" fill="#A50064" />
      <path
        fill="#fff"
        d="M11 14.5h18v2H11v-2Zm0 4.5h11.5c2 0 3.5 1.2 3.5 2.9 0 1.8-1.5 3-3.8 3H16v2.6h-2.5v-8.5Zm2.5 2v4h5.8c1.3 0 2-.5 2-1.4 0-.9-.7-1.4-2-1.4h-5.8Z"
      />
    </svg>
  );
}
