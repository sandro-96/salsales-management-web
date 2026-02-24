import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Copy, Sparkles } from "lucide-react";
import { useShop } from "@/hooks/useShop.js";
import { getSuggestedSku, getSuggestedBarcode } from "@/api/productApi.js";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  PRODUCT_UNITS,
  PRODUCT_CATEGORIES,
} from "@/constants/productConstants.js";

// ── Helpers ─────────────────────────────────────────────────────────────────
const isCustomUnit = (val) =>
  !!val && !PRODUCT_UNITS.find((u) => u.value === val);
const isCustomCategory = (val) =>
  !!val && !PRODUCT_CATEGORIES.find((c) => c.value === val);

const formatVND = (val) =>
  val != null && val !== 0 ? Number(val).toLocaleString("vi-VN") + " ₫" : "-";

// ── ReadOnly display ─────────────────────────────────────────────────────────
function ReadOnlyValue({
  value,
  variant = "single",
  className = "min-h-[2.75rem]",
}) {
  const text = value != null && value !== "" ? String(value) : "-";
  const textClass =
    variant === "multi"
      ? "whitespace-pre-line break-words line-clamp-4"
      : "truncate whitespace-nowrap";
  return (
    <div
      className={`border border-gray-200 rounded-md bg-gray-50 px-3 py-2 text-gray-800 flex items-center justify-between gap-2 ${className}`}
    >
      <div className={`text-sm ${textClass}`}>{text}</div>
      {value != null && value !== "" && (
        <Copy
          className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400 cursor-pointer hover:text-gray-600"
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard
              .writeText(String(value))
              .then(() => toast.success("Đã sao chép!"))
              .catch(() => toast.error("Không thể sao chép"));
          }}
        />
      )}
    </div>
  );
}

// ── Zod Schema ───────────────────────────────────────────────────────────────
const formSchema = z.object({
  // Product fields
  name: z.string().min(1, "Tên sản phẩm không được để trống."),
  sku: z
    .string()
    .min(1, "SKU không được để trống.")
    .regex(/^[A-Z0-9_]*$/, "SKU chỉ chứa chữ IN HOA, số và dấu _"),
  unit: z.string().min(1, "Đơn vị tính không được để trống."),
  category: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  defaultPrice: z.coerce
    .number({ invalid_type_error: "Vui lòng nhập giá bán mặc định." })
    .positive("Giá bán mặc định phải > 0"),
  costPrice: z.coerce.number().min(0).default(0),
  // BranchProduct fields
  price: z.coerce
    .number({ invalid_type_error: "Vui lòng nhập giá bán tại chi nhánh." })
    .positive("Giá bán phải > 0"),
  branchCostPrice: z.coerce.number().min(0).default(0),
  quantity: z.coerce.number().int().min(0).default(0),
  minQuantity: z.coerce.number().int().min(0).default(0),
  discountPrice: z.coerce.number().min(0).optional().nullable(),
  discountPercentage: z.coerce.number().min(0).max(100).optional().nullable(),
  active: z.boolean().default(true),
  // Branch selection (create mode only)
  branchIds: z.array(z.string()).optional(),
});

