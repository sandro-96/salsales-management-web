import React, { useState, useEffect, useMemo } from "react";
import { useShop } from "../../hooks/useShop.js";
import { useShopPermissions } from "../../hooks/useShopPermissions.js";
import { PERM } from "../../constants/shopPermissions.js";
import axiosInstance from "../../api/axiosInstance.js";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  MapPin,
  Phone,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Building2,
  Clock,
  Users,
  Star,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAlertDialog } from "../../hooks/useAlertDialog";

const BranchPage = () => {
  const { selectedShopId, branches, fetchBranches, isOwner } = useShop();
  const { hasShopPermission } = useShopPermissions();
  const canManage = hasShopPermission(PERM.BRANCH_MANAGE);
  const canDelete = isOwner; // BE: DELETE /branches/{id} = @RequireRole(OWNER)
  const shopId = selectedShopId;
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();
  const { confirm } = useAlertDialog();

  useEffect(() => {
    if (!shopId) return;
    setLoading(true);
    fetchBranches(shopId).finally(() => setLoading(false));
  }, [shopId, fetchBranches]);

  const handleDelete = async (branch) => {
    if (!branch) return;
    const ok = await confirm(
      `Bạn có chắc muốn xóa chi nhánh "${branch.name}"? Hành động này không thể hoàn tác.`,
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
        `branches/${branch.id}?shopId=${shopId}`,
      );
      if (res.data.success) {
        toast.success("Xóa chi nhánh thành công.");
        await fetchBranches?.(shopId);
      } else {
        toast.error(res.data.message || "Xóa chi nhánh thất bại.");
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi xóa chi nhánh.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    const total = branches.length;
    const active = branches.filter((b) => b.active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [branches]);

  const filteredBranches = useMemo(() => {
    if (!keyword.trim()) return branches;
    const kw = keyword.toLowerCase();
    return branches.filter(
      (b) =>
        b.name?.toLowerCase().includes(kw) ||
        b.address?.toLowerCase().includes(kw),
    );
  }, [branches, keyword]);

  const defaultBranch = filteredBranches.find((b) => b.default);
  const otherBranches = filteredBranches.filter((b) => !b.default);

  return (
    <div className="h-full flex-1 flex-col gap-6 p-4 md:p-8 md:flex">
      <div className="flex flex-col gap-6">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Quản lý chi nhánh
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.total} chi nhánh · {stats.active} hoạt động
            </p>
          </div>
          {canManage && (
            <Button onClick={() => navigate("create")} size="sm" variant="success">
              <Plus className="h-4 w-4 mr-1" /> Thêm chi nhánh
            </Button>
          )}
        </div>

        {/* ── Search (show if >3 branches) ────────────────────────── */}
        {branches.length > 3 && (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Tìm chi nhánh..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {/* ── Loading skeleton ────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="py-0 gap-0">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBranches.length === 0 ? (
          /* ── Empty state ──────────────────────────────────────── */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="h-14 w-14 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold">
              {keyword ? "Không tìm thấy chi nhánh" : "Chưa có chi nhánh nào"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {keyword
                ? "Thử tìm kiếm với từ khóa khác."
                : "Tạo chi nhánh đầu tiên để bắt đầu."}
            </p>
            {!keyword && canManage && (
              <Button className="mt-4" onClick={() => navigate("create")}>
                <Plus className="h-4 w-4 mr-1" /> Tạo chi nhánh
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* ── Default branch (hero card) ───────────────────── */}
            {defaultBranch && (
              <BranchCard
                branch={defaultBranch}
                isHero
                canUpdate={canManage}
                canDelete={canDelete}
                isSubmitting={isSubmitting}
                onNavigate={(slug) => navigate(slug)}
                onDelete={handleDelete}
              />
            )}

            {/* ── Other branches grid ──────────────────────────── */}
            {otherBranches.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {otherBranches.map((branch) => (
                  <BranchCard
                    key={branch.id}
                    branch={branch}
                    canUpdate={canManage}
                    canDelete={canDelete}
                    isSubmitting={isSubmitting}
                    onNavigate={(slug) => navigate(slug)}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Branch Card ─────────────────────────────────────────────────────────────

const BranchCard = ({
  branch,
  isHero,
  canUpdate,
  canDelete,
  isSubmitting,
  onNavigate,
  onDelete,
}) => {
  const isActive = branch.active;
  const isDefault = branch.default;

  const formatTime = (t) => {
    if (!t) return null;
    if (typeof t === "string" && t.includes(":")) return t.slice(0, 5);
    return t;
  };

  const opening = formatTime(branch.openingTime);
  const closing = formatTime(branch.closingTime);
  const hasHours = opening && closing;

  return (
    <Card
      className={[
        "group relative py-0 gap-0 transition-all cursor-pointer hover:shadow-md",
        isHero
          ? "md:col-span-2 xl:col-span-3 border-primary/30 bg-primary/[0.02]"
          : "",
        !isActive ? "opacity-70" : "",
      ].join(" ")}
      onClick={() => onNavigate(branch.slug)}
    >
      <CardContent className={isHero ? "p-6" : "p-5"}>
        <div
          className={
            isHero
              ? "flex flex-col sm:flex-row sm:items-start gap-5"
              : "flex flex-col gap-4"
          }
        >
          {/* Icon + Info */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div
              className={[
                "flex items-center justify-center rounded-xl shrink-0",
                isHero ? "h-14 w-14" : "h-11 w-11",
                isActive
                  ? isDefault
                    ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300"
                    : "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300"
                  : "bg-gray-100 text-gray-400 dark:bg-muted dark:text-muted-foreground",
              ].join(" ")}
            >
              {isDefault ? (
                <Star className={isHero ? "h-6 w-6" : "h-5 w-5"} />
              ) : (
                <Building2 className={isHero ? "h-6 w-6" : "h-5 w-5"} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={`font-semibold truncate ${isHero ? "text-lg" : "text-sm"}`}
                >
                  {branch.name}
                </h3>
                {isDefault && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-normal text-amber-600 border-amber-300 px-1.5 py-0 dark:text-amber-300 dark:border-amber-500/40"
                  >
                    Mặc định
                  </Badge>
                )}
                {isActive ? (
                  <Badge className="text-[10px] gap-0.5 bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/40 dark:hover:bg-emerald-500/15">
                    <CheckCircle2 className="h-2.5 w-2.5" /> Hoạt động
                  </Badge>
                ) : (
                  <Badge className="text-[10px] gap-0.5 bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100 dark:bg-muted dark:text-muted-foreground dark:border-border dark:hover:bg-muted">
                    <XCircle className="h-2.5 w-2.5" /> Tạm ngưng
                  </Badge>
                )}
              </div>

              <div
                className={`flex flex-col gap-1 mt-2 ${isHero ? "sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-1" : ""}`}
              >
                {branch.address && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                    <span className="truncate">{branch.address}</span>
                  </span>
                )}
                {branch.phone && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                    {branch.phone}
                  </span>
                )}
                {hasHours && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                    {opening} – {closing}
                  </span>
                )}
                {branch.managerName && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                    {branch.managerName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div
            className="flex items-center gap-2 shrink-0 self-start"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background w-40">
                <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onNavigate(`${branch.slug}?mode=edit`)}
                >
                  <Pencil className="h-4 w-4 mr-2" />{" "}
                  {canUpdate ? "Chỉnh sửa" : "Xem chi tiết"}
                </DropdownMenuItem>
                {!isDefault && canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:bg-red-100 focus:text-red-700 dark:text-red-300 dark:focus:bg-red-500/15 dark:focus:text-red-200"
                      disabled={isSubmitting}
                      onClick={() => onDelete(branch)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Xóa
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BranchPage;
