import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Loader2,
  UtensilsCrossed,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";

import { useShop } from "../../hooks/useShop";
import { getBranchProducts } from "../../api/productApi";
import { getTables } from "../../api/tableApi";
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

const CreateOrderModal = ({ open, onClose, onCreated }) => {
  const { selectedShopId, branches, selectedBranchId } = useShop();

  const [branchId, setBranchId] = useState(selectedBranchId || "");
  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setBranchId(selectedBranchId || (branches.length === 1 ? branches[0]?.id : ""));
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
      return;
    }
    setLoading(true);
    try {
      const [prodRes, tableRes] = await Promise.all([
        getBranchProducts(selectedShopId, branchId, { size: 500, active: true }),
        getTables(selectedShopId, branchId),
      ]);
      const prodList = prodRes.data?.data?.content || prodRes.data?.data || [];
      setProducts(prodList.filter((p) => p.activeInBranch !== false));
      const tableList = tableRes.data?.data?.content || tableRes.data?.data || [];
      setTables(tableList.filter((t) => t.status === "AVAILABLE"));
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

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.productId);
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
          productName: product.name,
          price: product.price,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const handleSubmit = async () => {
    if (cart.length === 0 || !branchId) return;
    setSubmitting(true);
    try {
      const orderData = {
        shopId: selectedShopId,
        branchId,
        tableId: selectedTableId && selectedTableId !== "none" ? selectedTableId : null,
        note: note || null,
        items: cart.map((item) => ({
          productId: item.productId,
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
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Tạo đơn hàng mới
          </DialogTitle>
          <DialogDescription>Chọn chi nhánh, sản phẩm và bàn để tạo đơn hàng</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Branch + Table selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Chi nhánh *</label>
              <Select value={branchId} onValueChange={(v) => { setBranchId(v); setCart([]); }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Chọn chi nhánh" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Bàn (tuỳ chọn)</label>
              <Select value={selectedTableId} onValueChange={setSelectedTableId}>
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
                      filteredProducts.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 cursor-pointer"
                          onClick={() => addToCart(p)}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.sku}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-semibold tabular-nums">
                              {p.price?.toLocaleString("vi-VN")} ₫
                            </span>
                            <Plus className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      ))
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
                      <TableHead className="w-[100px] text-center">Số lượng</TableHead>
                      <TableHead className="w-[100px] text-right">Đơn giá</TableHead>
                      <TableHead className="w-[100px] text-right">Thành tiền</TableHead>
                      <TableHead className="w-[40px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell className="text-sm font-medium">{item.productName}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
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
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {item.price.toLocaleString("vi-VN")} ₫
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold tabular-nums">
                          {(item.price * item.quantity).toLocaleString("vi-VN")} ₫
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => removeFromCart(item.productId)}
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
          <div className="text-sm">
            Tổng:{" "}
            <span className="text-lg font-bold text-primary tabular-nums">
              {subtotal.toLocaleString("vi-VN")} ₫
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || cart.length === 0 || !branchId}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Tạo đơn hàng
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrderModal;
