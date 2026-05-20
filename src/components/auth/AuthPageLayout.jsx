import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  Building2,
  ClipboardList,
  Package,
  Percent,
  Receipt,
  ShoppingCart,
  Users,
  Warehouse,
  ChevronRight,
} from "lucide-react";
import LanguageSwitcher from "@/components/common/LanguageSwitcher.jsx";
import { FaSpinner } from "react-icons/fa";
import { cn } from "@/lib/utils";

export const authInputClass =
  "flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50";

export const authPrimaryButtonClass =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500";

const HERO_SERVICES = [
  { id: "pos", icon: ShoppingCart },
  { id: "orders", icon: ClipboardList },
  { id: "products", icon: Package },
  { id: "inventory", icon: Warehouse },
  { id: "customers", icon: Users },
  { id: "reports", icon: BarChart3 },
  { id: "branches", icon: Building2 },
  { id: "promotions", icon: Percent },
];

const HERO_INDUSTRIES = ["fnb", "retail", "healthcare", "service", "education"];

function AuthHeroPanel({ appName, tagline }) {
  const { t } = useTranslation();
  const description = tagline || t("auth.layout.tagline");

  return (
    <aside className="relative hidden min-h-[100dvh] shrink-0 overflow-hidden text-white md:flex md:w-[min(46%,540px)] lg:w-[min(42%,580px)]">
      <div
        className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-800 to-slate-950"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.35] mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0%, transparent 45%), radial-gradient(circle at 80% 70%, rgba(56,189,248,0.25) 0%, transparent 50%)",
        }}
        aria-hidden
      />
      <div
        className="absolute -right-16 top-[8%] h-64 w-64 rounded-full bg-sky-300/25 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -left-10 bottom-[10%] h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex min-h-[100dvh] w-full flex-col p-8 lg:p-10">
        <div className="shrink-0">
          <div className="inline-flex w-fit items-center rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium tracking-wide text-blue-50 backdrop-blur-md">
            {t("brand.heroEyebrow")}
          </div>

          <div className="mt-8 flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-sm">
              <Receipt className="h-6 w-6 text-amber-200" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h1 className="coiny-regular text-4xl leading-tight text-white drop-shadow-sm lg:text-5xl">
                {appName}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-blue-100/95 lg:text-[15px]">
                {description}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 min-h-0 flex-1 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25">
          <section aria-labelledby="auth-hero-services-title">
            <h2
              id="auth-hero-services-title"
              className="text-xs font-semibold uppercase tracking-widest text-blue-200/90"
            >
              {t("auth.layout.servicesTitle")}
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-2.5">
              {HERO_SERVICES.map((service) => {
                const Icon = service.icon;
                return (
                  <li
                    key={service.id}
                    className="rounded-xl border border-white/12 bg-white/8 p-3 backdrop-blur-sm transition-colors hover:bg-white/12"
                  >
                    <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <p className="text-[13px] font-semibold leading-snug text-white">
                      {t(`auth.layout.services.${service.id}.title`)}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-blue-100/80">
                      {t(`auth.layout.services.${service.id}.desc`)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          <p className="mt-5 pb-2">
            <Link
              to="/landing"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-100 underline-offset-4 hover:text-white hover:underline"
            >
              {t("auth.layout.landingLink")}
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </p>

          <section className="mt-6 pb-2" aria-labelledby="auth-hero-industries-title">
            <h2
              id="auth-hero-industries-title"
              className="text-xs font-semibold uppercase tracking-widest text-blue-200/90"
            >
              {t("auth.layout.industriesTitle")}
            </h2>
            <ul className="mt-2.5 flex flex-wrap gap-2">
              {HERO_INDUSTRIES.map((key) => (
                <li
                  key={key}
                  className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-blue-50/95 backdrop-blur-sm"
                >
                  {t(`auth.layout.industries.${key}`)}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </aside>
  );
}

/**
 * Shared shell for login / register — card-scoped loading, language switcher, optional hero on md+.
 */
export default function AuthPageLayout({
  children,
  loading = false,
  loadingText,
  tagline,
}) {
  const { t } = useTranslation();
  const appName = t("brand.appName");

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-slate-50 text-foreground md:flex-row dark:bg-slate-950">
      <AuthHeroPanel appName={appName} tagline={tagline} />

      <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8 sm:py-12 lg:px-12">
        <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
          <LanguageSwitcher />
        </div>

        <div className="relative z-10 w-full max-w-[420px]">
          <div className="mb-6 overflow-hidden rounded-2xl border border-blue-100/80 bg-gradient-to-r from-blue-600 to-blue-800 px-5 py-4 text-center shadow-md md:hidden dark:border-blue-900/50">
            <p className="text-[11px] font-medium uppercase tracking-wider text-blue-100/90">
              {t("brand.heroEyebrow")}
            </p>
            <h1 className="coiny-regular mt-1 text-2xl text-white">{appName}</h1>
            <Link
              to="/landing"
              className="mt-2 inline-block text-xs font-medium text-blue-100 underline-offset-2 hover:text-white hover:underline"
            >
              {t("auth.layout.landingLink")}
            </Link>
          </div>

          <div
            className={cn(
              "relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl shadow-slate-200/50 dark:shadow-none",
              "p-6 sm:p-8",
              loading && "pointer-events-none",
            )}
          >
            {loading ? (
              <div
                className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-background/90 backdrop-blur-sm"
                role="status"
                aria-live="polite"
                aria-busy="true"
              >
                <FaSpinner className="h-9 w-9 animate-spin text-blue-600 dark:text-blue-400" />
                {loadingText ? (
                  <p className="text-sm font-medium text-foreground">
                    {loadingText}
                  </p>
                ) : null}
              </div>
            ) : null}

            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
