import { useTranslation } from "react-i18next";
import {
  Laptop,
  Printer,
  Smartphone,
  Tablet,
  Users,
  Wallet,
  Globe2,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";

import MotionSection, { MotionItem } from "./MotionSection.jsx";

const BENEFITS = [
  { id: "zeroHw", Icon: Wallet, tone: "emerald" },
  { id: "anyDevice", Icon: Globe2, tone: "sky" },
  { id: "instantStart", Icon: Zap, tone: "violet" },
  { id: "printer", Icon: Printer, tone: "amber" },
];

const DEVICES = [
  { id: "phone", Icon: Smartphone },
  { id: "tablet", Icon: Tablet },
  { id: "laptop", Icon: Laptop },
  { id: "team", Icon: Users },
];

const TONE_BENEFIT = {
  emerald:
    "from-emerald-500/15 to-background border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
  sky: "from-sky-500/15 to-background border-sky-500/30 text-sky-700 dark:text-sky-300",
  violet:
    "from-violet-500/15 to-background border-violet-500/30 text-violet-700 dark:text-violet-300",
  amber:
    "from-amber-500/15 to-background border-amber-500/30 text-amber-700 dark:text-amber-300",
};

export default function NoHardwareSection({ brand }) {
  const { t } = useTranslation();
  return (
    <MotionSection
      id="no-hardware"
      className="scroll-mt-20 py-14 sm:py-20"
      aria-labelledby="no-hardware-heading"
    >
      <div className="mx-auto max-w-6xl space-y-12 px-4 sm:px-6">
        <div className="space-y-2 text-center">
          <h2
            id="no-hardware-heading"
            className="text-balance text-2xl font-bold tracking-tight sm:text-3xl"
          >
            {t("pages.landing.noHardware.title")}
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("pages.landing.noHardware.subtitle", { brand })}
          </p>
        </div>

        {/* Benefits */}
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b, idx) => (
            <MotionItem as="li" key={b.id} delay={idx * 0.05}>
              <div
                className={cn(
                  "h-full rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg",
                  TONE_BENEFIT[b.tone],
                )}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/80 shadow-sm">
                  <b.Icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-4 text-base font-semibold text-foreground">
                  {t(`pages.landing.noHardware.benefits.${b.id}.title`)}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {t(`pages.landing.noHardware.benefits.${b.id}.desc`)}
                </p>
              </div>
            </MotionItem>
          ))}
        </ul>

        {/* Savings callout */}
        <MotionItem className="overflow-hidden rounded-2xl border bg-gradient-to-r from-emerald-500/10 via-primary/5 to-sky-500/10 p-6 shadow-sm sm:p-7">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                {t("pages.landing.noHardware.savings.eyebrow")}
              </p>
              <p className="mt-1 bg-gradient-to-br from-emerald-600 via-primary to-sky-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
                {t("pages.landing.noHardware.savings.value")}
              </p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {t("pages.landing.noHardware.savings.desc", { brand })}
              </p>
            </div>
            <div
              className="hidden items-end gap-3 rounded-2xl border bg-background/70 px-5 py-4 text-muted-foreground shadow-sm sm:flex"
              aria-hidden
            >
              <Smartphone className="h-7 w-7" />
              <Tablet className="h-9 w-9" />
              <Laptop className="h-11 w-11" />
            </div>
          </div>
        </MotionItem>

        {/* Devices */}
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h3
              id="no-hardware-devices-heading"
              className="text-xl font-bold tracking-tight sm:text-2xl"
            >
              {t("pages.landing.noHardware.devices.title")}
            </h3>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t("pages.landing.noHardware.devices.subtitle")}
            </p>
          </div>

          <ul
            aria-labelledby="no-hardware-devices-heading"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            {DEVICES.map((d, idx) => (
              <MotionItem as="li" key={d.id} delay={idx * 0.05}>
                <div className="group h-full rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-sky-500/15 text-primary transition-colors group-hover:from-primary group-hover:to-emerald-500 group-hover:text-primary-foreground">
                    <d.Icon className="h-6 w-6" aria-hidden />
                  </span>
                  <p className="mt-4 font-semibold">
                    {t(`pages.landing.noHardware.devices.items.${d.id}.title`)}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {t(`pages.landing.noHardware.devices.items.${d.id}.desc`)}
                  </p>
                </div>
              </MotionItem>
            ))}
          </ul>
        </div>
      </div>
    </MotionSection>
  );
}
