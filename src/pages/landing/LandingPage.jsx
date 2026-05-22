import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Package,
  Percent,
  PlayCircle,
  ShoppingCart,
  Smartphone,
  Users,
  Warehouse,
  UtensilsCrossed,
  Bell,
  Layers,
  Shield,
  Receipt,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import ChannelsSection from "./sections/ChannelsSection.jsx";
import HeroMockup from "./sections/HeroMockup.jsx";
import LandingNav from "./sections/LandingNav.jsx";
import MotionSection, { MotionItem } from "./sections/MotionSection.jsx";
import NoHardwareSection from "./sections/NoHardwareSection.jsx";
import PricingSection from "./sections/PricingSection.jsx";
import ScrollToTopButton from "./sections/ScrollToTopButton.jsx";
import SocialProofStrip from "./sections/SocialProofStrip.jsx";
import TestimonialsSection from "./sections/TestimonialsSection.jsx";
import { useLandingPageJsonLd } from "@/hooks/useLandingPageJsonLd.js";

const FEATURE_IDS = [
  "pos",
  "orders",
  "products",
  "inventory",
  "customers",
  "reports",
  "branches",
  "promotions",
  "tables",
  "staff",
  "tax",
  "billing",
];
const INDUSTRY_IDS = ["fnb", "retail", "healthcare", "service", "education"];
const WORKFLOW_STEP_IDS = ["1", "2", "3", "4"];
const FAQ_IDS = [
  "hardware",
  "printer",
  "free",
  "storefront",
  "qr",
  "posOffline",
  "industries",
  "upgrade",
];

const FEATURE_ICONS = {
  pos: ShoppingCart,
  orders: ClipboardList,
  products: Package,
  inventory: Warehouse,
  customers: Users,
  reports: BarChart3,
  branches: Building2,
  promotions: Percent,
  tables: UtensilsCrossed,
  staff: Shield,
  tax: Receipt,
  billing: CreditCard,
};

