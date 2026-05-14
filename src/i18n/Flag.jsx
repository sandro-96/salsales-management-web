import { cn } from "@/lib/utils";

function FlagVN({ className, ...props }) {
  return (
    <svg
      viewBox="0 0 30 20"
      className={className}
      role="img"
      aria-label="Cờ Việt Nam"
      {...props}
    >
      <rect width="30" height="20" fill="#DA251D" />
      <polygon
        fill="#FFFF00"
        points="15,5 16.123,8.455 19.755,8.455 16.817,10.59 17.939,14.045 15,11.91 12.061,14.045 13.183,10.59 10.245,8.455 13.877,8.455"
      />
    </svg>
  );
}

function FlagGB({ className, ...props }) {
  return (
    <svg
      viewBox="0 0 60 30"
      className={className}
      role="img"
      aria-label="UK flag"
      {...props}
    >
      <clipPath id="flag-gb-clip">
        <rect width="60" height="30" />
      </clipPath>
      <clipPath id="flag-gb-clip-diag">
        <path d="M30,15 L60,30 V30 H60 z M30,15 V30 H0 L30,15 z M30,15 L0,0 H0 V0 z M30,15 V0 H60 L30,15 z" />
      </clipPath>
      <g clipPath="url(#flag-gb-clip)">
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
        <path
          d="M0,0 L60,30 M60,0 L0,30"
          stroke="#C8102E"
          strokeWidth="4"
          clipPath="url(#flag-gb-clip-diag)"
        />
        <path d="M30,0 V30 M0,15 H60" stroke="#FFFFFF" strokeWidth="10" />
        <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

const FLAGS = {
  vi: FlagVN,
  en: FlagGB,
};

export default function Flag({ code, className, size = 18, ...props }) {
  const Component = FLAGS[code];
  if (!Component) return null;
  return (
    <Component
      style={{ width: size, height: "auto" }}
      className={cn(
        "inline-block shrink-0 rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.08)]",
        className,
      )}
      {...props}
    />
  );
}