// ── Component ────────────────────────────────────────────────────────────────
export default function ProductForm({
  mode = "create",
  product,
  onSubmit,
  isLoading = false,
  onModeChange,
  handleDelete,
  branches = [],
}) {
  const isReadOnly = mode === "view";
  const isCreate = mode === "create";

  const { selectedShopId, selectedIndustry } = useShop();

  // Suggest loading states
  const [suggestingSkU, setSuggestingSkU] = useState(false);
  const [suggestingBarcode, setSuggestingBarcode] = useState(false);

  const handleSuggestSku = async () => {
    if (!selectedShopId) return;
    setSuggestingSkU(true);
    try {
      const category = form.getValues("category") || undefined;
      const res = await getSuggestedSku(
        selectedShopId,
        selectedIndustry ?? "GENERAL",
        category,
      );
      const sku = res.data?.data;
      if (sku) {
        form.setValue("sku", String(sku).toUpperCase(), { shouldDirty: true });
        toast.success("Đã gợi ý mã SKU.");
      }
    } catch {
      toast.error("Không thể lấy gợi ý SKU.");
    } finally {
      setSuggestingSkU(false);
    }
  };

  const handleSuggestBarcode = async () => {
    if (!selectedShopId) return;
    setSuggestingBarcode(true);
    try {
      const category = form.getValues("category") || undefined;
      const res = await getSuggestedBarcode(
        selectedShopId,
        selectedIndustry ?? "GENERAL",
        category,
      );
      const barcode = res.data?.data;
      if (barcode) {
        form.setValue("barcode", String(barcode), { shouldDirty: true });
        toast.success("Đã gợi ý mã vạch EAN-13.");
      }
    } catch {
      toast.error("Không thể lấy gợi ý Barcode.");
    } finally {
      setSuggestingBarcode(false);
    }
  };

  // Custom select state for unit / category
  const [unitMode, setUnitMode] = useState(
    isCustomUnit(product?.unit) ? "custom" : "select",
  );
  const [categoryMode, setCategoryMode] = useState(
    isCustomCategory(product?.category) ? "custom" : "select",
  );

  const defaultBranchIds = branches.map((b) => b.id);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: product
      ? {
          name: product.name ?? "",
          sku: product.sku ?? "",
          unit: product.unit ?? "",
          category: product.category ?? "",
          barcode: product.barcode ?? "",
          description: product.description ?? "",
          supplierId: product.supplierId ?? "",
          defaultPrice: product.defaultPrice ?? 0,
          costPrice: product.costPrice ?? 0,
          price: product.price ?? 0,
          branchCostPrice: product.branchCostPrice ?? 0,
          quantity: product.quantity ?? 0,
          minQuantity: product.minQuantity ?? 0,
          discountPrice: product.discountPrice ?? null,
          discountPercentage: product.discountPercentage ?? null,
          active: product.activeInBranch ?? true,
          branchIds: defaultBranchIds,
        }
      : {
          name: "",
          sku: "",
          unit: "",
          category: "",
          barcode: "",
          description: "",
          supplierId: "",
          defaultPrice: 0,
          costPrice: 0,
          price: 0,
          branchCostPrice: 0,
          quantity: 0,
          minQuantity: 0,
          discountPrice: null,
          discountPercentage: null,
          active: true,
          branchIds: defaultBranchIds,
        },
  });

  const {
    reset,
    watch,
    formState: { isDirty },
  } = form;

  const watchedCategory = watch("category");

  useEffect(() => {
    if (product) {
      reset({
        name: product.name ?? "",
        sku: product.sku ?? "",
        unit: product.unit ?? "",
        category: product.category ?? "",
        barcode: product.barcode ?? "",
        description: product.description ?? "",
        supplierId: product.supplierId ?? "",
        defaultPrice: product.defaultPrice ?? 0,
        costPrice: product.costPrice ?? 0,
        price: product.price ?? 0,
        branchCostPrice: product.branchCostPrice ?? 0,
        quantity: product.quantity ?? 0,
        minQuantity: product.minQuantity ?? 0,
        discountPrice: product.discountPrice ?? null,
        discountPercentage: product.discountPercentage ?? null,
        active: product.activeInBranch ?? true,
        branchIds: defaultBranchIds,
      });
      setUnitMode(isCustomUnit(product.unit) ? "custom" : "select");
      setCategoryMode(isCustomCategory(product.category) ? "custom" : "select");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, reset]);

  const handleSubmit = (data) => {
    onSubmit(data);
  };

  // ── Unit select field ──────────────────────────────────────────────────────
  const UnitField = () => (
    <FormField
      control={form.control}
      name="unit"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Đơn vị tính <span className="text-red-500">*</span>
          </FormLabel>
          {isReadOnly ? (
            <ReadOnlyValue value={field.value} />
          ) : (
            <div className="flex flex-col gap-2">
              <Select
                value={
                  unitMode === "custom" ? "__custom__" : (field.value ?? "")
                }
                onValueChange={(val) => {
                  if (val === "__custom__") {
                    setUnitMode("custom");
                    field.onChange("");
                  } else {
                    setUnitMode("select");
                    field.onChange(val);
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn đơn vị tính..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PRODUCT_UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__">Tự nhập...</SelectItem>
                </SelectContent>
              </Select>
              {unitMode === "custom" && (
                <FormControl>
                  <Input
                    placeholder="Nhập đơn vị tính..."
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    autoFocus
                  />
                </FormControl>
              )}
            </div>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );

  // ── Category select field ──────────────────────────────────────────────────
  const CategoryField = () => (
    <FormField
      control={form.control}
      name="category"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Danh mục</FormLabel>
          {isReadOnly ? (
            <ReadOnlyValue value={field.value} />
          ) : (
            <div className="flex flex-col gap-2">
              <Select
                value={
                  categoryMode === "custom" ? "__custom__" : (field.value ?? "")
                }
                onValueChange={(val) => {
                  if (val === "__custom__") {
                    setCategoryMode("custom");
                    field.onChange("");
                  } else {
                    setCategoryMode("select");
                    field.onChange(val);
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__">Tự nhập...</SelectItem>
                </SelectContent>
              </Select>
              {categoryMode === "custom" && (
                <FormControl>
                  <Input
                    placeholder="Nhập danh mục..."
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    autoFocus
                  />
                </FormControl>
              )}
            </div>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );

  // ── Product info section (shared) ──────────────────────────────────────────
  const ProductInfoSection = () => (
    <div className="flex flex-col gap-4">
      {/* Tên */}
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Tên sản phẩm <span className="text-red-500">*</span>
            </FormLabel>
            {isReadOnly ? (
              <ReadOnlyValue value={field.value} />
            ) : (
              <FormControl>
                <Input placeholder="Nhập tên sản phẩm" {...field} />
              </FormControl>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* SKU & Barcode */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>
                  Mã SKU <span className="text-red-500">*</span>
                </FormLabel>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={handleSuggestSku}
                    disabled={suggestingSkU || !watchedCategory}
                    title={
                      !watchedCategory ? "Chọn danh mục trước để gợi ý SKU" : ""
                    }
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-3 h-3" />
                    {suggestingSkU
                      ? "Đang lấy..."
                      : !watchedCategory
                        ? "Chọn DM trước"
                        : "Gợi ý"}
                  </button>
                )}
              </div>
              {isReadOnly ? (
                <ReadOnlyValue value={field.value} />
              ) : (
                <FormControl>
                  <Input
                    placeholder="Ví dụ: SP_001"
                    {...field}
                    onChange={(e) =>
                      field.onChange(e.target.value.toUpperCase())
                    }
                  />
                </FormControl>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="barcode"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Mã vạch (Barcode)</FormLabel>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={handleSuggestBarcode}
                    disabled={suggestingBarcode || !watchedCategory}
                    title={
                      !watchedCategory
                        ? "Chọn danh mục trước để gợi ý Barcode"
                        : ""
                    }
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-3 h-3" />
                    {suggestingBarcode
                      ? "Đang lấy..."
                      : !watchedCategory
                        ? "Chọn DM trước"
                        : "Gợi ý EAN-13"}
                  </button>
                )}
              </div>
              {isReadOnly ? (
                <ReadOnlyValue value={field.value} />
              ) : (
                <FormControl>
                  <Input
                    placeholder="12-13 chữ số"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Danh mục & Đơn vị */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CategoryField />
        <UnitField />
      </div>

      {/* Giá mặc định shop & Giá vốn */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="defaultPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Giá bán mặc định (₫) <span className="text-red-500">*</span>
              </FormLabel>
              {isReadOnly ? (
                <ReadOnlyValue value={formatVND(field.value)} />
              ) : (
                <FormControl>
                  <Input type="number" min={0} placeholder="0" {...field} />
                </FormControl>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="costPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Giá vốn mặc định (₫)</FormLabel>
              {isReadOnly ? (
                <ReadOnlyValue value={formatVND(field.value)} />
              ) : (
                <FormControl>
                  <Input type="number" min={0} placeholder="0" {...field} />
                </FormControl>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Mô tả */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Mô tả sản phẩm</FormLabel>
            {isReadOnly ? (
              <ReadOnlyValue
                value={field.value}
                variant="multi"
                className="min-h-[5rem]"
              />
            ) : (
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Mô tả chi tiết sản phẩm..."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  // ── Branch price/stock section ─────────────────────────────────────────────
  const BranchPriceSection = () => (
    <div className="flex flex-col gap-4">
      {/* Giá bán chi nhánh & Giá vốn chi nhánh */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Giá bán tại chi nhánh (₫){" "}
                <span className="text-red-500">*</span>
              </FormLabel>
              {isReadOnly ? (
                <ReadOnlyValue value={formatVND(field.value)} />
              ) : (
                <FormControl>
                  <Input type="number" min={0} placeholder="0" {...field} />
                </FormControl>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="branchCostPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Giá vốn tại chi nhánh (₫)</FormLabel>
              {isReadOnly ? (
                <ReadOnlyValue value={formatVND(field.value)} />
              ) : (
                <FormControl>
                  <Input type="number" min={0} placeholder="0" {...field} />
                </FormControl>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Số lượng & Số lượng tối thiểu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Số lượng tồn kho</FormLabel>
              {isReadOnly ? (
                <ReadOnlyValue value={field.value} />
              ) : (
                <FormControl>
                  <Input type="number" min={0} placeholder="0" {...field} />
                </FormControl>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="minQuantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Số lượng tối thiểu (cảnh báo)</FormLabel>
              {isReadOnly ? (
                <ReadOnlyValue value={field.value} />
              ) : (
                <FormControl>
                  <Input type="number" min={0} placeholder="0" {...field} />
                </FormControl>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Giá khuyến mãi & % giảm */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="discountPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Giá khuyến mãi (₫)</FormLabel>
              {isReadOnly ? (
                <ReadOnlyValue
                  value={field.value != null ? formatVND(field.value) : null}
                />
              ) : (
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Để trống nếu không có"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="discountPercentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>% Giảm giá</FormLabel>
              {isReadOnly ? (
                <ReadOnlyValue
                  value={field.value != null ? `${field.value}%` : null}
                />
              ) : (
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Ví dụ: 10"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Kích hoạt tại chi nhánh */}
      <FormField
        control={form.control}
        name="active"
        render={({ field }) => (
          <FormItem className="flex items-center gap-3">
            <FormLabel className="mt-0">Kích hoạt tại chi nhánh</FormLabel>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isReadOnly}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );

  // ── Branch selection (create mode only) ────────────────────────────────────
  const BranchSelectionSection = () => (
    <FormField
      control={form.control}
      name="branchIds"
      render={({ field }) => {
        const selected = field.value ?? [];
        const toggleBranch = (id) => {
          if (selected.includes(id)) {
            field.onChange(selected.filter((x) => x !== id));
          } else {
            field.onChange([...selected, id]);
          }
        };
        const toggleAll = () => {
          if (selected.length === branches.length) {
            field.onChange([]);
          } else {
            field.onChange(branches.map((b) => b.id));
          }
        };
        const allChecked =
          selected.length === branches.length && branches.length > 0;
        const someChecked =
          selected.length > 0 && selected.length < branches.length;

        return (
          <FormItem>
            <div className="flex items-center justify-between mb-3">
              <FormLabel className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Phân bổ chi nhánh
              </FormLabel>
              <Badge variant="secondary" className="text-xs">
                {selected.length}/{branches.length} chi nhánh
              </Badge>
            </div>

            {branches.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Chưa có chi nhánh nào.
              </p>
            ) : (
              <div className="border rounded-md divide-y">
                {/* Select all */}
                <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
                  <Checkbox
                    id="branch-all"
                    checked={allChecked}
                    data-state={someChecked ? "indeterminate" : undefined}
                    onCheckedChange={toggleAll}
                  />
                  <label
                    htmlFor="branch-all"
                    className="text-sm font-medium cursor-pointer select-none"
                  >
                    {allChecked ? "Bỏ chọn tất cả" : "Chọn tất cả chi nhánh"}
                  </label>
                </div>
                {/* Individual branches */}
                {branches.map((branch) => (
                  <div
                    key={branch.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
                  >
                    <Checkbox
                      id={`branch-${branch.id}`}
                      checked={selected.includes(branch.id)}
                      onCheckedChange={() => toggleBranch(branch.id)}
                    />
                    <label
                      htmlFor={`branch-${branch.id}`}
                      className="flex-1 text-sm cursor-pointer select-none"
                    >
                      {branch.name}
                    </label>
                    {branch.default && (
                      <Badge variant="secondary" className="text-xs">
                        Mặc định
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );

  // ── Action buttons ─────────────────────────────────────────────────────────
  const ActionButtons = () => (
    <div className="flex justify-end gap-2 pt-2 border-t">
      {mode === "view" ? (
        <>
          <Button
            variant="outline"
            type="button"
            onClick={() => history.back()}
          >
            Quay lại
          </Button>
          {handleDelete && (
            <Button
              variant="destructive"
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
            >
              Xóa
            </Button>
          )}
          <Button
            variant="warning"
            type="button"
            onClick={() => onModeChange?.("edit")}
          >
            Chỉnh sửa
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="outline"
            type="button"
            onClick={() =>
              mode === "create" ? history.back() : onModeChange?.("view")
            }
          >
            Hủy
          </Button>
          <Button
            variant={mode === "edit" ? "warning" : "success"}
            type="submit"
            disabled={isLoading || (mode !== "create" && !isDirty)}
          >
            {isLoading
              ? "Đang xử lý..."
              : mode === "edit"
                ? "Cập nhật"
                : "Thêm sản phẩm"}
          </Button>
        </>
      )}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="w-full flex flex-col gap-6"
      >
        {isCreate ? (
          /* CREATE MODE: Tabs layout */
          <Tabs defaultValue="product" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="product">Thông tin sản phẩm</TabsTrigger>
              <TabsTrigger value="branch">Chi nhánh &amp; Giá</TabsTrigger>
            </TabsList>

            <TabsContent value="product" className="mt-4">
              <ProductInfoSection />
            </TabsContent>

            <TabsContent value="branch" className="mt-4 flex flex-col gap-6">
              {/* Branch selection */}
              <BranchSelectionSection />

              <Separator />

              {/* Branch price/stock (applies to all selected branches) */}
              <div>
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Giá &amp; Tồn kho (áp dụng cho các chi nhánh được chọn)
                </p>
                <BranchPriceSection />
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          /* EDIT/VIEW MODE: Two-section layout */
          <>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Thông tin sản phẩm
              </p>
              <ProductInfoSection />
            </div>

            <Separator />

            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Thông tin tại chi nhánh
              </p>
              <BranchPriceSection />
            </div>
          </>
        )}

        <ActionButtons />
      </form>
    </Form>
  );
}
