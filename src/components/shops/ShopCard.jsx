import {
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Store,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getFlagUrl } from "@/utils/commonUtils";
import {
  formatShopSubscriptionLine,
  getShopRoleLabel,
} from "@/utils/shopLabels.js";

export function ShopCard({
  shop,
  country,
  typeLabel,
  bizLabel,
  indLabel,
  isHero,
  onSelect,
}) {
  const { t } = useTranslation();
  const isActive = Boolean(shop.active);
  const roleLabel = getShopRoleLabel(t, shop.role);
  const isShopOwner = shop.role === "OWNER";

  return (
    <Card
      className={cn(
        "group relative gap-0 py-0 shadow-sm transition-all cursor-pointer hover:shadow-md",
        isHero && "ring-1 ring-border",
        !isActive && "opacity-75",
      )}
      onClick={() => onSelect(shop)}
    >
      <CardContent className={isHero ? "p-6" : "p-5"}>
        <div className="flex items-start gap-3 min-w-0">
          <Avatar
            className={cn(
              "rounded-xl border shrink-0",
              isHero ? "h-14 w-14" : "h-12 w-12",
              isActive ? "border-border" : "border-muted",
            )}
          >
            <AvatarImage
              src={shop.logoUrl}
              alt={shop.name}
              className="object-cover"
            />
            <AvatarFallback className="rounded-xl bg-muted text-muted-foreground">
              <Store className={isHero ? "h-7 w-7" : "h-6 w-6"} />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={cn(
                  "font-semibold truncate",
                  isHero ? "text-lg" : "text-sm",
                )}
              >
                {shop.name}
              </h3>
              {isHero && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-normal px-1.5 py-0"
                >
                  {t("pages.shops.list.featuredBadge")}
                </Badge>
              )}
              {isActive ? (
                <Badge
                  variant="outline"
                  className="text-[10px] gap-0.5 font-normal px-1.5 py-0"
                >
                  <CheckCircle2 className="h-2.5 w-2.5 text-muted-foreground" />
                  {t("pages.shops.list.active")}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-[10px] gap-0.5 font-normal px-1.5 py-0 text-muted-foreground"
                >
                  <XCircle className="h-2.5 w-2.5" />
                  {t("pages.shops.list.inactive")}
                </Badge>
              )}
            </div>
            {typeLabel && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {typeLabel}
                {bizLabel ? ` · ${bizLabel}` : ""}
              </p>
            )}
          </div>

          <ChevronRight
            className="h-5 w-5 shrink-0 mt-0.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
            aria-hidden
          />
        </div>

        <div
          className={cn(
            "flex flex-col gap-1.5 mt-3 min-w-0",
            isHero && "sm:pl-[4.25rem]",
          )}
        >
          {shop.address && (
            <span className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{shop.address}</span>
            </span>
          )}
          {shop.phone && (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              {country ? `${country.dialCode} ` : ""}
              {shop.phone}
            </span>
          )}
          {indLabel && (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              {indLabel}
            </span>
          )}
          {bizLabel && !typeLabel && (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5 shrink-0" />
              {bizLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-3 mt-1 border-t flex-wrap">
          {country && (
            <Badge
              variant="outline"
              className="text-[10px] gap-1 px-1.5 py-0 font-normal"
            >
              <img
                src={getFlagUrl(shop.countryCode)}
                alt={shop.countryCode}
                className="h-3 w-auto rounded-sm"
              />
              {country.name}
            </Badge>
          )}
          {roleLabel && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 font-normal"
            >
              {roleLabel}
            </Badge>
          )}
          {isShopOwner && shop.subscriptionStatus != null && (
            <Badge
              variant="outline"
              className="text-[10px] gap-0.5 px-1.5 py-0 font-normal ml-auto"
            >
              <Clock className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
              {formatShopSubscriptionLine(
                t,
                shop.subscriptionStatus,
                shop.subscriptionDaysRemaining,
              )}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
