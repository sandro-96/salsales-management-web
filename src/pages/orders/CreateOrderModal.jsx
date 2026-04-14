import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Loader2,
  ShoppingCart,
  Tag,
  Percent,
} from "lucide-react";
import { toast } from "sonner";

import { useShop } from "../../hooks/useShop";
import { getBranchProducts } from "../../api/productApi";
import { getTables } from "../../api/tableApi";
import { getPromotions } from "../../api/promotionApi";
import { createOrder } from "../../api/orderApi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function buildPromotionMap(promotions, branchId) {
  const now = new Date();
  const active = promotions.filter((p) => {
    if (!p.active) return false;
    if (p.startDate && new Date(p.startDate) > now) return false;
    if (p.endDate && new Date(p.endDate) < now) return false;
    if (p.branchId && p.branchId !== branchId) return false;
    return true;
  });

  const map = new Map();
  for (const promo of active) {
    const ids = promo.applicableProductIds;
    if (!ids || ids.length === 0) {
      map.set("__SHOP_WIDE__", [...(map.get("__SHOP_WIDE__") || []), promo]);
    } else {
      for (const pid of ids) {
        if (!map.has(pid)) map.set(pid, []);
        map.get(pid).push(promo);
      }
    }
  }
  return map;
}

function getBestPromo(promoMap, productId) {
  const specific = promoMap.get(productId) || [];
  const shopWide = promoMap.get("__SHOP_WIDE__") || [];
  const all = [...specific, ...shopWide];
  return all.length > 0 ? all[0] : null;
}

function calcDiscountedPrice(basePrice, promo) {
  if (!promo) return basePrice;
  if (promo.discountType === "PERCENT") {
    return basePrice * (1 - promo.discountValue / 100);
  }
  return Math.max(0, basePrice - promo.discountValue);
}

function formatDiscount(promo) {
  if (!promo) return "";
  if (promo.discountType === "PERCENT") return `-${promo.discountValue}%`;
  return `-${promo.discountValue.toLocaleString("vi-VN")}₫`;
}

function hasBranchVariants(product) {
  return Array.isArray(product?.branchVariants) && product.branchVariants.length > 0;
}

function variantCatalogName(product, variantId) {
  const v = (product?.variants || []).find((x) => x.variantId === variantId);
  return v?.name || variantId || "";
}

