import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { enUS, vi } from "date-fns/locale";
import { ExternalLink, Loader2, MapPin, Package, RefreshCw, User } from "lucide-react";
import { getUserOrderHistory } from "@/api/userApi.js";
import { resolveApiError } from "@/utils/apiMessage.js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/pages/storefront/storefrontUtils.js";

const PHONE_REQUIRED_CODE = "4182";

function orderStatusVariant(status) {
  switch (status) {
    case "COMPLETED":
      return "default";
    case "CANCELLED":
      return "destructive";
    case "SHIPPING":
    case "CONFIRMED":
      return "secondary";
    default:
      return "outline";
  }
}

function OrderHistoryCard({ order, t, dateLocale, moneyLocale }) {
  const items = Array.isArray(order.items) ? order.items : [];
  const hasRecipient =
    order.customerName || order.customerPhone || order.customerEmail;
  const hasAddress = Boolean(order.shippingAddress?.trim());
  const hasNote = Boolean(order.customerNote?.trim());

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-sm">
              {order.orderCode || order.id}
            </p>
            <p className="text-xs text-muted-foreground">
              {order.shopName || t("history.unknownShop")}
              {order.createdAt
                ? ` · ${format(new Date(order.createdAt), "dd/MM/yyyy HH:mm", {
                    locale: dateLocale,
                  })}`
                : null}
            </p>
          </div>
          <Badge variant={orderStatusVariant(order.status)}>
            {t(`overview.orderStatus.${order.status}`, order.status)}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">
            {t("history.itemCount", {
              count: order.itemCount ?? items.length,
            })}
            {order.paymentMethod ? ` · ${order.paymentMethod}` : null}
          </span>
          <span className="font-semibold tabular-nums">
            {formatCurrency(order.totalAmount, "VND", moneyLocale)}
          </span>
        </div>

        {(hasRecipient || hasAddress || hasNote || items.length > 0) && (
          <Separator />
        )}

        {hasRecipient ? (
          <div className="space-y-1 text-sm">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <User className="size-3.5" />
              {t("history.recipient")}
            </p>
            {order.customerName ? (
              <p className="font-medium">{order.customerName}</p>
            ) : null}
            <p className="text-muted-foreground text-xs leading-relaxed">
              {order.customerPhone ? (
                <span>
                  {t("history.phone")}: {order.customerPhone}
                </span>
              ) : null}
              {order.customerPhone && order.customerEmail ? " · " : null}
              {order.customerEmail ? (
                <span>
                  {t("history.email")}: {order.customerEmail}
                </span>
              ) : null}
            </p>
          </div>
        ) : null}

        {hasAddress ? (
          <div className="space-y-1 text-sm">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <MapPin className="size-3.5" />
              {t("history.shippingAddress")}
            </p>
            <p className="text-sm leading-relaxed">{order.shippingAddress}</p>
          </div>
        ) : null}

        {items.length > 0 ? (
          <div className="space-y-2 text-sm">
            <p className="text-xs font-medium text-muted-foreground">
              {t("history.products")}
            </p>
            <ul className="space-y-2 rounded-md border bg-muted/30 px-3 py-2">
              {items.map((line, idx) => (
                <li
                  key={`${line.productName}-${idx}`}
                  className="flex flex-wrap items-start justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug">
                      {line.productName || "—"}
                      {line.variantName ? (
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          {t("history.variant", { name: line.variantName })}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("history.qty", { count: line.quantity ?? 1 })}
                      {line.sku ? ` · ${line.sku}` : null}
                    </p>
                  </div>
                  <span className="shrink-0 tabular-nums text-sm font-medium">
                    {formatCurrency(
                      line.lineTotal ?? line.unitPrice * (line.quantity || 1),
                      "VND",
                      moneyLocale,
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {hasNote ? (
          <div className="space-y-1 text-sm">
            <p className="text-xs font-medium text-muted-foreground">
              {t("history.customerNote")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {order.customerNote}
            </p>
          </div>
        ) : null}

        {order.shopSlug ? (
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <a
              href={`/s/${order.shopSlug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("history.visitShop")}
              <ExternalLink className="ml-1 size-3.5" />
            </a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

const HistoryPage = () => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith("en") ? enUS : vi;
  const moneyLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";

  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [phoneRequired, setPhoneRequired] = useState(false);
  const [error, setError] = useState("");

  const fetchPage = useCallback(
    async (pageIndex, append = false) => {
      try {
        if (append) setLoadingMore(true);
        else setLoading(true);
        setError("");
        setPhoneRequired(false);

        const res = await getUserOrderHistory({ page: pageIndex, size: 20 });
        const data = res.data?.data;
        const content = data?.content ?? [];
        setOrders((prev) => (append ? [...prev, ...content] : content));
        setTotalPages(data?.totalPages ?? 0);
        setPage(pageIndex);
      } catch (err) {
        const code = err?.response?.data?.code;
        if (code === PHONE_REQUIRED_CODE) {
          setPhoneRequired(true);
          setOrders([]);
        } else {
          setError(resolveApiError(err, t("history.loadError")));
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [t],
  );

  useEffect(() => {
    fetchPage(0, false);
  }, [fetchPage]);

  const hasMore = page + 1 < totalPages;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{t("history.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("history.subtitle")}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : phoneRequired ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("history.noPhoneTitle")}</CardTitle>
            <CardDescription>{t("history.noPhoneDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="success">
              <Link to="/accounts">{t("history.updateProfile")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <p className="text-sm text-destructive text-center">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchPage(0, false)}>
              <RefreshCw className="size-4 mr-1" />
              {t("history.retry")}
            </Button>
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Package className="size-10 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">{t("history.empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <OrderHistoryCard
                order={order}
                t={t}
                dateLocale={dateLocale}
                moneyLocale={moneyLocale}
              />
            </li>
          ))}
        </ul>
      )}

      {!loading && !phoneRequired && !error && hasMore ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            disabled={loadingMore}
            onClick={() => fetchPage(page + 1, true)}
          >
            {loadingMore ? (
              <Loader2 className="size-4 animate-spin mr-1" />
            ) : null}
            {t("history.loadMore")}
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default HistoryPage;
