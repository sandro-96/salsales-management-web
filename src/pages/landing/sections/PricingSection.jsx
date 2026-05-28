import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  Gift,
  MessageCircle,
  Repeat,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import MotionSection, { MotionItem } from "./MotionSection.jsx";
import { metaTrack } from "@/utils/metaPixel";

const GUARANTEE_ICONS = {
  noCard: ShieldCheck,
  cancel: Repeat,
  support: MessageCircle,
};
const GUARANTEE_IDS = ["noCard", "cancel", "support"];

export default function PricingSection() {
  const { t } = useTranslation();

  const features = t("pages.landing.pricing.features", { returnObjects: true });
  const featureList = Array.isArray(features) ? features : [];

  return (
    <MotionSection
      id="pricing"
      className="scroll-mt-20 border-y bg-muted/20 py-14 sm:py-20"
      aria-labelledby="pricing-heading"
    >
      <div className="mx-auto max-w-5xl space-y-10 px-4 sm:px-6">
        <div className="space-y-3 text-center">
          <Badge
            variant="secondary"
            className="mx-auto inline-flex items-center gap-1 border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {t("pages.landing.pricing.eyebrow")}
          </Badge>
          <h2
            id="pricing-heading"
            className="text-balance text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl"
          >
            {t("pages.landing.pricing.title")}
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("pages.landing.pricing.subtitle")}
          </p>
        </div>

        <MotionItem
          delay={0.1}
          className="relative overflow-hidden rounded-3xl border border-primary/30 bg-card shadow-2xl shadow-primary/10 ring-1 ring-primary/10"
        >
          {/* Decorative gradient blobs */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-0"
            style={{
              backgroundImage:
                "radial-gradient(45% 60% at 80% 10%, hsl(155 70% 50% / 0.18), transparent 70%), radial-gradient(40% 50% at 10% 90%, hsl(199 89% 48% / 0.16), transparent 70%)",
            }}
          />

          <div className="relative grid gap-0 lg:grid-cols-[1.1fr_1fr]">
            {/* Left: pricing phases + CTA */}
            <div className="space-y-6 p-6 sm:p-8 lg:p-10">
              {/* Trial phase */}
              <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                    <Gift className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      {t("pages.landing.pricing.trial.label")}
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
                      {t("pages.landing.pricing.trial.value")}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {t("pages.landing.pricing.trial.desc")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Paid phase */}
              <div className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-inner">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {t("pages.landing.pricing.paid.label")}
                    </p>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="bg-gradient-to-br from-foreground to-primary bg-clip-text text-3xl font-bold tabular-nums text-transparent sm:text-4xl">
                        {t("pages.landing.pricing.paid.value")}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">
                        {t("pages.landing.pricing.paid.period")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {t("pages.landing.pricing.paid.desc")}
                    </p>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="space-y-3 pt-2">
                <Button
                  size="lg"
                  className="w-full gap-2 shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5"
                  asChild
                >
                  <Link
                    to="/register"
                    onClick={() =>
                      metaTrack("Lead", {
                        content_name: "landing_pricing_register",
                      })
                    }
                  >
                    {t("pages.landing.pricing.cta")}
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full"
                  asChild
                >
                  <Link to="/login">
                    {t("pages.landing.pricing.ctaSecondary")}
                  </Link>
                </Button>
              </div>

              {/* Guarantees */}
              <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-border/60 pt-4 text-xs text-muted-foreground lg:justify-start">
                {GUARANTEE_IDS.map((id) => {
                  const Icon = GUARANTEE_ICONS[id];
                  return (
                    <li key={id} className="inline-flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      {t(`pages.landing.pricing.guarantees.${id}`)}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Right: feature list */}
            <div className="border-t border-border/60 bg-muted/30 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("pages.landing.pricing.includesTitle")}
              </p>
              <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                {featureList.map((feature) => (
                  <li
                    key={feature}
                    className="flex gap-2 text-sm leading-relaxed text-foreground/90"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </MotionItem>
      </div>
    </MotionSection>
  );
}
