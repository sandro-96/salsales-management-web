import React from "react";

const fmtMoney = (n) =>
  Number(n ?? 0).toLocaleString("vi-VN", { maximumFractionDigits: 0 });

const fmtDateTime = (v) => {
  if (!v) return new Date().toLocaleString("vi-VN");
  if (typeof v === "string") {
    const s = v.replace("T", " ").slice(0, 19);
    return s;
  }
  try {
    return new Date(v).toLocaleString("vi-VN");
  } catch {
    return String(v);
  }
};

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
 * Hóa đơn POS — style inline để in qua iframe / renderToStaticMarkup.
 */
export function PosInvoiceReceipt({
  shopName,
  shopAddress,
  shopPhone,
  branchName,
  order,
  customerName,
  tableName,
  paymentMethodLabel,
  printedAt,
  isDraft = false,
}) {
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
          {shopName || "Cửa hàng"}
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
            ĐT: {shopPhone}
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
        HÓA ĐƠN BÁN HÀNG
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
          XEM TRƯỚC — CHƯA LẬP ĐƠN
        </div>
      ) : null}

      <div style={{ ...rowStyle, fontSize: "10px" }}>
        <span style={labelMuted}>Mã đơn hàng</span>
        <span
          style={{
            fontWeight: 600,
            textAlign: "right",
            wordBreak: "break-all",
          }}
        >
          {isDraft
            ? "Sẽ tạo khi xác nhận"
            : order?.orderCode?.trim() || order?.id || "—"}
        </span>
      </div>
      <div style={{ ...rowStyle, fontSize: "10px" }}>
        <span style={labelMuted}>
          {isDraft
            ? "Xem trước lúc"
            : order?.paid && order?.paymentTime
              ? "Thanh toán lúc"
              : "Thời gian in"}
        </span>
        <span>
          {!isDraft && order?.paid && order?.paymentTime
            ? fmtDateTime(order.paymentTime)
            : fmtDateTime(printedAt)}
        </span>
      </div>
      {tableName ? (
        <div style={{ ...rowStyle, fontSize: "10px" }}>
          <span style={labelMuted}>Bàn</span>
          <span>{tableName}</span>
        </div>
      ) : null}
      {customerName ? (
        <div style={{ ...rowStyle, fontSize: "10px" }}>
          <span style={labelMuted}>Khách hàng</span>
          <span style={{ textAlign: "right" }}>{customerName}</span>
        </div>
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
        const gross = (item.price ?? 0) * (item.quantity ?? 0);
        const line = unit * (item.quantity ?? 0);
        const hasDisc = item.price != null && unit < item.price;
        return (
          <div
            key={`${item.productId}-${idx}`}
            style={{ marginBottom: "10px" }}
          >
            <div style={{ fontWeight: 600, fontSize: "11px" }}>
              {item.productName}
            </div>
            <div style={{ ...rowStyle, marginBottom: 0 }}>
              <span style={labelMuted}>
                {fmtMoney(unit)} × {item.quantity}
              </span>
              <span style={{ fontWeight: 600 }}>{fmtMoney(line)} ₫</span>
            </div>
            {hasDisc ? (
              <div style={{ fontSize: "10px", color: "#16a34a" }}>
                (Giá gốc {fmtMoney(gross)} ₫)
              </div>
            ) : null}
          </div>
        );
      })}

      <div style={{ borderTop: "1px dashed #ccc", margin: "10px 0" }} />

      <div style={rowStyle}>
        <span style={labelMuted}>Tiền hàng</span>
        <span style={{ fontWeight: 600 }}>{fmtMoney(order?.totalPrice)} ₫</span>
      </div>

      {(order?.pointsRedeemed ?? 0) > 0 && (order?.pointsDiscount ?? 0) > 0 ? (
        <div style={rowStyle}>
          <span style={labelMuted}>
            Giảm điểm ({order.pointsRedeemed} điểm)
          </span>
          <span style={{ fontWeight: 600, color: "#16a34a" }}>
            -{fmtMoney(order.pointsDiscount)} ₫
          </span>
        </div>
      ) : null}

      {tax?.priceIncludesTax ? (
        <div style={{ fontSize: "10px", color: "#666", marginBottom: "6px" }}>
          Giá đã bao gồm thuế (theo chính sách).
        </div>
      ) : null}

      {taxes.map((line, idx) => (
        <div key={`${line.code}-${idx}`} style={rowStyle}>
          <span style={labelMuted}>
            {line.label || line.code || "Thuế"}
            {line.rate > 0 && line.rate <= 1
              ? ` (${(line.rate * 100).toLocaleString("vi-VN")}%)`
              : ""}
          </span>
          <span>{fmtMoney(line.amount)} ₫</span>
        </div>
      ))}

      {taxes.length === 0 && (!tax || tax.taxTotal === 0) ? (
        <div style={rowStyle}>
          <span style={labelMuted}>Thuế</span>
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
        <span>TỔNG THANH TOÁN</span>
        <span>{fmtMoney(order?.totalAmount)} ₫</span>
      </div>

      {paymentMethodLabel ? (
        <div style={{ ...rowStyle, marginTop: "8px" }}>
          <span style={labelMuted}>Thanh toán</span>
          <span>{paymentMethodLabel}</span>
        </div>
      ) : null}

      <div style={{ ...rowStyle, marginTop: "4px" }}>
        <span style={labelMuted}>Trạng thái</span>
        <span style={{ fontWeight: order?.paid ? 600 : 500 }}>
          {isDraft
            ? "Dự thảo"
            : order?.paid
              ? "Đã thanh toán"
              : "Chưa thanh toán"}
        </span>
      </div>

      {order?.note ? (
        <div style={{ marginTop: "10px", fontSize: "10px", ...labelMuted }}>
          <div style={{ fontWeight: 600, color: "#333" }}>Ghi chú</div>
          <div style={{ whiteSpace: "pre-wrap" }}>{order.note}</div>
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
          ? "Bản xem trước — số liệu sẽ khớp khi bạn xác nhận thanh toán."
          : "Cảm ơn quý khách. Hẹn gặp lại!"}
      </div>
    </div>
  );
}
