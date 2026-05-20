import { useTranslation } from "react-i18next";
import {
  Coffee,
  CupSoda,
  Pill,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

const ITEMS = [
  { id: "cafe", icon: Coffee },
  { id: "restaurant", icon: UtensilsCrossed },
  { id: "bubbleTea", icon: CupSoda },
  { id: "grocery", icon: ShoppingBag },
  { id: "pharmacy", icon: Pill },
  { id: "boutique", icon: Sparkles },
];

export default function SocialProofStrip() {
  const { t } = useTranslation();
  return (
    <section className="border-y bg-muted/20 py-8" aria-label="Social proof">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="mb-5 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t("pages.landing.socialProof.title")}
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-medium text-foreground/80 shadow-sm transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <Icon
                  className="h-3.5 w-3.5 text-muted-foreground"
                  aria-hidden
                />
                {t(`pages.landing.socialProof.items.${item.id}`)}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
