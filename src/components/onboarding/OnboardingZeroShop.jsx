import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  HelpCircle,
  Store,
  GitBranch,
  ShoppingCart,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "step1", icon: Store, active: true },
  { key: "step2", icon: GitBranch, active: false },
  { key: "step3", icon: ShoppingCart, active: false },
];

export function OnboardingZeroShop() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const displayName =
    user?.fullName?.trim() ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.email?.split("@")[0] ||
    "";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8 md:py-12">
      <div className="space-y-2 text-center md:text-left">
        <p className="text-sm font-medium text-primary">
          {t("main.onboarding.eyebrow")}
        </p>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {displayName
            ? t("main.onboarding.title", { name: displayName })
            : t("main.onboarding.titleNoName")}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed md:text-base">
          {t("main.onboarding.subtitle")}
        </p>
      </div>

      <ol className="grid gap-3 sm:grid-cols-3">
        {STEPS.map(({ key, icon: Icon, active }, index) => (
          <li
            key={key}
            className={cn(
              "flex flex-col gap-2 rounded-lg border p-3 text-sm",
              active
                ? "border-primary/40 bg-primary/5"
                : "border-border bg-muted/30 opacity-70",
            )}
          >
            <span className="flex items-center gap-2 font-medium">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-xs",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {index + 1}
              </span>
              <Icon className="size-4 shrink-0 text-muted-foreground" />
            </span>
            <span className="text-muted-foreground">
              {t(`main.onboarding.${key}`)}
            </span>
          </li>
        ))}
      </ol>

      <div className="flex flex-col items-center gap-6 rounded-xl border bg-card p-6 shadow-sm md:flex-row md:p-8">
        <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
          <Store className="size-10 text-primary" />
        </div>
        <div className="flex flex-1 flex-col items-center gap-4 text-center md:items-start md:text-left">
          <p className="text-sm text-muted-foreground">
            {t("main.onboarding.cardHint")}
          </p>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              size="lg"
              variant="success"
              className="w-full sm:w-auto"
              onClick={() => navigate("/shops/create")}
            >
              {t("main.onboarding.ctaCreate")}
              <ArrowRight className="ml-1 size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => navigate("/shops")}
            >
              {t("main.onboarding.ctaShops")}
            </Button>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground md:text-left">
        {t("main.onboarding.invitedHint")}{" "}
        <Link
          to="/support"
          className="inline-flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline"
        >
          <HelpCircle className="size-3.5" />
          {t("main.onboarding.supportLink")}
        </Link>
      </p>
    </div>
  );
}
