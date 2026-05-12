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
    const win = iframe.contentWindow;
    const d = iframe.contentDocument;
    const imgs = d ? Array.from(d.images || []) : [];

    const runPrint = () => {
      win?.focus();
      win?.print();
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 800);
    };

    if (imgs.length === 0) {
      runPrint();
      return;
    }

    Promise.all(
      imgs.map(
        (img) =>
          img.complete && img.naturalWidth > 0
            ? Promise.resolve()
            : new Promise((resolve) => {
                const done = () => resolve();
                img.addEventListener("load", done, { once: true });
                img.addEventListener("error", done, { once: true });
              }),
      ),
    )
      .catch(() => {})
      .finally(() => {
        requestAnimationFrame(() => runPrint());
      });
  };
}
