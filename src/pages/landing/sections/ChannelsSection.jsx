import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  Globe,
  QrCode,
  ShoppingCart,
} from "lucide-react";

import { cn } from "@/lib/utils";

import MotionSection, { MotionItem } from "./MotionSection.jsx";

const CHANNELS = [
  {
    id: "pos",
    icon: ShoppingCart,
    badge: "01",
    card:
      "border-emerald-200/70 dark:border-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-800",
    bg: "from-emerald-500/[0.08] via-emerald-500/[0.02] to-transparent",
    iconBg:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20",
    bullet: "text-emerald-600 dark:text-emerald-400",
    badgeTone:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20",
  },
  {
    id: "storefront",
    icon: Globe,
    badge: "02",
    card:
      "border-sky-200/70 dark:border-sky-900/40 hover:border-sky-300 dark:hover:border-sky-800",
    bg: "from-sky-500/[0.08] via-sky-500/[0.02] to-transparent",
    iconBg:
      "bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-sky-500/20",
    bullet: "text-sky-600 dark:text-sky-400",
    badgeTone:
      "bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-sky-500/20",
  },
  {
    id: "table",
    icon: QrCode,
    badge: "03",
    card:
      "border-violet-200/70 dark:border-violet-900/40 hover:border-violet-300 dark:hover:border-violet-800",
    bg: "from-violet-500/[0.08] via-violet-500/[0.02] to-transparent",
    iconBg:
      "bg-violet-500/15 text-violet-700 dark:text-violet-300 ring-violet-500/20",
    bullet: "text-violet-600 dark:text-violet-400",
    badgeTone:
      "bg-violet-500/10 text-violet-700 dark:text-violet-300 ring-violet-500/20",
  },
];

export default function ChannelsSection() {
  const { t } = useTranslation();

  return (
    <MotionSection
      className="py-14 sm:py-20"
      aria-labelledby="channels-heading"
    >
      <div className="mx-auto max-w-6xl space-y-12 px-4 sm:px-6">
        <div id="channels" className="scroll-mt-20 space-y-3 text-center">
          <h2
            id="channels-heading"
            className="text-2xl font-bold tracking-tight sm:text-3xl"
          >
            {t("pages.landing.channels.title")}
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("pages.landing.channels.subtitle")}
          </p>
        </div>

        <div className="grid gap-5 md:gap-6 lg:grid-cols-3">
          {CHANNELS.map((channel, idx) => {
            const Icon = channel.icon;
            const points = t(`pages.landing.channels.${channel.id}.points`, {
              returnObjects: true,
            });
            const pointList = Array.isArray(points) ? points : [];
            return (
              <MotionItem
                key={channel.id}
                delay={idx * 0.08}
                className={cn(
                  "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl",
                  channel.card,
                )}
              >
                {/* Decorative gradient layer */}
                <div
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90",
                    channel.bg,
                  )}
                />

                <div className="relative flex flex-1 flex-col p-6 sm:p-7">
                  {/* Header: icon + step badge */}
                  <div className="mb-4 flex items-start justify-between">
                    <span
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl ring-1 transition-transform group-hover:scale-105",
                        channel.iconBg,
                      )}
                    >
                      <Icon className="h-6 w-6" strokeWidth={1.75} />
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums ring-1",
                        channel.badgeTone,
                      )}
                    >
                      {channel.badge}
                    </span>
                  </div>

                  {/* Title + description */}
                  <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                    {t(`pages.landing.channels.${channel.id}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(`pages.landing.channels.${channel.id}.desc`)}
                  </p>

                  {/* Divider */}
                  <div className="my-5 h-px w-full bg-border/60" />

                  {/* Bullet points */}
                  <ul className="space-y-2.5">
                    {pointList.map((point) => (
                      <li
                        key={point}
                        className="flex gap-2 text-sm text-foreground/80"
                      >
                        <CheckCircle2
                          className={cn(
                            "mt-0.5 h-4 w-4 shrink-0",
                            channel.bullet,
                          )}
                        />
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </MotionItem>
            );
          })}
        </div>
      </div>
    </MotionSection>
  );
}
