import { Store } from "lucide-react";
import { STOREFRONT_STATUS } from "./storefrontShopContext.js";

const TEXT = {
  [STOREFRONT_STATUS.NOT_FOUND]: {
    title: "Không tìm thấy cửa hàng",
    desc: "Đường dẫn không tồn tại hoặc cửa hàng đã bị xoá.",
  },
  [STOREFRONT_STATUS.DISABLED]: {
    title: "Cửa hàng chưa mở bán online",
    desc: "Chủ cửa hàng chưa bật chế độ bán hàng online. Vui lòng liên hệ trực tiếp với cửa hàng.",
  },
};

export default function StorefrontUnavailable({ status, slug }) {
  const t = TEXT[status] || TEXT[STOREFRONT_STATUS.NOT_FOUND];
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
      <div className="max-w-md w-full bg-background border rounded-xl shadow-sm p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Store className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold mb-1">{t.title}</h1>
        <p className="text-sm text-muted-foreground mb-4">{t.desc}</p>
        {slug && (
          <p className="text-xs font-mono text-muted-foreground/80 bg-muted rounded px-2 py-1 inline-block">
            /s/{slug}
          </p>
        )}
      </div>
    </div>
  );
}
