import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createStorefrontOrder } from "@/api/storefrontApi.js";
import { useStorefrontShop } from "@/layouts/storefront/useStorefrontShop.js";
import { useStorefrontCart } from "@/hooks/useStorefrontCart.js";
import { formatCurrency } from "./storefrontUtils.js";
import { useAuth } from "@/hooks/useAuth.js";

const initialForm = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  addressLine: "",
  ward: "",
  district: "",
  province: "",
  note: "",
};

export default function StorefrontCheckoutPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { shop } = useStorefrontShop();
  const { items, totalAmount, clearCart } = useStorefrontCart();
  const { t, i18n } = useTranslation();
  const moneyLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";
  const { user, isUserContextReady } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!isUserContextReady || !user) return;
    setForm((prev) => ({
      ...prev,
      customerPhone: prev.customerPhone || user.phone || "",
      customerName:
        prev.customerName ||
        user.fullName ||
        [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
        "",
      customerEmail: prev.customerEmail || user.email || "",
    }));
  }, [isUserContextReady, user]);

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          {t("pages.storefront.checkout.empty")}
        </p>
        <Button asChild>
          <Link to={`/s/${slug}`}>{t("pages.storefront.checkout.backShop")}</Link>
        </Button>
      </div>
    );
  }

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const phoneOk = /^[0-9+\-.\s()]{8,20}$/.test(form.customerPhone.trim());
  const validations = {
    customerName: form.customerName.trim().length >= 2,
    customerPhone: phoneOk,
    addressLine: form.addressLine.trim().length >= 3,
  };
  const formValid = Object.values(validations).every(Boolean);

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!formValid) {
      toast.error(t("pages.storefront.checkout.toastFill"));
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        customerEmail: form.customerEmail.trim() || null,
        addressLine: form.addressLine.trim(),
        ward: form.ward.trim() || null,
        district: form.district.trim() || null,
        province: form.province.trim() || null,
        note: form.note.trim() || null,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId || null,
          quantity: i.quantity,
        })),
      };
      const data = await createStorefrontOrder(slug, payload);
      toast.success(t("pages.storefront.checkout.toastSuccess"));
      clearCart();
      const code = data?.orderCode || data?.id || "";
      navigate(`/s/${slug}/order-success/${encodeURIComponent(code)}`, {
        state: { order: data },
        replace: true,
      });
    } catch (err) {
      toast.error(
        err?.message || t("pages.storefront.checkout.toastFail"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to={`/s/${slug}/cart`}>
          <ArrowLeft className="h-4 w-4 mr-1" />{" "}
          {t("pages.storefront.checkout.backCart")}
        </Link>
      </Button>

      <h1 className="text-xl font-bold mb-4">
        {t("pages.storefront.checkout.title")}
      </h1>

      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <section className="bg-background border rounded-lg p-4 space-y-3">
            <h2 className="font-semibold text-sm">
              {t("pages.storefront.checkout.recipient")}
            </h2>
            <Field
              label={t("pages.storefront.checkout.nameLabel")}
              value={form.customerName}
              onChange={setField("customerName")}
              error={
                touched && !validations.customerName
                  ? t("pages.storefront.checkout.nameError")
                  : null
              }
              placeholder={t("pages.storefront.checkout.namePlaceholder")}
            />
            <Field
              label={t("pages.storefront.checkout.phoneLabel")}
              value={form.customerPhone}
              onChange={setField("customerPhone")}
              error={
                touched && !validations.customerPhone
                  ? t("pages.storefront.checkout.phoneError")
                  : null
              }
              placeholder={t("pages.storefront.checkout.phonePlaceholder")}
              inputMode="tel"
            />
            <Field
              label={t("pages.storefront.checkout.emailLabel")}
              value={form.customerEmail}
              onChange={setField("customerEmail")}
              placeholder={t("pages.storefront.checkout.emailPlaceholder")}
              type="email"
            />
          </section>

          <section className="bg-background border rounded-lg p-4 space-y-3">
            <h2 className="font-semibold text-sm">
              {t("pages.storefront.checkout.addressSection")}
            </h2>
            <Field
              label={t("pages.storefront.checkout.addressLineLabel")}
              value={form.addressLine}
              onChange={setField("addressLine")}
              error={
                touched && !validations.addressLine
                  ? t("pages.storefront.checkout.addressLineError")
                  : null
              }
              placeholder={t("pages.storefront.checkout.addressLinePlaceholder")}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field
                label={t("pages.storefront.checkout.wardLabel")}
                value={form.ward}
                onChange={setField("ward")}
                placeholder={t("pages.storefront.checkout.wardPlaceholder")}
              />
              <Field
                label={t("pages.storefront.checkout.districtLabel")}
                value={form.district}
                onChange={setField("district")}
                placeholder={t(
                  "pages.storefront.checkout.districtPlaceholder",
                )}
              />
              <Field
                label={t("pages.storefront.checkout.provinceLabel")}
                value={form.province}
                onChange={setField("province")}
                placeholder={t(
                  "pages.storefront.checkout.provincePlaceholder",
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("pages.storefront.checkout.noteLabel")}
              </Label>
              <Textarea
                value={form.note}
                onChange={setField("note")}
                placeholder={t("pages.storefront.checkout.notePlaceholder")}
                rows={3}
              />
            </div>
          </section>

          <section className="bg-background border rounded-lg p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {t("pages.storefront.checkout.codTitle")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("pages.storefront.checkout.codDesc")}
              </p>
            </div>
          </section>
        </div>

        <aside className="lg:col-span-1">
          <div className="bg-background border rounded-lg p-4 space-y-3 lg:sticky lg:top-20">
            <h2 className="font-semibold text-sm">
              {t("pages.storefront.checkout.orderTitle", {
                count: items.length,
              })}
            </h2>
            <ul className="space-y-2 text-sm max-h-72 overflow-auto pr-1">
              {items.map((line) => (
                <li
                  key={`${line.productId}:${line.variantId || ""}`}
                  className="flex justify-between gap-3"
                >
                  <span className="min-w-0">
                    <span className="font-medium block truncate">
                      {line.productName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {line.variantName ? `${line.variantName} · ` : ""}x
                      {line.quantity}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium">
                    {formatCurrency(
                      line.price * line.quantity,
                      shop.currency,
                      moneyLocale,
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <hr />
            <div className="flex items-center justify-between font-semibold">
              <span>{t("pages.storefront.checkout.total")}</span>
              <span className="text-primary">
                {formatCurrency(totalAmount, shop.currency, moneyLocale)}
              </span>
            </div>
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {submitting
                ? t("pages.storefront.checkout.submitting")
                : t("pages.storefront.checkout.submit")}
            </Button>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Field({ label, error, ...rest }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input {...rest} aria-invalid={!!error} />
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
