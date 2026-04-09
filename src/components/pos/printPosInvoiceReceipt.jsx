import { renderToStaticMarkup } from "react-dom/server";
import { PosInvoiceReceipt } from "./PosInvoiceReceipt";

export function printPosInvoiceReceipt(props) {
  const markup = renderToStaticMarkup(<PosInvoiceReceipt {...props} />);
  const iframe = document.createElement("iframe");
  iframe.setAttribute(
    "style",
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none",
  );
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  doc.open();
  const title = props.isDraft
    ? "Hóa đơn dự thảo"
    : `Hóa đơn ${props.order?.id || ""}`;
  doc.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title}</title><style>@page{margin:10mm}body{margin:0;background:#fff}</style></head><body>${markup}</body></html>`,
  );
  doc.close();
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 800);
  };
}
