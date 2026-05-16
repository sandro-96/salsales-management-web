import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSystemSupportConfig } from "@/utils/systemSupportConfig";

function ContactMethodCard({
  icon: Icon,
  title,
  value,
  href,
  actionLabel,
  external,
}) {
  if (!value) return null;
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4 shrink-0" />
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
        <CardDescription className="text-base font-semibold text-foreground break-all">
          {value}
        </CardDescription>
      </CardHeader>
      {href && actionLabel ? (
        <CardContent className="pt-0">
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <a
              href={href}
              {...(external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {actionLabel}
            </a>
          </Button>
        </CardContent>
      ) : null}
    </Card>
  );
}

export default function ContactPage() {
  const { t } = useTranslation();
  const config = getSystemSupportConfig();
  const brand = t("brand.appName");
  const displayName = config.name || t("systemSupport.title");

  return (
    <div className="w-full p-4 md:p-6 md:max-w-3xl md:mx-auto space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-primary">
          <Headphones className="h-6 w-6 shrink-0" />
          <h1 className="text-2xl font-bold tracking-tight">
            {t("pages.contact.title")}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("pages.contact.subtitle", { brand })}
        </p>
        {config.name ? (
          <p className="text-sm font-medium text-foreground">{displayName}</p>
        ) : null}
      </div>

      {!config.hasAny ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {t("pages.contact.empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
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
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" />
                <CardTitle className="text-sm font-medium">
                  {t("pages.contact.hours")}
                </CardTitle>
              </div>
              <CardDescription className="text-base font-semibold text-foreground">
                {t("pages.contact.hoursValue")}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}

      {config.note ? (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap rounded-lg border bg-muted/30 px-4 py-3">
          {config.note}
        </p>
      ) : null}

      <Card className="border-dashed bg-muted/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            {t("pages.contact.ticketsTitle")}
          </CardTitle>
          <CardDescription>{t("pages.contact.ticketsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="default">
            <Link to="/support">{t("pages.contact.ticketsCta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