const CreateOrderModal = ({ open, onClose, onCreated }) => {
  const { selectedShopId, branches, selectedBranchId } = useShop();

  const [branchId, setBranchId] = useState(selectedBranchId || "");
  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([]);
  const [branchHasTables, setBranchHasTables] = useState(false);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [variantPickerProduct, setVariantPickerProduct] = useState(null);

  useEffect(() => {
    if (open) {
      setBranchId(
        selectedBranchId || (branches.length === 1 ? branches[0]?.id : ""),
      );
      setCart([]);
      setNote("");
      setSelectedTableId("");
      setSearchTerm("");
    }
  }, [open, selectedBranchId, branches]);

  const fetchBranchData = useCallback(async () => {
    if (!selectedShopId || !branchId) {
      setProducts([]);
      setTables([]);
      setBranchHasTables(false);
      setPromotions([]);
      return;
    }
    setLoading(true);
    try {
      const [prodRes, tableRes, promoRes] = await Promise.all([
        getBranchProducts(selectedShopId, branchId, {
          size: 500,
          active: true,
        }),
        getTables(selectedShopId, branchId),
        getPromotions(selectedShopId, { branchId, size: 200 }),
      ]);
      const prodList = prodRes.data?.data?.content || prodRes.data?.data || [];
      setProducts(prodList.filter((p) => p.activeInBranch !== false));
      const tableList =
        tableRes.data?.data?.content || tableRes.data?.data || [];
      const rawTables = Array.isArray(tableList) ? tableList : [];
      setBranchHasTables(rawTables.length > 0);
      setTables(rawTables.filter((t) => t.status === "AVAILABLE"));
      const promoList =
        promoRes.data?.data?.content || promoRes.data?.data || [];
      setPromotions(promoList);
    } catch {
      toast.error("Không thể tải dữ liệu chi nhánh");
    } finally {
      setLoading(false);
    }
  }, [selectedShopId, branchId]);

  useEffect(() => {
    if (open && branchId) {
      fetchBranchData();
    }
  }, [open, branchId, fetchBranchData]);

  const promoMap = useMemo(
    () => buildPromotionMap(promotions, branchId),
    [promotions, branchId],
  );

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products.slice(0, 20);
    const q = searchTerm.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [products, searchTerm]);

  const addToCart = useCallback(
    (product, variantId) => {
      const hasVars = hasBranchVariants(product);
      const branchVariant =
        hasVars && variantId
          ? product.branchVariants.find((v) => v.variantId === variantId)
          : null;
      if (hasVars && (!variantId || !branchVariant)) {
        toast.error("Chọn biến thể hợp lệ.");
        return;
      }

      const basePrice = hasVars
        ? branchVariant.price > 0
          ? branchVariant.price
          : product.price
        : product.price;
      const maxStock = product.trackInventory
        ? hasVars
          ? branchVariant.quantity
          : product.quantity ?? 0
        : null;

      setCart((prev) => {
        const lineMatch = (item) =>
          hasVars
            ? item.productId === product.productId && item.variantId === variantId
            : item.productId === product.productId && !item.variantId;

        const existing = prev.find(lineMatch);
        if (existing) {
          if (maxStock != null && existing.quantity >= maxStock) {
            toast.error("Không đủ tồn kho.");
            return prev;
          }
          return prev.map((item) =>
            lineMatch(item) ? { ...item, quantity: item.quantity + 1 } : item,
          );
        }

        if (maxStock != null && maxStock < 1) {
          toast.error("Hết hàng.");
          return prev;
        }

        const promo = getBestPromo(promoMap, product.productId);
        const discountedPrice = calcDiscountedPrice(basePrice, promo);
        const hasDiscount = promo && discountedPrice < basePrice;
        const vName = hasVars ? variantCatalogName(product, variantId) : "";
        const lineKey = hasVars ? `${product.productId}__${variantId}` : product.productId;

        return [
          ...prev,
          {
            lineKey,
            productId: product.productId,
            variantId: hasVars ? variantId : null,
            productName: vName ? `${product.name} — ${vName}` : product.name,
            originalPrice: basePrice,
            price: hasDiscount ? discountedPrice : basePrice,
            hasDiscount: !!hasDiscount,
            promoLabel: hasDiscount ? formatDiscount(promo) : null,
            quantity: 1,
            trackInventory: !!product.trackInventory,
            maxStock,
          },
        ];
      });
    },
    [promoMap],
  );

  const updateQuantity = (lineKey, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.lineKey !== lineKey) return item;
          const nextQty = item.quantity + delta;
          if (
            delta > 0 &&
            item.trackInventory &&
            item.maxStock != null &&
            nextQty > item.maxStock
          ) {
            toast.error("Không đủ tồn kho.");
            return item;
          }
          return { ...item, quantity: Math.max(0, nextQty) };
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (lineKey) => {
    setCart((prev) => prev.filter((item) => item.lineKey !== lineKey));
  };

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const totalSavings = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          (item.hasDiscount
            ? (item.originalPrice - item.price) * item.quantity
            : 0),
        0,
      ),
    [cart],
  );

  const handleSubmit = async () => {
    if (cart.length === 0 || !branchId) return;
    setSubmitting(true);
    try {
      const orderData = {
        shopId: selectedShopId,
        branchId,
        tableId:
          selectedTableId && selectedTableId !== "none"
            ? selectedTableId
            : null,
        note: note || null,
        items: cart.map((item) => ({
          productId: item.productId,
          ...(item.variantId ? { variantId: item.variantId } : {}),
          quantity: item.quantity,
        })),
      };
      await createOrder(selectedShopId, branchId, orderData);
      toast.success("Đơn hàng đã được tạo thành công!");
      onCreated?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Không thể tạo đơn hàng";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Tạo đơn hàng mới
          </DialogTitle>
          <DialogDescription>
            Chọn chi nhánh và sản phẩm để tạo đơn hàng
            {branchHasTables ? " (có thể gắn bàn nếu cần)" : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Branch + Table selectors */}
          <div
            className={`grid gap-3 ${branchHasTables ? "grid-cols-2" : "grid-cols-1"}`}
          >
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Chi nhánh *</label>
              <Select
                value={branchId}
                onValueChange={(v) => {
                  setBranchId(v);
                  setCart([]);
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Chọn chi nhánh" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {branchHasTables && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Bàn (tuỳ chọn)</label>
                <Select
                  value={selectedTableId || "none"}
                  onValueChange={setSelectedTableId}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Không chọn bàn" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không chọn bàn</SelectItem>
                    {tables.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} {t.capacity ? `(${t.capacity} chỗ)` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Product search */}
          {branchId && (
            <div className="space-y-2">
              <label className="text-xs font-medium">Thêm sản phẩm</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm sản phẩm theo tên, SKU, barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-40 rounded-md border">
                  <div className="divide-y">
                    {filteredProducts.length === 0 ? (
                      <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                        Không tìm thấy sản phẩm
                      </div>
                    ) : (
                      filteredProducts.map((p) => {
                        const promo = getBestPromo(promoMap, p.productId);
                        const discounted = calcDiscountedPrice(p.price, promo);
                        const hasPromo = promo && discounted < p.price;

                        return (
                          <div
                            key={p.id}
                            className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 cursor-pointer"
                            onClick={() => {
                              if (hasBranchVariants(p)) {
                                if (p.branchVariants.length === 1) {
                                  addToCart(p, p.branchVariants[0].variantId);
                                } else {
                                  setVariantPickerProduct(p);
                                }
                              } else {
                                addToCart(p, null);
                              }
                            }}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium truncate">
                                  {p.name}
                                </p>
                                {hasPromo && (
                                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] px-1 py-0 h-4 gap-0.5 shrink-0">
                                    <Percent className="h-2.5 w-2.5" />
                                    {formatDiscount(promo)}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {p.sku}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {hasPromo ? (
                                <div className="text-right">
                                  <span className="text-sm font-semibold text-emerald-600 tabular-nums">
                                    {discounted.toLocaleString("vi-VN")} ₫
                                  </span>
                                  <span className="text-[10px] line-through text-muted-foreground ml-1">
                                    {p.price?.toLocaleString("vi-VN")}₫
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm font-semibold tabular-nums">
                                  {p.price?.toLocaleString("vi-VN")} ₫
                                </span>
                              )}
                              <Plus className="h-4 w-4 text-primary" />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          {/* Cart table */}
          {cart.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">
                  Sản phẩm đã chọn ({cart.length})
                </label>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead className="w-[100px] text-center">
                        Số lượng
                      </TableHead>
                      <TableHead className="w-[100px] text-right">
                        Đơn giá
                      </TableHead>
                      <TableHead className="w-[100px] text-right">
                        Thành tiền
                      </TableHead>
                      <TableHead className="w-[40px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.lineKey}>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium">
                              {item.productName}
                            </span>
                            {item.hasDiscount && (
                              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] px-1 py-0 h-4 shrink-0">
                                {item.promoLabel}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() =>
                                updateQuantity(item.lineKey, -1)
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-xs font-semibold w-6 text-center tabular-nums">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateQuantity(item.lineKey, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.hasDiscount ? (
                            <div>
                              <span className="text-sm tabular-nums text-emerald-600 font-medium">
                                {item.price.toLocaleString("vi-VN")} ₫
                              </span>
                              <br />
                              <span className="text-[10px] line-through text-muted-foreground">
                                {item.originalPrice.toLocaleString("vi-VN")}₫
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm tabular-nums">
                              {item.price.toLocaleString("vi-VN")} ₫
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold tabular-nums">
                          {(item.price * item.quantity).toLocaleString("vi-VN")}{" "}
                          ₫
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => removeFromCart(item.lineKey)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Ghi chú</label>
            <Textarea
              placeholder="Ghi chú cho đơn hàng..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[60px] resize-none text-sm"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between border-t pt-4">
          <div className="text-sm space-y-0.5">
            {totalSavings > 0 && (
              <div className="text-xs text-emerald-600 flex items-center gap-1">
                <Tag className="h-3 w-3" />
                Tiết kiệm: {totalSavings.toLocaleString("vi-VN")} ₫
              </div>
            )}
            <div>
              Tổng:{" "}
              <span className="text-lg font-bold text-primary tabular-nums">
                {subtotal.toLocaleString("vi-VN")} ₫
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || cart.length === 0 || !branchId}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Tạo đơn hàng
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog
      open={!!variantPickerProduct}
      onOpenChange={(v) => {
        if (!v) setVariantPickerProduct(null);
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Chọn biến thể</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {variantPickerProduct?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {variantPickerProduct?.branchVariants?.map((bv) => {
            const label = variantCatalogName(variantPickerProduct, bv.variantId);
            const stockLabel =
              variantPickerProduct.trackInventory === false
                ? ""
                : `Tồn: ${(bv.quantity ?? 0).toLocaleString("vi-VN")}`;
            const price =
              bv.price > 0 ? bv.price : variantPickerProduct.price ?? 0;
            return (
              <button
                key={bv.variantId}
                type="button"
                className="w-full flex items-center justify-between gap-2 rounded-md border px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors"
                onClick={() => {
                  addToCart(variantPickerProduct, bv.variantId);
                  setVariantPickerProduct(null);
                }}
              >
                <span className="font-medium truncate min-w-0">{label}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap tabular-nums shrink-0">
                  {stockLabel}
                  {stockLabel ? " · " : ""}
                  {price.toLocaleString("vi-VN")}₫
                </span>
              </button>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setVariantPickerProduct(null)}>
            Hủy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default CreateOrderModal;
