function escapeHtml(value) {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * HTML in tem QR bàn nhỏ (dán tại bàn): tên shop, bàn, QR, Wi‑Fi, CK.
 */
export function buildTableQrPrintHtml({
  shopName,
  shopAddress,
  tableName,
  qrDataUrl,
  wifiSsid,
  wifiPassword,
  paymentBankName,
  paymentAccountNumber,
  paymentAccountHolder,
  paymentTransferNote,
  labels,
}) {
  const L = labels || {};
  const extras = [];

  if (wifiSsid?.trim()) {
    const pwd = wifiPassword?.trim()
      ? ` · ${escapeHtml(L.wifiPassword)}: <strong>${escapeHtml(wifiPassword.trim())}</strong>`
      : "";
    extras.push(
      `<p class="line"><span class="muted">${escapeHtml(L.wifi)}:</span> <strong>${escapeHtml(wifiSsid.trim())}</strong>${pwd}</p>`,
    );
  }

  if (paymentBankName?.trim() || paymentAccountNumber?.trim()) {
    const parts = [];
    if (paymentBankName?.trim()) {
      parts.push(`<strong>${escapeHtml(paymentBankName.trim())}</strong>`);
    }
    if (paymentAccountNumber?.trim()) {
      parts.push(
        `<span class="mono">${escapeHtml(paymentAccountNumber.trim())}</span>`,
      );
    }
    if (paymentAccountHolder?.trim()) {
      parts.push(escapeHtml(paymentAccountHolder.trim()));
    }
    extras.push(
      `<p class="line"><span class="muted">${escapeHtml(L.transfer)}:</span> ${parts.join(" · ")}</p>`,
    );
  }

  if (paymentTransferNote?.trim()) {
    extras.push(
      `<p class="line note">${escapeHtml(paymentTransferNote.trim())}</p>`,
    );
  }

  const addressLine = shopAddress?.trim()
    ? `<p class="line address">${escapeHtml(shopAddress.trim())}</p>`
    : "";

  const extrasBlock =
    extras.length > 0 ? `<div class="extras">${extras.join("")}</div>` : "";

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(tableName || "QR")}</title>
  <style>
    @page { size: 90mm 120mm; margin: 5mm; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      color: #111;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 4mm;
      min-height: auto;
    }
    .tent {
      width: 78mm;
      max-width: 78mm;
      padding: 5mm 4mm 4mm;
      text-align: center;
    }
    .shop {
      font-size: 13px;
      font-weight: 700;
      line-height: 1.25;
      margin: 0 0 3px;
    }
    .table {
      font-size: 12px;
      font-weight: 600;
      margin: 0 0 4px;
      color: #222;
    }
    .scan {
      font-size: 8.5px;
      color: #555;
      margin: 0 0 5px;
      line-height: 1.3;
    }
    .qr-wrap {
      margin: 0 auto 5px;
      line-height: 0;
    }
    .qr-wrap img {
      width: 34mm;
      height: 34mm;
      object-fit: contain;
    }
    .address {
      font-size: 8px;
      color: #666;
      line-height: 1.35;
      margin: 0 0 4px !important;
    }
    .extras { margin: 2px 0 4px; }
    .line {
      font-size: 8.5px;
      line-height: 1.4;
      margin: 3px 0;
      text-align: center;
    }
    .line .muted { color: #666; font-weight: 500; }
    .line.note { font-style: italic; color: #555; }
    .mono {
      font-family: ui-monospace, monospace;
      letter-spacing: 0.03em;
    }
    .footer {
      font-size: 8px;
      color: #666;
      margin: 4px 0 0;
      font-style: italic;
      line-height: 1.35;
    }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="tent">
    <p class="shop">${escapeHtml(shopName || "")}</p>
    <p class="table">${escapeHtml(L.table || "Bàn")}: ${escapeHtml(tableName || "")}</p>
    <p class="scan">${escapeHtml(L.scanHint || "")}</p>
    <div class="qr-wrap"><img src="${qrDataUrl}" alt="QR"/></div>
    ${addressLine}
    ${extrasBlock}
    <p class="footer">${escapeHtml(L.payAtCounter || "")}</p>
  </div>
  <script>setTimeout(function(){window.print();}, 350);</script>
</body>
</html>`;
}

export function openTableQrPrintWindow(params) {
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(buildTableQrPrintHtml(params));
  win.document.close();
  return true;
}