function SectionHeading({ id, title, subtitle, className }) {
  return (
    <div
      id={id}
      className={cn("scroll-mt-20 space-y-2 text-center", className)}
    >
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      {subtitle ? (
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export default function LandingPage() {
  const { t } = useTranslation();
  useLandingPageJsonLd();
  const brand = t("brand.appName");
  const year = new Date().getFullYear();

  const heroHighlights = [
    t("pages.landing.hero.highlights.pos"),
    t("pages.landing.hero.highlights.storefront"),
    t("pages.landing.hero.highlights.qr"),
    t("pages.landing.hero.highlights.reports"),
  ];

  const stats = [
    {
      value: t("pages.landing.stats.devices"),
      desc: t("pages.landing.stats.devicesDesc"),
      icon: Smartphone,
    },
    {
      value: t("pages.landing.stats.channels"),
      desc: t("pages.landing.stats.channelsDesc"),
      icon: Layers,
    },
    {
      value: t("pages.landing.stats.modules"),
      desc: t("pages.landing.stats.modulesDesc"),
      icon: Package,
    },
    {
      value: t("pages.landing.stats.realtime"),
      desc: t("pages.landing.stats.realtimeDesc"),
      icon: Bell,
    },
  ];

  const fnbItems = Object.keys(
    t("pages.landing.fnb.items", { returnObjects: true }),
  );
  const reportItems = Object.keys(
    t("pages.landing.reports.items", { returnObjects: true }),
  );

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        {t("pages.landing.nav.skipToContent")}
      </a>

      <LandingNav brand={brand} t={t} />

      <main id="main-content">
        {/* Hero */}
        <section className="relative overflow-hidden border-b">
          {/* Background layers */}
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden
            style={{
              backgroundImage:
                "radial-gradient(60% 50% at 50% 0%, hsl(155 70% 50% / 0.10), transparent 65%), radial-gradient(40% 35% at 90% 10%, hsl(199 89% 48% / 0.12), transparent 60%), radial-gradient(40% 40% at 10% 90%, hsl(265 80% 60% / 0.08), transparent 60%)",
            }}
          />
          {/* Subtle grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.18] dark:opacity-[0.08]"
            aria-hidden
            style={{
              backgroundImage:
                "linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage:
                "radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 80%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 80%)",
            }}
          />

          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
            <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
              {/* Copy */}
              <div className="text-center lg:text-left">
                <Badge
                  variant="secondary"
                  className="mb-4 inline-flex items-center gap-1.5 border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inset-0 animate-ping rounded-full bg-primary/60" />
                    <span className="relative h-1.5 w-1.5 rounded-full bg-primary" />
                  </span>
                  {t("pages.landing.hero.badge")}
                </Badge>
                <h1 className="text-balance bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl lg:text-5xl lg:leading-[1.1]">
                  {t("pages.landing.hero.title")}
                </h1>
                <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {t("pages.landing.hero.subtitle", { brand })}
                </p>
                <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-start lg:justify-start">
                  <Button
                    size="lg"
                    className="w-full gap-2 shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 sm:w-auto"
                    asChild
                  >
                    <Link to="/register">
                      {t("pages.landing.hero.ctaPrimary")}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full gap-2 sm:w-auto"
                    asChild
                  >
                    <a href="#channels">
                      <PlayCircle className="h-4 w-4" />
                      {t("pages.landing.hero.ctaSecondary")}
                    </a>
                  </Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  {t("pages.landing.hero.noCard")}
                </p>
                <ul className="mt-7 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                  {heroHighlights.map((label) => (
                    <li key={label}>
                      <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/70 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        {label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mockup */}
              <div className="relative">
                <HeroMockup />
              </div>
            </div>
          </div>
        </section>

        {/* Social proof strip */}
        <SocialProofStrip />

        {/* Stats strip */}
        <section className="border-b bg-muted/20" aria-label="Highlights">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-border/60 sm:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.value}
                  className="flex flex-col items-center gap-2 bg-background px-4 py-6 text-center sm:py-8"
                >
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                  <p className="text-sm font-bold sm:text-base">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* No hardware — flagship differentiator */}
        <NoHardwareSection brand={brand} />

        {/* Sales channels */}
        <ChannelsSection />

        {/* Features grid */}
        <MotionSection
          className="border-y bg-muted/20 py-14 sm:py-20"
          aria-labelledby="features-heading"
        >
          <div className="mx-auto max-w-6xl space-y-10 px-4 sm:px-6">
            <SectionHeading
              id="features"
              title={t("pages.landing.features.title")}
              subtitle={t("pages.landing.features.subtitle")}
            />
            <h2 id="features-heading" className="sr-only">
              {t("pages.landing.features.title")}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {FEATURE_IDS.map((id, idx) => {
                const Icon = FEATURE_ICONS[id] ?? Package;
                return (
                  <MotionItem
                    as="li"
                    key={id}
                    delay={(idx % 8) * 0.04}
                  >
                    <Card className="group h-full gap-0 py-0 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                      <CardHeader className="space-y-2 p-4 pb-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <Icon className="h-4 w-4" />
                        </span>
                        <CardTitle className="text-sm font-semibold leading-snug">
                          {t(`pages.landing.features.${id}.title`)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {t(`pages.landing.features.${id}.desc`)}
                        </p>
                      </CardContent>
                    </Card>
                  </MotionItem>
                );
              })}
            </ul>
          </div>
        </MotionSection>

        {/* Industries */}
        <MotionSection
          className="py-14 sm:py-20"
          aria-labelledby="industries-heading"
        >
          <div className="mx-auto max-w-6xl space-y-10 px-4 sm:px-6">
            <SectionHeading
              id="industries"
              title={t("pages.landing.industries.title")}
              subtitle={t("pages.landing.industries.subtitle")}
            />
            <h2 id="industries-heading" className="sr-only">
              {t("pages.landing.industries.title")}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {INDUSTRY_IDS.map((id, idx) => (
                <MotionItem
                  key={id}
                  delay={idx * 0.05}
                  className="rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                >
                  <p className="font-semibold">
                    {t(`pages.landing.industries.${id}.label`)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(`pages.landing.industries.${id}.desc`)}
                  </p>
                </MotionItem>
              ))}
            </div>
          </div>
        </MotionSection>

        {/* Workflow */}
        <MotionSection
          id="workflow"
          className="scroll-mt-20 border-y bg-muted/20 py-14 sm:py-20"
          aria-labelledby="workflow-heading"
        >
          <div className="mx-auto max-w-6xl space-y-10 px-4 sm:px-6">
            <SectionHeading
              title={t("pages.landing.workflow.title")}
              subtitle={t("pages.landing.workflow.subtitle")}
            />
            <h2 id="workflow-heading" className="sr-only">
              {t("pages.landing.workflow.title")}
            </h2>
            <ol className="flex list-none flex-col gap-4 p-0 sm:grid sm:grid-cols-2 lg:flex lg:flex-row lg:items-stretch lg:gap-3">
              {WORKFLOW_STEP_IDS.map((step, idx) => (
                <li key={step} className="contents">
                  {idx > 0 ? (
                    <span
                      className="hidden shrink-0 items-center justify-center self-center lg:flex"
                      aria-hidden
                    >
                      <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
                    </span>
                  ) : null}
                  <MotionItem
                    delay={idx * 0.08}
                    className="min-w-0 flex-1 rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                  >
                    <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-500 text-sm font-bold text-primary-foreground shadow-md shadow-primary/30">
                      {step}
                    </span>
                    <p className="font-semibold">
                      {t(`pages.landing.workflow.steps.${step}.title`)}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {t(`pages.landing.workflow.steps.${step}.desc`)}
                    </p>
                  </MotionItem>
                </li>
              ))}
            </ol>
          </div>
        </MotionSection>

        {/* F&B + Reports two-column */}
        <MotionSection className="py-14 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-2">
            <MotionItem className="rounded-2xl border bg-gradient-to-br from-violet-500/[0.08] to-background p-6 transition-all hover:-translate-y-1 hover:shadow-xl sm:p-8">
              <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                <UtensilsCrossed className="h-5 w-5" />
                <h2 className="text-lg font-bold">
                  {t("pages.landing.fnb.title")}
                </h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("pages.landing.fnb.subtitle")}
              </p>
              <ul className="mt-5 space-y-3">
                {fnbItems.map((key) => (
                  <li key={key} className="flex gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
                    {t(`pages.landing.fnb.items.${key}`)}
                  </li>
                ))}
              </ul>
            </MotionItem>
            <MotionItem
              delay={0.1}
              className="rounded-2xl border bg-gradient-to-br from-emerald-500/[0.08] to-background p-6 transition-all hover:-translate-y-1 hover:shadow-xl sm:p-8"
            >
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <BarChart3 className="h-5 w-5" />
                <h2 className="text-lg font-bold">
                  {t("pages.landing.reports.title")}
                </h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("pages.landing.reports.subtitle")}
              </p>
              <ul className="mt-5 space-y-3">
                {reportItems.map((key) => (
                  <li key={key} className="flex gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    {t(`pages.landing.reports.items.${key}`)}
                  </li>
                ))}
              </ul>
            </MotionItem>
          </div>
        </MotionSection>

        {/* Testimonials */}
        <TestimonialsSection brand={brand} />

        {/* Pricing */}
        <PricingSection />

        {/* Multi-branch */}
        <MotionSection className="py-12 sm:py-16">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center sm:px-6">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary/15 to-sky-500/15 text-primary">
              <Building2 className="h-6 w-6" />
            </span>
            <h2 className="text-xl font-bold sm:text-2xl">
              {t("pages.landing.multiBranch.title")}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t("pages.landing.multiBranch.desc")}
            </p>
          </div>
        </MotionSection>

        {/* FAQ */}
        <MotionSection
          id="faq"
          className="scroll-mt-20 border-y bg-muted/20 py-14 sm:py-20"
          aria-labelledby="faq-heading"
        >
          <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-6">
            <SectionHeading title={t("pages.landing.faq.title")} />
            <h2 id="faq-heading" className="sr-only">
              {t("pages.landing.faq.title")}
            </h2>
            <div className="space-y-3">
              {FAQ_IDS.map((id, idx) => (
                <MotionItem
                  as="details"
                  key={id}
                  delay={idx * 0.04}
                  className="group rounded-xl border bg-card px-4 py-3 shadow-sm transition-shadow open:shadow-md"
                >
                  <summary className="cursor-pointer list-none font-medium marker:hidden [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-3">
                      {t(`pages.landing.faq.items.${id}.q`)}
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {t(`pages.landing.faq.items.${id}.a`)}
                  </p>
                </MotionItem>
              ))}
            </div>
          </div>
        </MotionSection>

        {/* Final CTA */}
        <section className="relative overflow-hidden border-t py-14 sm:py-20">
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden
            style={{
              backgroundImage:
                "radial-gradient(60% 60% at 50% 100%, hsl(155 70% 50% / 0.18), transparent 70%), radial-gradient(40% 40% at 10% 0%, hsl(245 90% 60% / 0.12), transparent 60%)",
            }}
          />
          <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
            <h2 className="text-2xl font-bold sm:text-3xl">
              {t("pages.landing.cta.title")}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t("pages.landing.cta.subtitle")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5"
                asChild
              >
                <Link to="/register">{t("pages.landing.cta.primary")}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">{t("pages.landing.cta.secondary")}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-muted/30 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6 md:flex-row md:justify-between">
          <div className="max-w-sm space-y-2">
            <p className="coiny-regular text-lg text-blue-800 dark:text-blue-300">
              {brand}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("pages.landing.footer.tagline", { brand })}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div>
              <p className="mb-2 font-semibold">
                {t("pages.landing.footer.product")}
              </p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>
                  <a href="#channels" className="hover:text-foreground">
                    {t("pages.landing.nav.channels")}
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-foreground">
                    {t("pages.landing.nav.features")}
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-foreground">
                    {t("pages.landing.nav.pricing")}
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-foreground">
                    {t("pages.landing.nav.faq")}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-2 font-semibold">
                {t("pages.landing.footer.account")}
              </p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>
                  <Link to="/register" className="hover:text-foreground">
                    {t("pages.landing.nav.register")}
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-foreground">
                    {t("pages.landing.nav.login")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-2 font-semibold">
                {t("pages.landing.footer.legal")}
              </p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>
                  <Link to="/terms" className="hover:text-foreground">
                    {t("pages.landing.footer.terms")}
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-foreground">
                    {t("pages.landing.footer.privacy")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-6xl space-y-2 px-4 text-center text-xs text-muted-foreground sm:px-6">
          <p>{t("pages.landing.footer.operator")}</p>
          <p>{t("pages.landing.footer.copyright", { year, brand })}</p>
        </div>
      </footer>

      <ScrollToTopButton label={t("pages.landing.backToTop")} />
    </div>
  );
}
