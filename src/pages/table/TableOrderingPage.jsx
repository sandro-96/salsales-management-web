import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Loader2,
  MapPin,
  Minus,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Trash2,
  Utensils,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getTableCategories,
  getTableContext,
  getTableCurrentOrder,
  getTableProductDetail,
  getTableProducts,
  placeTableOrder,
} from "@/api/tableOrderingApi.js";
import {
  formatCurrency,
  pickProductImage,
  pickVariantImage,
} from "@/pages/storefront/storefrontUtils.js";

const PAGE_SIZE = 24;

const STATUS = {
  LOADING: "LOADING",
  READY: "READY",
  NOT_FOUND: "NOT_FOUND",
  DISABLED: "DISABLED",
};

const TABLE_QR_NOT_FOUND = "4183";
const TABLE_ORDERING_DISABLED = "4184";
const TABLE_INACTIVE = "4185";

function lineKey(item) {
  return `${item.productId}::${item.variantId || ""}`;
}

export default function TableOrderingPage() {
  const { qrToken } = useParams();
  const { t, i18n } = useTranslation();
  const moneyLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";

  const [status, setStatus] = useState(STATUS.LOADING);
  const [context, setContext] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [keyword, setKeyword] = useState("");
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customerNote, setCustomerNote] = useState("");
  const [currentOrder, setCurrentOrder] = useState(null);
  const [currentOrderLoading, setCurrentOrderLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailVariantId, setDetailVariantId] = useState(null);
  const [detailQuantity, setDetailQuantity] = useState(1);

  const loadContext = useCallback(async () => {
    if (!qrToken) {
      setStatus(STATUS.NOT_FOUND);
      return;
    }
    setStatus(STATUS.LOADING);
    try {
      const data = await getTableContext(qrToken);
      setContext(data);
      setStatus(STATUS.READY);
    } catch (err) {
      const code = err?.code || err?.payload?.code;
      setErrorCode(code);
      if (code === TABLE_ORDERING_DISABLED || code === TABLE_INACTIVE) {
        setStatus(STATUS.DISABLED);
      } else {
        setStatus(STATUS.NOT_FOUND);
      }
    }
  }, [qrToken]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await getTableCategories(qrToken);
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    }
  }, [qrToken]);

  const loadProducts = useCallback(
    async (opts = {}) => {
      setProductsLoading(true);
      try {
        const data = await getTableProducts(qrToken, {
          q: opts.q ?? keyword,
          category: opts.category ?? activeCategory,
          page: 0,
          size: PAGE_SIZE,
        });
        setProducts(Array.isArray(data?.content) ? data.content : []);
      } catch {
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    },
    [qrToken, keyword, activeCategory],
  );

  const loadCurrentOrder = useCallback(async () => {
    setCurrentOrderLoading(true);
    try {
      const data = await getTableCurrentOrder(qrToken);
      setCurrentOrder(data || null);
    } catch {
      setCurrentOrder(null);
    } finally {
      setCurrentOrderLoading(false);
    }
  }, [qrToken]);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  useEffect(() => {
    if (status !== STATUS.READY) return;
    loadCategories();
    loadCurrentOrder();
  }, [status, loadCategories, loadCurrentOrder]);

  useEffect(() => {
    if (status !== STATUS.READY) return;
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, activeCategory]);

  const cartSubtotal = useMemo(
    () =>
      cart.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0),
    [cart],
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, it) => sum + it.quantity, 0),
    [cart],
  );

  const onSearchSubmit = (e) => {
    e.preventDefault();
    loadProducts({ q: keyword });
  };

  const openProductDetail = useCallback(
    async (product) => {
      setDetailOpen(true);
      setDetailLoading(true);
      setDetailVariantId(null);
      setDetailQuantity(1);
      try {
        const data = await getTableProductDetail(qrToken, product.id);
        setDetailProduct(data);
        if (data?.variants?.length > 0) {
          setDetailVariantId(data.variants[0].variantId);
        }
      } catch {
        setDetailProduct(null);
        toast.error(t("tableOrdering.productLoadError"));
        setDetailOpen(false);
      } finally {
        setDetailLoading(false);
      }
    },
    [qrToken, t],
  );

  const addCartItem = useCallback(
    (entry) => {
      setCart((prev) => {
        const idx = prev.findIndex((it) => lineKey(it) === lineKey(entry));
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            quantity: next[idx].quantity + entry.quantity,
          };
          return next;
        }
        return [...prev, entry];
      });
      toast.success(t("tableOrdering.addedToCart"));
    },
    [t],
  );

  const removeCartItem = (key) =>
    setCart((prev) => prev.filter((it) => lineKey(it) !== key));

  const updateCartQty = (key, delta) =>
    setCart((prev) =>
      prev
        .map((it) =>
          lineKey(it) === key
            ? { ...it, quantity: Math.max(1, it.quantity + delta) }
            : it,
        )
        .filter((it) => it.quantity > 0),
    );

  const handleDetailAdd = () => {
    if (!detailProduct) return;
    const variant = detailProduct.variants?.find(
      (v) => v.variantId === detailVariantId,
    );
    const hasVariants = detailProduct.variants?.length > 0;
    if (hasVariants && !variant) {
      toast.error(t("tableOrdering.selectVariant"));
      return;
    }
    const unitPrice = variant?.price ?? detailProduct.price ?? 0;
    addCartItem({
      productId: detailProduct.id,
      productName: detailProduct.name,
      variantId: variant?.variantId || null,
      variantName: variant?.name || null,
      image: pickVariantImage(variant, detailProduct),
      unitPrice,
      quantity: Math.max(1, Number(detailQuantity) || 1),
    });
    setDetailOpen(false);
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const payload = {
        items: cart.map((it) => ({
          productId: it.productId,
          variantId: it.variantId || null,
          quantity: it.quantity,
        })),
        customerNote: customerNote || undefined,
      };
      await placeTableOrder(qrToken, payload);
      toast.success(t("tableOrdering.submitSuccess"));
      setCart([]);
      setCustomerNote("");
      setCartOpen(false);
      loadCurrentOrder();
    } catch (err) {
      toast.error(err?.message || t("tableOrdering.submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (status === STATUS.LOADING) {
    return (
      <section className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {t("tableOrdering.loading")}
        </p>
      </section>
    );
  }

  if (status !== STATUS.READY || !context) {
    const isDisabled = status === STATUS.DISABLED;
    return (
      <section className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <Utensils className="size-10 text-muted-foreground/60" />
        <h1 className="text-lg font-semibold">
          {isDisabled
            ? t("tableOrdering.disabledTitle")
            : t("tableOrdering.notFoundTitle")}
        </h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          {isDisabled
            ? t("tableOrdering.disabledDesc")
            : t("tableOrdering.notFoundDesc")}
        </p>
        {errorCode === TABLE_QR_NOT_FOUND ? (
          <Button variant="outline" size="sm" onClick={loadContext}>
            <RefreshCw className="size-4 mr-1" />
            {t("tableOrdering.retry")}
          </Button>
        ) : null}
      </section>
    );
  }

  const { shop, table } = context;

  return (
    <div className="min-h-screen bg-muted/30 pb-28">
      <header className="bg-background border-b sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          {shop.logoUrl ? (
            <img
              src={shop.logoUrl}
              alt={shop.name}
              className="size-10 rounded-md object-cover border"
            />
          ) : (
            <div className="size-10 rounded-md border bg-muted flex items-center justify-center">
              <Utensils className="size-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{shop.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {t("tableOrdering.tableLabel", { name: table.name })}
              {table.branchName ? ` · ${table.branchName}` : ""}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {table.branchAddress ? (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="size-3.5" />
            {table.branchAddress}
          </p>
        ) : null}

        {currentOrder ? (
          <CurrentOrderCard
            order={currentOrder}
            loading={currentOrderLoading}
            onReload={loadCurrentOrder}
            currency={shop.currency}
            moneyLocale={moneyLocale}
            t={t}
          />
        ) : null}

        <form onSubmit={onSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={t("tableOrdering.searchPlaceholder")}
              className="pl-8"
            />
          </div>
          <Button type="submit">{t("tableOrdering.search")}</Button>
        </form>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={activeCategory === "" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setActiveCategory("")}
            >
              {t("tableOrdering.allCategories")}
            </Badge>
            {categories.map((c) => (
              <Badge
                key={c}
                variant={activeCategory === c ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setActiveCategory(c)}
              >
                {c}
              </Badge>
            ))}
          </div>
        )}

        <section>
          {productsLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="size-5 animate-spin mr-2" />
              {t("tableOrdering.loadingProducts")}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground">
              {t("tableOrdering.emptyProducts")}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  currency={shop.currency}
                  moneyLocale={moneyLocale}
                  onPick={() => openProductDetail(p)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {cart.length > 0 && !cartOpen ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                {t("tableOrdering.cartSummary", { count: cartCount })}
              </p>
              <p className="font-semibold tabular-nums">
                {formatCurrency(cartSubtotal, shop.currency, moneyLocale)}
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => setCartOpen(true)}
              className="shrink-0"
            >
              {t("tableOrdering.viewCart")}
            </Button>
          </div>
        </div>
      ) : null}

      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent
          side="bottom"
          className="flex flex-col gap-0 p-0 max-h-[90dvh] overflow-hidden rounded-t-xl"
        >
          <SheetHeader className="shrink-0 border-b px-4 pt-4 pb-3 pr-12">
            <SheetTitle>{t("tableOrdering.cartTitle")}</SheetTitle>
            <SheetDescription>
              {t("tableOrdering.cartSubtitle")}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-3">
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t("tableOrdering.cartEmpty")}
              </p>
            ) : (
              cart.map((it) => {
                const key = lineKey(it);
                return (
                  <div
                    key={key}
                    className="flex items-start gap-3 border rounded-md p-3"
                  >
                    <div className="size-14 rounded-md overflow-hidden bg-muted shrink-0">
                      {it.image ? (
                        <img
                          src={it.image}
                          alt={it.productName}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="size-full flex items-center justify-center">
                          <ShoppingBag className="size-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug">
                        {it.productName}
                        {it.variantName ? (
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            ({it.variantName})
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(
                          it.unitPrice,
                          shop.currency,
                          moneyLocale,
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          onClick={() => updateCartQty(key, -1)}
                        >
                          <Minus className="size-3.5" />
                        </Button>
                        <span className="w-6 text-center text-sm tabular-nums">
                          {it.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          onClick={() => updateCartQty(key, 1)}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 ml-auto text-destructive"
                          onClick={() => removeCartItem(key)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm font-semibold tabular-nums shrink-0">
                      {formatCurrency(
                        it.unitPrice * it.quantity,
                        shop.currency,
                        moneyLocale,
                      )}
                    </p>
                  </div>
                );
              })
            )}

            {cart.length > 0 ? (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-medium">
                  {t("tableOrdering.noteLabel")}
                </p>
                <Textarea
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder={t("tableOrdering.notePlaceholder")}
                  rows={2}
                  maxLength={500}
                />
              </div>
            ) : null}
          </div>

          {cart.length > 0 ? (
            <SheetFooter className="shrink-0 border-t bg-background px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex w-full items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-muted-foreground leading-normal">
                  {t("tableOrdering.subtotal")}
                </span>
                <span className="text-lg font-semibold tabular-nums leading-normal">
                  {formatCurrency(cartSubtotal, shop.currency, moneyLocale)}
                </span>
              </div>
              <Button
                size="lg"
                className="w-full"
                disabled={submitting}
                onClick={handleSubmitOrder}
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin mr-1" />
                ) : null}
                {t("tableOrdering.submitOrder")}
              </Button>
              <p className="text-xs text-muted-foreground text-center w-full">
                {t("tableOrdering.payAtCounterHint")}
              </p>
            </SheetFooter>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {detailProduct?.name || t("tableOrdering.productDetail")}
            </DialogTitle>
            {detailProduct?.category ? (
              <DialogDescription>{detailProduct.category}</DialogDescription>
            ) : null}
          </DialogHeader>

          {detailLoading || !detailProduct ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {pickVariantImage(
                detailProduct.variants?.find(
                  (v) => v.variantId === detailVariantId,
                ),
                detailProduct,
              ) ? (
                <img
                  src={pickVariantImage(
                    detailProduct.variants?.find(
                      (v) => v.variantId === detailVariantId,
                    ),
                    detailProduct,
                  )}
                  alt={detailProduct.name}
                  className="w-full aspect-video object-cover rounded-md border"
                />
              ) : null}

              <p className="text-xl font-bold text-primary">
                {formatCurrency(
                  detailProduct.variants?.find(
                    (v) => v.variantId === detailVariantId,
                  )?.price ?? detailProduct.price,
                  shop.currency,
                  moneyLocale,
                )}
              </p>

              {detailProduct.variants?.length > 0 ? (
                <div>
                  <p className="text-sm font-medium mb-2">
                    {t("tableOrdering.variant")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {detailProduct.variants.map((v) => (
                      <button
                        type="button"
                        key={v.variantId}
                        onClick={() => setDetailVariantId(v.variantId)}
                        className={`px-3 py-1.5 text-sm border rounded-md ${
                          detailVariantId === v.variantId
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted"
                        }`}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">
                  {t("tableOrdering.qty")}
                </p>
                <div className="inline-flex items-center border rounded-md">
                  <button
                    type="button"
                    className="px-3 py-1.5 hover:bg-muted"
                    onClick={() =>
                      setDetailQuantity((q) => Math.max(1, q - 1))
                    }
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={detailQuantity}
                    onChange={(e) =>
                      setDetailQuantity(
                        Math.max(1, Number(e.target.value) || 1),
                      )
                    }
                    className="w-14 text-center bg-background outline-none"
                  />
                  <button
                    type="button"
                    className="px-3 py-1.5 hover:bg-muted"
                    onClick={() => setDetailQuantity((q) => q + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailOpen(false)}
            >
              {t("tableOrdering.cancel")}
            </Button>
            <Button
              onClick={handleDetailAdd}
              disabled={detailLoading || !detailProduct}
            >
              {t("tableOrdering.addToCart")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductCard({ product, currency, moneyLocale, onPick }) {
  const img = pickProductImage(product);
  return (
    <button
      type="button"
      onClick={onPick}
      className="group bg-background border rounded-lg overflow-hidden hover:shadow-md transition-shadow flex flex-col text-left"
    >
      <div className="aspect-square w-full bg-muted overflow-hidden flex items-center justify-center">
        {img ? (
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            loading="lazy"
          />
        ) : (
          <ShoppingBag className="size-10 text-muted-foreground/40" />
        )}
      </div>
      <div className="p-2.5 flex-1 flex flex-col gap-1">
        <p className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </p>
        <p className="text-primary font-semibold text-sm mt-auto">
          {formatCurrency(product.price, currency, moneyLocale)}
        </p>
      </div>
    </button>
  );
}

function CurrentOrderCard({
  order,
  loading,
  onReload,
  currency,
  moneyLocale,
  t,
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div>
          <CardTitle className="text-base">
            {t("tableOrdering.currentOrderTitle")}
          </CardTitle>
          <CardDescription>
            {t("tableOrdering.currentOrderCode", {
              code: order.orderCode || order.id,
            })}
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onReload}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {Array.isArray(order.items) && order.items.length > 0 ? (
          <ul className="space-y-1">
            {order.items.map((line, idx) => (
              <li
                key={`${line.productId}-${idx}`}
                className="flex items-start justify-between gap-2"
              >
                <span className="min-w-0">
                  <span className="font-medium">{line.productName}</span>
                  {line.variantName ? (
                    <span className="text-muted-foreground">
                      {" "}
                      ({line.variantName})
                    </span>
                  ) : null}
                  <span className="text-muted-foreground">
                    {" "}
                    × {line.quantity}
                  </span>
                </span>
                <span className="tabular-nums shrink-0">
                  {formatCurrency(line.lineTotal, currency, moneyLocale)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <Separator />
        <div className="flex items-center justify-between font-semibold">
          <span>{t("tableOrdering.total")}</span>
          <span className="tabular-nums">
            {formatCurrency(order.totalAmount, currency, moneyLocale)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("tableOrdering.currentOrderHint")}
        </p>
      </CardContent>
    </Card>
  );
}
