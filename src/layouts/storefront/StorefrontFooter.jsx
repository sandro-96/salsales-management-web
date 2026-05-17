import {
  Facebook,
  MapPin,
  Phone,
  MessageCircle,
  Store,
  Clock,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useStorefrontShop } from "./useStorefrontShop.js";

const Social = ({ href, icon: Icon, label }) =>
  href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </a>
  ) : null;

function formatTime(t) {
  if (!t) return null;
  const s = String(t);
  const m = s.match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : s;
}

function BranchCard({ branch, defaultLabel }) {
  const open = formatTime(branch.openingTime);
  const close = formatTime(branch.closingTime);
  const hours = open && close ? `${open} – ${close}` : open || close;
  return (
    <li className="rounded-md border bg-muted/30 px-3 py-2.5 space-y-1">
      <section className="flex items-center gap-1.5">
        <Store className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <p className="text-sm font-medium truncate" title={branch.name}>
          {branch.name}
        </p>
        {branch.isDefault && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
            {defaultLabel}
          </span>
        )}
      </section>
      {branch.address && (
        <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
          <span className="leading-snug">{branch.address}</span>
        </p>
      )}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {branch.phone && (
          <a
            href={`tel:${branch.phone}`}
            className="inline-flex items-center gap-1 text-[11px] hover:text-foreground"
          >
            <Phone className="h-3 w-3" />
            {branch.phone}
          </a>
        )}
        {hours && (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {hours}
          </span>
        )}
      </div>
    </li>
  );
}

export default function StorefrontFooter() {
  const { shop } = useStorefrontShop();
  const { t } = useTranslation();
  const branches = Array.isArray(shop.branches) ? shop.branches : [];
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-background mt-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
        <div>
          <h3 className="font-semibold mb-2">{shop.name}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("pages.storefront.footer.codNote")}
          </p>
        </div>
        <div className="space-y-1.5">
          <h4 className="font-medium mb-1.5 text-xs uppercase tracking-wide text-muted-foreground">
            {t("pages.storefront.footer.contactTitle")}
          </h4>
          {shop.phone && (
            <a
              href={`tel:${shop.phone}`}
              className="flex items-center gap-2 text-xs hover:text-foreground"
            >
              <Phone className="h-3.5 w-3.5" />
              {shop.phone}
            </a>
          )}
          {shop.address && (
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{shop.address}</span>
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <h4 className="font-medium mb-1.5 text-xs uppercase tracking-wide text-muted-foreground">
            {t("pages.storefront.footer.followTitle")}
          </h4>
          <section className="flex flex-wrap gap-x-4 gap-y-1.5">
            <Social
              href={shop.zaloPageUrl}
              icon={MessageCircle}
              label={t("pages.storefront.footer.zalo")}
            />
            <Social
              href={shop.facebookUrl}
              icon={Facebook}
              label={t("pages.storefront.footer.facebook")}
            />
            <Social
              href={shop.tiktokUrl}
              icon={MessageCircle}
              label={t("pages.storefront.footer.tiktok")}
            />
            <Social
              href={shop.shopeeUrl}
              icon={MessageCircle}
              label={t("pages.storefront.footer.shopee")}
            />
          </section>
        </div>
      </div>

      {branches.length > 0 && (
        <div className="border-t bg-muted/20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <h4 className="font-medium mb-3 text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5" />
              {t("pages.storefront.footer.branchesTitle", {
                count: branches.length,
              })}
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {branches.map((b) => (
                <BranchCard
                  key={b.id}
                  branch={b}
                  defaultLabel={t("pages.storefront.footer.branchDefault")}
                />
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="border-t">
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-3 text-[11px] text-muted-foreground text-center">
          {t("pages.storefront.footer.poweredBy", {
            year,
            shop: shop.name,
            brand: t("brand.appName"),
          })}
        </section>
      </div>
    </footer>
  );
}
