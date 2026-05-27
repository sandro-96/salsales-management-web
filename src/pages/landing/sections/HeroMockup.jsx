import { motion as Motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  ArrowUpRight,
  Bell,
  ChevronRight,
  ShoppingCart,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";

const CHANNEL_BARS = [
  { id: "pos", percent: 64, tone: "bg-primary" },
  { id: "online", percent: 22, tone: "bg-sky-500" },
  { id: "qr", percent: 14, tone: "bg-violet-500" },
];

export default function HeroMockup() {
  const { t } = useTranslation();
  const m = (key, opts) => t(`pages.landing.hero.mockup.${key}`, opts);

  const topProducts = [
    { id: "1", percent: 92 },
    { id: "2", percent: 74 },
    { id: "3", percent: 58 },
  ];

  return (
    <div className="relative isolate">
      {/* Glow effects behind mockup */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-10 -inset-y-12 -z-10 blur-3xl"
        style={{
          background:
            "radial-gradient(50% 50% at 60% 40%, hsl(155 80% 50% / 0.18), transparent 70%), radial-gradient(40% 50% at 25% 75%, hsl(245 90% 60% / 0.18), transparent 65%)",
        }}
      />

      <Motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
        className="relative"
      >
        {/* Main dashboard card */}
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/90 shadow-2xl shadow-primary/10 ring-1 ring-black/5 backdrop-blur">
          {/* Top window chrome */}
          <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            </div>
            <div className="hidden items-center gap-1.5 rounded-md border border-border/60 bg-background/70 px-2.5 py-1 text-[10px] text-muted-foreground sm:flex">
              app.{(import.meta.env?.VITE_BRAND_DOMAIN ?? "sotuci")}.vn/dashboard
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/60" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              {m("badge")}
            </span>
          </div>

          {/* Dashboard body */}
          <div className="grid gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground sm:text-base">
                  {m("title")}
                </p>
                <p className="text-xs text-muted-foreground">{m("subtitle")}</p>
              </div>
              <Sparkles className="h-4 w-4 text-primary/60" aria-hidden />
            </div>

            {/* KPI tiles */}
            <div className="grid grid-cols-2 gap-3">
              <KpiTile
                tone="emerald"
                label={m("revenue")}
                value={m("revenueValue")}
                delta={m("revenueDelta")}
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <KpiTile
                tone="sky"
                label={m("orders")}
                value={m("ordersValue")}
                delta={m("ordersDelta")}
                icon={<ShoppingCart className="h-4 w-4" />}
              />
            </div>

            {/* Channel revenue split */}
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <p className="mb-2.5 text-xs font-medium text-muted-foreground">
                {m("channelsTitle")}
              </p>
              <div className="space-y-2.5">
                {CHANNEL_BARS.map((bar) => (
                  <div key={bar.id} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-foreground/80">
                        {m(`channel${bar.id === "pos" ? "Pos" : bar.id === "online" ? "Online" : "Qr"}`)}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {bar.percent}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <Motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${bar.percent}%` }}
                        transition={{ duration: 1.1, delay: 0.6, ease: "easeOut" }}
                        className={cn("h-full rounded-full", bar.tone)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top products */}
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  {m("topProductsTitle")}
                </p>
                <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
              </div>
              <ul className="space-y-2">
                {topProducts.map((p, idx) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 text-[11px] sm:text-xs"
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                      {idx + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                      {m(`topProducts.${p.id}`)}
                    </span>
                    <div className="hidden h-1 w-20 overflow-hidden rounded-full bg-muted sm:block">
                      <Motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${p.percent}%` }}
                        transition={{
                          duration: 1.1,
                          delay: 0.8 + idx * 0.1,
                          ease: "easeOut",
                        }}
                        className="h-full rounded-full bg-gradient-to-r from-primary to-sky-500"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Floating "new order" toast */}
        <Motion.div
          initial={{ opacity: 0, x: 20, y: 10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.6, delay: 1, ease: "easeOut" }}
          className="absolute -right-3 top-20 hidden w-56 rounded-xl border border-border/70 bg-card/95 p-3 shadow-xl shadow-primary/10 ring-1 ring-black/5 backdrop-blur sm:block lg:-right-6"
        >
          <div className="flex items-start gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Bell className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">
                {m("newOrder")}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {m("newOrderItems")}
              </p>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </Motion.div>

        {/* Floating mini stat */}
        <Motion.div
          initial={{ opacity: 0, x: -20, y: -10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.6, delay: 1.15, ease: "easeOut" }}
          className="absolute -left-3 bottom-16 hidden w-44 rounded-xl border border-border/70 bg-card/95 p-3 shadow-xl shadow-sky-500/10 ring-1 ring-black/5 backdrop-blur sm:block lg:-left-6"
        >
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <TrendingUp className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] text-muted-foreground">
                {m("orders")}
              </p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {m("ordersValue")}
              </p>
            </div>
          </div>
        </Motion.div>
      </Motion.div>
    </div>
  );
}

function KpiTile({ tone, label, value, delta, icon }) {
  const toneMap = {
    emerald:
      "from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/20 text-emerald-700 dark:text-emerald-300",
    sky: "from-sky-500/15 via-sky-500/5 to-transparent border-sky-500/20 text-sky-700 dark:text-sky-300",
  };
  return (
    <div
      className={cn(
        "rounded-xl border bg-gradient-to-br p-3",
        toneMap[tone] ?? toneMap.emerald,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">
          {label}
        </span>
        <span className="opacity-70">{icon}</span>
      </div>
      <p className="mt-1.5 text-base font-bold tabular-nums text-foreground sm:text-lg">
        {value}
      </p>
      <p className="text-[10px] font-medium opacity-80">{delta}</p>
    </div>
  );
}
