import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Clock,
  Headphones,
  Mail,
  MessageCircle,
  Phone,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { ContactMethodCard } from "@/components/contact/ContactMethodCard";
import { ListPageHeader } from "@/components/table/ListPageHeader.jsx";
import { getSystemSupportConfig } from "@/utils/systemSupportConfig";

export default function ContactPage() {
  const { t } = useTranslation();
  const config = getSystemSupportConfig();
  const brand = t("brand.appName");
  const displayName = config.name || t("systemSupport.title");
  const hoursValue = t("pages.contact.hoursValue");

  return (
    <div className="h-full min-w-0 flex-1 flex-col gap-8 p-4 md:p-8 w-full">
      <ListPageHeader
        icon={Headphones}
        title={t("pages.contact.title")}
        subtitle={
          <div className="space-y-2 pt-1">
            <p>{t("pages.contact.subtitle", { brand })}</p>
            {config.name ? (
              <p className="font-medium text-foreground">{displayName}</p>
            ) : null}
          </div>
        }
      />

      <div className="flex flex-col gap-8">
        {!config.hasAny ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <Headphones className="h-14 w-14 text-muted-foreground/35" />
              <div className="space-y-2 max-w-sm">
                <h3 className="text-lg font-semibold">
                  {t("pages.contact.emptyTitle")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("pages.contact.empty")}
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="mt-2">
                <Link to="/support">{t("pages.contact.ticketsCta")}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
            <ContactMethodCard
              icon={Phone}
              title={t("pages.contact.phone")}
              value={config.phone}
              href={config.phone ? `tel:${config.phone}` : null}
              actionLabel={t("pages.contact.call")}
            />
            <ContactMethodCard
              icon={Mail}
              title={t("pages.contact.email")}
              value={config.email}
              href={config.email ? `mailto:${config.email}` : null}
              actionLabel={t("pages.contact.sendEmail")}
            />
            <ContactMethodCard
              icon={MessageCircle}
              title={t("pages.contact.zalo")}
              value={config.zalo}
              href={config.zaloUrl}
              actionLabel={t("pages.contact.openZalo")}
              external
            />
            <ContactMethodCard
              icon={Clock}
              title={t("pages.contact.hours")}
              value={hoursValue}
            />
          </div>
        )}

        {config.note ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap rounded-lg border bg-muted/30 px-5 py-4 leading-relaxed">
            {config.note}
          </p>
        ) : null}

        <Card className="shadow-sm">
          <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
            <div className="flex items-start gap-4 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Ticket className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0 space-y-2">
                <CardTitle className="text-base">
                  {t("pages.contact.ticketsTitle")}
                </CardTitle>
                <CardDescription className="leading-relaxed">
                  {t("pages.contact.ticketsDesc")}
                </CardDescription>
              </div>
            </div>
            <Button asChild className="shrink-0 w-full sm:w-auto">
              <Link to="/support" className="gap-2">
                {t("pages.contact.ticketsCta")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
