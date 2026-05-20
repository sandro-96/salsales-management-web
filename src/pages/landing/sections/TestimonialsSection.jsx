import { useTranslation } from "react-i18next";
import { Quote, Star } from "lucide-react";

import MotionSection, { MotionItem } from "./MotionSection.jsx";

const ITEMS = ["1", "2", "3"];

const AVATAR_TONES = [
  "from-emerald-400 to-teal-500",
  "from-violet-400 to-sky-500",
  "from-amber-400 to-rose-500",
];

function getInitial(name) {
  if (!name) return "?";
  const trimmed = String(name).trim();
  return trimmed.charAt(0).toUpperCase();
}

export default function TestimonialsSection({ brand }) {
  const { t } = useTranslation();

  return (
    <MotionSection
      className="py-14 sm:py-20"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-6xl space-y-10 px-4 sm:px-6">
        <div className="space-y-2 text-center">
          <h2
            id="testimonials-heading"
            className="text-2xl font-bold tracking-tight sm:text-3xl"
          >
            {t("pages.landing.testimonials.title")}
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("pages.landing.testimonials.subtitle", { brand })}
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {ITEMS.map((id, idx) => (
            <MotionItem
              key={id}
              delay={idx * 0.08}
              className="group relative flex h-full flex-col rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl sm:p-7"
            >
              <Quote
                className="h-7 w-7 text-primary/30 transition-colors group-hover:text-primary/60"
                aria-hidden
              />
              <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90 sm:text-[0.95rem]">
                “{t(`pages.landing.testimonials.items.${id}.quote`)}”
              </p>
              <div className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br ${AVATAR_TONES[idx]} font-bold text-white shadow-sm`}
                  aria-hidden
                >
                  {getInitial(t(`pages.landing.testimonials.items.${id}.name`))}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {t(`pages.landing.testimonials.items.${id}.name`)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t(`pages.landing.testimonials.items.${id}.role`)}
                  </p>
                </div>
                <div
                  className="flex items-center gap-0.5 text-amber-500"
                  aria-label="5 stars"
                >
                  {[0, 1, 2, 3, 4].map((s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
              </div>
            </MotionItem>
          ))}
        </div>
      </div>
    </MotionSection>
  );
}
