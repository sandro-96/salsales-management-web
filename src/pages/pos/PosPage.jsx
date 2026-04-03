import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  Loader2,
  UtensilsCrossed,
  X,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";

import { useShop } from "../../hooks/useShop";
import { getBranchProducts } from "../../api/productApi";
import { getTables } from "../../api/tableApi";
import { createOrder, confirmPayment } from "../../api/orderApi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

const PAYMENT_METHODS = [
  { value: "Cash", label: "Tiền mặt", icon: Banknote },
  { value: "Card", label: "Thẻ", icon: CreditCard },
  { value: "Transfer", label: "Chuyển khoản", icon: ArrowRightLeft },
];

const ALL_CATEGORY = "__ALL__";

const CartPanel = ({
  cart,
  totalItems,
  subtotal,
  note,
  setNote,
  selectedTableId,
  setSelectedTableId,
  availableTables,
  updateQuantity,
  removeFromCart,
  clearCart,
  onCheckout,
  hideHeader,
}) => (
  <>
    {!hideHeader && (
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          <span className="font-semibold text-sm">Đơn hàng</span>
          {totalItems > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalItems}
            </Badge>
          )}
        </div>
        {cart.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 text-destructive"
            onClick={clearCart}
          >
            Xóa tất cả
          </Button>
        )}
      </div>
    )}

    {/* Table selector */}
    <div className="p-3 border-b space-y-2">
      <Select value={selectedTableId} onValueChange={setSelectedTableId}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Chọn bàn (tuỳ chọn)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none" className="text-xs">
            Không chọn bàn
          </SelectItem>
          {availableTables.map((t) => (
            <SelectItem key={t.id} value={t.id} className="text-xs">
              {t.name} {t.capacity ? `(${t.capacity} chỗ)` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Cart items */}
    <ScrollArea className="flex-1">
      {cart.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          <div className="text-center">
            <Receipt className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">Chưa có sản phẩm nào</p>
            <p className="text-[10px] mt-1">
              Nhấn vào sản phẩm để thêm vào đơn
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y">
          {cart.map((item) => (
            <div key={item.productId} className="p-3 flex gap-2">
              <div className="h-10 w-10 rounded bg-muted shrink-0 overflow-hidden">
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <UtensilsCrossed className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-tight truncate">
                  {item.productName}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {item.price.toLocaleString("vi-VN")} ₫
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => updateQuantity(item.productId, -1)}
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
                    onClick={() => updateQuantity(item.productId, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground hover:text-destructive"
                  onClick={() => removeFromCart(item.productId)}
                >
                  <X className="h-3 w-3" />
                </Button>
                <span className="text-xs font-bold tabular-nums">
                  {(item.price * item.quantity).toLocaleString("vi-VN")} ₫
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>

    {/* Note */}
    <div className="p-3 border-t">
      <Textarea
        placeholder="Ghi chú đơn hàng..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="text-xs min-h-[56px] resize-none"
        rows={2}
      />
    </div>

    {/* Total & Checkout */}
    <div className="p-3 border-t space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Tạm tính</span>
        <span className="text-lg font-bold tabular-nums">
          {subtotal.toLocaleString("vi-VN")} ₫
        </span>
      </div>
      <Button
        className="w-full h-11 text-sm font-semibold"
        disabled={cart.length === 0}
        onClick={onCheckout}
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        Thanh toán ({totalItems} món)
      </Button>
    </div>
  </>
);

const PosPage = () => {
  const { selectedShopId, selectedBranchId, branches, setSelectedBranchId } =
    useShop();

  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);

  const [cart, setCart] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [note, setNote] = useState("");

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [submitting, setSubmitting] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const effectiveBranchId =
    selectedBranchId || (branches.length === 1 ? branches[0]?.id : null);

  const fetchData = useCallback(async () => {
    if (!selectedShopId || !effectiveBranchId) return;
    setLoading(true);
    try {
      const [prodRes, tableRes] = await Promise.all([
        getBranchProducts(selectedShopId, effectiveBranchId, {
          size: 500,
          active: true,
        }),
        getTables(selectedShopId, effectiveBranchId),
      ]);
      const prodList = prodRes.data?.data?.content || prodRes.data?.data || [];
      setProducts(prodList.filter((p) => p.activeInBranch !== false));
      const tableList =
        tableRes.data?.data?.content || tableRes.data?.data || [];
      setTables(tableList);
    } catch (err) {
      console.error("Failed to load POS data", err);
      toast.error("Không thể tải dữ liệu sản phẩm");
    } finally {
      setLoading(false);
    }
  }, [selectedShopId, effectiveBranchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const categories = useMemo(() => {
    const cats = new Set();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return [ALL_CATEGORY, ...Array.from(cats).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== ALL_CATEGORY && p.category !== selectedCategory)
        return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, selectedCategory, searchTerm]);

  const availableTables = useMemo(
    () => tables.filter((t) => t.status === "AVAILABLE"),
    [tables],
  );

  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.productId === product.productId,
      );
      if (existing) {
        return prev.map((item) =>
          item.productId === product.productId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          productId: product.productId,
          branchProductId: product.id,
          productName: product.name,
          price: product.price,
          image: product.images?.[0] || null,
          quantity: 1,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedTableId("");
    setNote("");
  }, []);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const orderData = {
        shopId: selectedShopId,
        branchId: effectiveBranchId,
        tableId: selectedTableId || null,
        note: note || null,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      const res = await createOrder(
        selectedShopId,
        effectiveBranchId,
        orderData,
      );
      const order = res.data?.data;

      if (paymentMethod && order?.id) {
        try {
          await confirmPayment(
            order.id,
            selectedShopId,
            `POS-${Date.now()}`,
            paymentMethod,
          );
        } catch {
          toast.info("Đơn hàng đã tạo nhưng chưa thanh toán");
        }
      }

      toast.success("Đơn hàng đã được tạo thành công!");
      clearCart();
      setCheckoutOpen(false);
      fetchData();
    } catch (err) {
      console.error("Order creation failed", err);
      const msg = err.response?.data?.message || "Không thể tạo đơn hàng";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!effectiveBranchId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-lg font-medium">Vui lòng chọn chi nhánh</p>
          <p className="text-sm text-muted-foreground">
            Chọn chi nhánh từ thanh tiêu đề để bắt đầu bán hàng
          </p>
          {branches.length > 0 && (
            <Select value="" onValueChange={setSelectedBranchId}>
              <SelectTrigger className="w-[240px] mx-auto">
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
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Mobile: Category horizontal scroll */}
      <div className="lg:hidden border-b overflow-x-auto">
        <div className="flex items-center gap-1 p-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
            >
              {cat === ALL_CATEGORY ? "Tất cả" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: Category sidebar */}
      <aside className="hidden lg:flex w-48 shrink-0 border-r bg-muted/30 flex-col">
        <div className="p-3 border-b">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Danh mục
          </p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                {cat === ALL_CATEGORY ? "Tất cả" : cat}
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Center: Product grid */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="p-3 border-b flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm món ăn, SKU, barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Badge variant="secondary" className="shrink-0">
            {filteredProducts.length} sản phẩm
          </Badge>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 p-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <UtensilsCrossed className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Không tìm thấy sản phẩm</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 p-3">
              {filteredProducts.map((product) => {
                const inCart = cart.find(
                  (c) => c.productId === product.productId,
                );
                return (
                  <Card
                    key={product.id}
                    className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all overflow-hidden relative group"
                    onClick={() => addToCart(product)}
                  >
                    <div className="aspect-square bg-muted/50 relative">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <UtensilsCrossed className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                      )}
                      {inCart && (
                        <Badge className="absolute top-1.5 right-1.5 h-6 min-w-6 justify-center text-xs">
                          {inCart.quantity}
                        </Badge>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium leading-tight line-clamp-2">
                        {product.name}
                      </p>
                      <p className="text-sm font-bold text-primary mt-1">
                        {product.price?.toLocaleString("vi-VN")} ₫
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Mobile: Floating cart button */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Desktop: Cart panel */}
      <aside className="hidden lg:flex w-80 xl:w-96 shrink-0 border-l bg-card flex-col">
        <CartPanel
          cart={cart}
          totalItems={totalItems}
          subtotal={subtotal}
          note={note}
          setNote={setNote}
          selectedTableId={selectedTableId}
          setSelectedTableId={setSelectedTableId}
          availableTables={availableTables}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          clearCart={clearCart}
          onCheckout={() => setCheckoutOpen(true)}
        />
      </aside>

      {/* Mobile: Cart sheet */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col"
        >
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle className="flex items-center gap-2 text-sm">
              <ShoppingCart className="h-4 w-4" />
              Đơn hàng
              {totalItems > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {totalItems}
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>
          <CartPanel
            cart={cart}
            totalItems={totalItems}
            subtotal={subtotal}
            note={note}
            setNote={setNote}
            selectedTableId={selectedTableId}
            setSelectedTableId={setSelectedTableId}
            availableTables={availableTables}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            clearCart={clearCart}
            onCheckout={() => {
              setCartOpen(false);
              setCheckoutOpen(true);
            }}
            hideHeader
          />
        </SheetContent>
      </Sheet>

      {/* Checkout dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Xác nhận thanh toán
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border divide-y max-h-48 overflow-y-auto">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="flex justify-between px-3 py-2 text-sm"
                >
                  <span>
                    {item.productName}{" "}
                    <span className="text-muted-foreground">
                      x{item.quantity}
                    </span>
                  </span>
                  <span className="font-medium tabular-nums">
                    {(item.price * item.quantity).toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center px-1">
              <span className="font-semibold">Tổng cộng</span>
              <span className="text-xl font-bold text-primary tabular-nums">
                {subtotal.toLocaleString("vi-VN")} ₫
              </span>
            </div>

            {selectedTableId && selectedTableId !== "none" && (
              <div className="text-sm text-muted-foreground px-1">
                Bàn:{" "}
                {tables.find((t) => t.id === selectedTableId)?.name ||
                  selectedTableId}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">Phương thức thanh toán</p>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((pm) => {
                  const Icon = pm.icon;
                  return (
                    <Button
                      key={pm.value}
                      variant={
                        paymentMethod === pm.value ? "default" : "outline"
                      }
                      className="h-12 flex-col gap-1 text-xs"
                      onClick={() => setPaymentMethod(pm.value)}
                    >
                      <Icon className="h-4 w-4" />
                      {pm.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCheckoutOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button onClick={handleCheckout} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PosPage;
