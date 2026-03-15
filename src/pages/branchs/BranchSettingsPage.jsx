"use client";

import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  MapPin,
  Phone,
  Package,
  Users,
  ShoppingCart,
  BarChart2,
  Settings,
  Trash2,
  ChevronRight,
  Loader2,
  Building2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import BranchForm from "./BranchForm";
import BranchProductPanel from "./BranchProductPanel";
import { useShop } from "../../hooks/useShop";
import { useAlertDialog } from "../../hooks/useAlertDialog";
import { getBranchBySlug } from "@/api/branchApi";
import { getBranchProducts } from "@/api/productApi";
import axiosInstance from "../../api/axiosInstance";

const BranchSettingsPage = () => {
  const navigate = useNavigate();
  const { confirm } = useAlertDialog();
  const { slug } = useParams();
  const { fetchBranches, selectedShop } = useShop();

  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [activeService, setActiveService] = useState("products");
  const [productCount, setProductCount] = useState(null);

  /* ── Fetch branch ───────────────────────────────────────────────────────── */
  const fetchBranch = useCallback(async () => {
    if (!slug || !selectedShop) return;
    try {
      setLoading(true);
      const res = await getBranchBySlug(slug, selectedShop.id);
      if (res.data.success) {
        setBranch(res.data.data);
      } else {
        toast.error("Không tìm thấy chi nhánh.");
      }
    } catch (err) {
      console.error("Fetch branch error:", err);
      toast.error("Đã xảy ra lỗi khi tải chi nhánh.");
    } finally {
      setLoading(false);
    }
  }, [slug, selectedShop]);

  useEffect(() => {
    fetchBranch();
  }, [fetchBranch]);

  /* ── Fetch product count for stats card ─────────────────────────────────── */
  useEffect(() => {
    if (!branch || !selectedShop) return;
    getBranchProducts(selectedShop.id, branch.id, { page: 0, size: 1 })
      .then((res) => {
        const data = res.data?.data;
        const total =
          data?.page?.totalElements ??
          data?.totalElements ??
          (Array.isArray(data) ? data.length : null);
        setProductCount(total);
      })
      .catch(() => setProductCount(null));
  }, [branch, selectedShop]);

  /* ── Update branch ───────────────────────────────────────────────────────── */
  const onSubmit = async (data) => {
    if (!branch) return;
    try {
      setIsSubmitting(true);
      const res = await axiosInstance.put(
        `branches/${branch.id}?shopId=${selectedShop.id}`,
        data,
      );
      if (res.data.success) {
        toast.success("Cập nhật chi nhánh thành công.");
        setBranch(res.data.data);
        await fetchBranches?.();
        setEditSheetOpen(false);
      } else {
        toast.error(res.data.message || "Cập nhật chi nhánh thất bại.");
      }
    } catch (err) {
      console.error("Update branch error:", err);
      toast.error("Đã xảy ra lỗi khi cập nhật chi nhánh.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Delete branch ───────────────────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!branch) return;
    const ok = await confirm(
      "Bạn có chắc muốn xóa chi nhánh này không? Hành động này không thể hoàn tác.",
      {
        title: "Xóa chi nhánh",
        confirmText: "Xóa",
        cancelText: "Hủy",
        variant: "destructive",
      },
    );
    if (!ok) return;
    try {
      setIsSubmitting(true);
      const res = await axiosInstance.delete(
        `branches/${branch.id}?shopId=${branch.shopId}`,
      );
      if (res.data.success) {
        toast.success("Xóa chi nhánh thành công.");
        await fetchBranches?.();
        navigate(-1);
      } else {
        toast.error(res.data.message || "Xóa chi nhánh thất bại.");
      }
    } catch (err) {
      console.error("Delete branch error:", err);
      toast.error("Đã xảy ra lỗi khi xóa chi nhánh.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Loading / not found ────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-12">
        <Building2 className="h-12 w-12 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground">Không tìm thấy chi nhánh.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
      </div>
    );
  }

  /* ── Service card definitions ───────────────────────────────────────────── */
  const services = [
    {
      id: "products",
      icon: Package,
      title: "Sản phẩm",
      description: "Giá bán, tồn kho, trạng thái tại chi nhánh",
      count: productCount,
      available: true,
    },
    {
      id: "orders",
      icon: ShoppingCart,
      title: "Đơn hàng",
      description: "Quản lý đơn hàng tại chi nhánh",
      count: null,
      available: false,
    },
    {
      id: "staffs",
      icon: Users,
      title: "Nhân viên",
      description: "Phân quyền và quản lý nhân viên",
      count: null,
      available: false,
    },
    {
      id: "reports",
      icon: BarChart2,
      title: "Báo cáo",
      description: "Doanh thu, thống kê chi nhánh",
      count: null,
      available: false,
    },
  ];

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="p-6 flex flex-col gap-6 h-full overflow-y-auto">
      {/* Branch info header card */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-5 border rounded-xl bg-card shadow-sm">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{branch.name}</h1>
            {branch.default && (
              <Badge
                variant="outline"
                className="text-xs font-normal text-amber-600 border-amber-400"
              >
                Mặc định
              </Badge>
            )}
            <Badge
              className={`text-xs border ${
                branch.active
                  ? "bg-green-100 text-green-700 border-green-300"
                  : "bg-gray-100 text-gray-500 border-gray-200"
              }`}
            >
              {branch.active ? "Hoạt động" : "Tạm ngưng"}
            </Badge>
          </div>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            {branch.address && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {branch.address}
              </span>
            )}
            {branch.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {branch.phone}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!branch.default && (
            <Button
              variant="destructive"
              size="sm"
              disabled={isSubmitting}
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline ml-1.5">Xóa</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditSheetOpen(true)}
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="ml-1.5">Cài đặt</span>
          </Button>
        </div>
      </div>

      {/* Service cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((svc) => {
          const Icon = svc.icon;
          const isActive = activeService === svc.id;
          return (
            <div
              key={svc.id}
              onClick={() =>
                svc.available && setActiveService(isActive ? null : svc.id)
              }
              className={[
                "relative rounded-xl border p-4 flex flex-col gap-3 transition-all select-none",
                svc.available
                  ? isActive
                    ? "cursor-pointer border-primary shadow-md bg-primary/5"
                    : "cursor-pointer bg-card hover:border-primary/50 hover:shadow-sm"
                  : "opacity-55 cursor-not-allowed bg-muted/40",
              ].join(" ")}
            >
              {!svc.available && (
                <Badge
                  variant="secondary"
                  className="absolute top-3 right-3 text-[10px] px-1.5 py-0"
                >
                  Sắp ra mắt
                </Badge>
              )}

              <div
                className={`p-2.5 rounded-lg w-fit ${
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="flex flex-col gap-0.5">
                <div className="font-semibold text-sm">{svc.title}</div>
                {svc.count != null && (
                  <div className="text-2xl font-bold tabular-nums leading-tight">
                    {svc.count}
                  </div>
                )}
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {svc.description}
                </div>
              </div>

              {svc.available && (
                <div
                  className={`flex items-center gap-1 text-xs font-medium mt-auto ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {isActive ? "Đang xem" : "Quản lý"}
                  <ChevronRight
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      isActive ? "rotate-90" : ""
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active service panel */}
      {activeService === "products" && (
        <div className="flex flex-col gap-3 border rounded-xl p-5 bg-card shadow-sm">
          <h3 className="text-base font-semibold">
            Sản phẩm chi nhánh{" "}
            <span className="text-xs text-muted-foreground font-normal">
              — {branch.name}
            </span>
          </h3>
          <BranchProductPanel
            shopId={selectedShop.id}
            branchId={branch.id}
            onCountChange={setProductCount}
          />
        </div>
      )}

      {/* Edit Branch Sheet */}
      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent className="sm:max-w-[540px] overflow-hidden flex flex-col">
          <SheetHeader className="shrink-0">
            <SheetTitle>Cài đặt chi nhánh</SheetTitle>
            <SheetDescription className="sr-only">
              Chỉnh sửa thông tin chi nhánh
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <BranchForm
              mode="edit"
              branch={branch}
              onSubmit={onSubmit}
              isLoading={isSubmitting}
              onModeChange={(newMode) => {
                if (newMode === "view") setEditSheetOpen(false);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default BranchSettingsPage;
