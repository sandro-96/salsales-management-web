import React, { useMemo } from "react";
import {
  orderLineAttributesLabel,
  orderLineToppings,
  orderLineVariantLabel,
} from "../../utils/orderItemDisplay.js";
import { posNumberLocale } from "../../utils/posHelpers.js";
import { getInvoiceT } from "../../utils/invoiceI18n.js";
import { normalizeInvoiceLocale } from "../../utils/invoiceLocale.js";

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "8px",
  fontSize: "11px",
  lineHeight: 1.45,
  marginBottom: "4px",
};

const labelMuted = { color: "#555" };

/**
 * H├│a ─æ╞ín POS ΓÇö style inline ─æß╗â in qua iframe / renderToStaticMarkup.
 */
export function PosInvoiceReceipt({
  invoiceLocale = "vi",
  shopName,
  shopAddress,
  shopPhone,
  branchName,
  branchWifiSsid,
  branchWifiPassword,
  order,
  customerName,
  tableName,
  paymentMethodLabel,
  printedAt,
  isDraft = false,
}) {
  const lng = normalizeInvoiceLocale(invoiceLocale);
  const t = useMemo(() => getInvoiceT(lng), [lng]);
  const locale = posNumberLocale(lng);

  const fmtMoney = (n) =>
    Number(n ?? 0).toLocaleString(locale, { maximumFractionDigits: 0 });

  const fmtDateTime = (v) => {
    if (!v) return new Date().toLocaleString(locale);
    if (typeof v === "string") {
      return v.replace("T", " ").slice(0, 19);
    }
    try {
      return new Date(v).toLocaleString(locale);
    } catch {
      return String(v);
    }
  };

  const items = order?.items || [];
  const tax = order?.taxSnapshot;
  const taxes = tax?.taxes || [];

  return (
    <div
      style={{
        maxWidth: "360px",
        margin: "0 auto",
        padding: "12px 16px 20px",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        fontSize: "12px",
        color: "#0a0a0a",
        background: "#fff",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <div
          style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "0.02em" }}
        >
          {shopName || t("pages.pos.receipt.shopFallback")}
        </div>
        {branchName ? (
          <div style={{ fontSize: "11px", marginTop: "2px", ...labelMuted }}>
            {branchName}
          </div>
        ) : null}
        {shopAddress ? (
          <div style={{ fontSize: "10px", marginTop: "4px", ...labelMuted }}>
            {shopAddress}
          </div>
        ) : null}
        {shopPhone ? (
          <div style={{ fontSize: "10px", marginTop: "2px", ...labelMuted }}>
            {t("pages.pos.receipt.phonePrefix")} {shopPhone}
          </div>
        ) : null}
      </div>

      <div
        style={{
          textAlign: "center",
          fontWeight: 700,
          fontSize: "12px",
          letterSpacing: "0.12em",
          borderTop: "1px dashed #ccc",
          borderBottom: "1px dashed #ccc",
          padding: "8px 0",
          marginBottom: "10px",
        }}
      >
        {t("pages.pos.receipt.salesInvoiceTitle")}
      </div>

      {isDraft ? (
        <div
          style={{
            textAlign: "center",
            fontSize: "10px",
            fontWeight: 700,
            color: "#a16207",
            background: "#fef9c3",
            border: "1px solid #fde047",
            borderRadius: "4px",
            padding: "6px 8px",
            marginBottom: "10px",
            letterSpacing: "0.04em",
          }}
        >
          {t("pages.pos.receipt.previewBanner")}
        </div>
      ) : null}

      <div style={{ ...rowStyle, fontSize: "10px" }}>
        <span style={labelMuted}>{t("pages.pos.receipt.orderCodeLabel")}</span>
        <span
          style={{
            fontWeight: 600,
            textAlign: "right",
            wordBreak: "break-all",
          }}
        >
          {isDraft
            ? t("pages.pos.receipt.willCreateOnConfirm")
            : order?.orderCode?.trim() || order?.id || "—"}
        </span>
      </div>
      <div style={{ ...rowStyle, fontSize: "10px" }}>
        <span style={labelMuted}>
          {isDraft
            ? t("pages.pos.receipt.timePreviewAt")
            : order?.paid && order?.paymentTime
              ? t("pages.pos.receipt.timePaidAt")
              : t("pages.pos.receipt.timePrintedAt")}
        </span>
        <span>
          {!isDraft && order?.paid && order?.paymentTime
            ? fmtDateTime(order.paymentTime)
            : fmtDateTime(printedAt)}
        </span>
      </div>
      {tableName ? (
        <div style={{ ...rowStyle, fontSize: "10px" }}>
          <span style={labelMuted}>{t("pages.pos.receipt.tableLabel")}</span>
          <span>{tableName}</span>
        </div>
      ) : null}
      {customerName ? (
        <div style={{ ...rowStyle, fontSize: "10px" }}>
          <span style={labelMuted}>{t("pages.pos.receipt.crmCustomerLabel")}</span>
          <span style={{ textAlign: "right" }}>{customerName}</span>
        </div>
      ) : null}
      {(order?.guestName && String(order.guestName).trim()) ||
      (order?.guestPhone && String(order.guestPhone).trim()) ? (
        <>
          {order?.guestName && String(order.guestName).trim() ? (
            <div style={{ ...rowStyle, fontSize: "10px" }}>
              <span style={labelMuted}>{t("pages.pos.receipt.guestNameLabel")}</span>
              <span style={{ textAlign: "right", wordBreak: "break-word" }}>
                {String(order.guestName).trim()}
              </span>
            </div>
          ) : null}
          {order?.guestPhone && String(order.guestPhone).trim() ? (
            <div style={{ ...rowStyle, fontSize: "10px" }}>
              <span style={labelMuted}>{t("pages.pos.receipt.guestPhoneLabel")}</span>
              <span style={{ textAlign: "right", wordBreak: "break-all" }}>
                {String(order.guestPhone).trim()}
              </span>
            </div>
          ) : null}
        </>
      ) : null}

      <div
        style={{
          borderTop: "1px dashed #ccc",
          margin: "10px 0 8px",
          paddingTop: "8px",
        }}
      />

      {items.map((item, idx) => {
        const unit = item.priceAfterDiscount ?? item.price ?? 0;
        const isWeight = !!item.sellByWeight;
        const qtyMultiplier = isWeight
          ? Number(item.weight ?? 0)
          : (item.quantity ?? 0);
        const weightUnit = item.weightUnit || "";
        const qtyLabel = isWeight
          ? `${Number(item.weight ?? 0).toLocaleString(locale, {
              maximumFractionDigits: 3,
            })} ${weightUnit}`.trim()
          : String(item.quantity ?? 0);
        const gross = (item.price ?? 0) * qtyMultiplier;
        const line = unit * qtyMultiplier;
        const hasDisc = item.price != null && unit < item.price;
        const tops = orderLineToppings(item);
        const vLine = orderLineVariantLabel(item);
        const attrLine = orderLineAttributesLabel(item);
        const showAttr =
          attrLine && attrLine !== (item.variantName || "").trim();
        return (
          <div
            key={`${item.productId}-${idx}`}
            style={{ marginBottom: "10px" }}
          >
            <div style={{ fontWeight: 600, fontSize: "11px" }}>
              {item.productName}
            </div>
            {vLine ? (
              <div style={{ fontSize: "10px", color: "#555", marginTop: "2px" }}>
                {vLine}
              </div>
            ) : null}
            {showAttr ? (
              <div style={{ fontSize: "10px", color: "#555", marginTop: "2px" }}>
                {t("pages.pos.receipt.attributesPrefix")} {attrLine}
              </div>
            ) : null}
            {tops.length > 0 ? (
              <div style={{ fontSize: "10px", color: "#555", marginTop: "2px" }}>
                {tops.map((top, ti) => (
                  <div key={`${top.toppingId || ti}`}>
                    + {top.name || top.toppingId}
                    {Number(t.extraPrice) > 0
                      ? ` (${fmtMoney(top.extraPrice)} ₫)`
                      : ""}
                  </div>
                ))}
              </div>
            ) : null}
            <div style={{ ...rowStyle, marginBottom: 0 }}>
              <span style={labelMuted}>
                {fmtMoney(unit)}
                {isWeight && weightUnit ? `/${weightUnit}` : ""} × {qtyLabel}
              </span>
              <span style={{ fontWeight: 600 }}>{fmtMoney(line)} ₫</span>
            </div>
            {hasDisc ? (
              <div style={{ fontSize: "10px", color: "#16a34a" }}>
                {t("pages.pos.receipt.originalPriceLine", {
                  amount: fmtMoney(gross),
                })}
              </div>
            ) : null}
          </div>
        );
      })}

      <div style={{ borderTop: "1px dashed #ccc", margin: "10px 0" }} />

      <div style={rowStyle}>
        <span style={labelMuted}>{t("pages.pos.receipt.merchandiseTotal")}</span>
        <span style={{ fontWeight: 600 }}>{fmtMoney(order?.totalPrice)} ₫</span>
      </div>

      {(order?.pointsRedeemed ?? 0) > 0 && (order?.pointsDiscount ?? 0) > 0 ? (
        <div style={rowStyle}>
          <span style={labelMuted}>
            {t("pages.pos.receipt.pointsDiscountLine", {
              points: order.pointsRedeemed,
            })}
          </span>
          <span style={{ fontWeight: 600, color: "#16a34a" }}>
            -{fmtMoney(order.pointsDiscount)} ₫
          </span>
        </div>
      ) : null}

      {tax?.priceIncludesTax ? (
        <div style={{ fontSize: "10px", color: "#666", marginBottom: "6px" }}>
          {t("pages.pos.receipt.priceIncludesTaxReceipt")}
        </div>
      ) : null}

      {taxes.map((line, idx) => (
        <div key={`${line.code}-${idx}`} style={rowStyle}>
          <span style={labelMuted}>
            {line.label || line.code || t("pages.pos.receipt.taxFallback")}
            {line.rate > 0 && line.rate <= 1
              ? ` (${(line.rate * 100).toLocaleString(locale)}%)`
              : ""}
          </span>
          <span>{fmtMoney(line.amount)} ₫</span>
        </div>
      ))}

      {taxes.length === 0 && (!tax || tax.taxTotal === 0) ? (
        <div style={rowStyle}>
          <span style={labelMuted}>{t("pages.pos.receipt.taxFallback")}</span>
          <span>0 ₫</span>
        </div>
      ) : null}

      <div
        style={{
          ...rowStyle,
          marginTop: "10px",
          paddingTop: "10px",
          borderTop: "2px solid #111",
          fontSize: "13px",
          fontWeight: 700,
        }}
      >
        <span>{t("pages.pos.receipt.totalPayment")}</span>
        <span>{fmtMoney(order?.totalAmount)} ₫</span>
      </div>

      {paymentMethodLabel ? (
        <div style={{ ...rowStyle, marginTop: "8px" }}>
          <span style={labelMuted}>{t("pages.pos.receipt.paymentRow")}</span>
          <span>{paymentMethodLabel}</span>
        </div>
      ) : null}

      {!isDraft && order?.paymentProofImageUrl ? (
        <div
          style={{
            marginTop: "10px",
            paddingTop: "10px",
            borderTop: "1px dashed #ccc",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "#333",
              marginBottom: "6px",
            }}
          >
            {t("pages.pos.receipt.paymentProofCaption")}
          </div>
          <img
            src={order.paymentProofImageUrl}
            alt=""
            style={{
              display: "block",
              width: "100%",
              maxWidth: "320px",
              maxHeight: "220px",
              margin: "0 auto",
              objectFit: "contain",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
        </div>
      ) : null}

      <div style={{ ...rowStyle, marginTop: "4px" }}>
        <span style={labelMuted}>{t("pages.pos.receipt.statusLabel")}</span>
        <span style={{ fontWeight: order?.paid ? 600 : 500 }}>
          {isDraft
            ? t("pages.pos.receipt.draftStatus")
            : order?.paid
              ? t("pages.pos.receipt.paidStatus")
              : t("pages.pos.receipt.unpaidStatus")}
        </span>
      </div>

      {order?.note ? (
        <div style={{ marginTop: "10px", fontSize: "10px", ...labelMuted }}>
          <div style={{ fontWeight: 600, color: "#333" }}>{t("pages.pos.receipt.noteLabel")}</div>
          <div style={{ whiteSpace: "pre-wrap" }}>{order.note}</div>
        </div>
      ) : null}

      {branchWifiSsid?.trim() || branchWifiPassword?.trim() ? (
        <div
          style={{
            marginTop: "12px",
            paddingTop: "10px",
            borderTop: "1px dashed #ccc",
            fontSize: "10px",
            ...labelMuted,
          }}
        >
          <div style={{ fontWeight: 700, color: "#333", marginBottom: "4px" }}>{t("pages.pos.receipt.wifiTitle")}</div>
          {branchWifiSsid?.trim() ? (
            <div style={rowStyle}>
              <span>{t("pages.pos.receipt.wifiSsid")}</span>
              <span style={{ fontWeight: 600, textAlign: "right" }}>
                {String(branchWifiSsid).trim()}
              </span>
            </div>
          ) : null}
          {branchWifiPassword?.trim() ? (
            <div style={rowStyle}>
              <span>{t("pages.pos.receipt.wifiPassword")}</span>
              <span style={{ fontWeight: 600, textAlign: "right" }}>
                {String(branchWifiPassword).trim()}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        style={{
          textAlign: "center",
          marginTop: "16px",
          fontSize: "10px",
          color: "#888",
        }}
      >
        {isDraft
          ? t("pages.pos.receipt.draftFooter")
          : t("pages.pos.receipt.thankYouFooter")}
      </div>
    </div>
  );
}
