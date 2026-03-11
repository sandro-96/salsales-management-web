import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Copy, ImagePlus, Sparkles, X } from "lucide-react";
import imageCompression from "browser-image-compression";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  active: z.boolean().default(true),
});

// ── Component ────────────────────────────────────────────────────────────────
export default function ProductForm({
  mode = "create",
  product,
  onSubmit,
  isLoading = false,
  onModeChange,
  onCancel,
  handleDelete,
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

  const savedCategory = isCreate
    ? (localStorage.getItem("lastProductCategory") ?? "")
    : "";
  const savedUnit = isCreate
    ? (localStorage.getItem("lastProductUnit") ?? "")
    : "";
  const savedActive = isCreate
    ? localStorage.getItem("lastProductActive") !== "false"
    : true;

  // Custom select state for unit / category
  const [unitMode, setUnitMode] = useState(() => {
    if (product?.unit) return isCustomUnit(product.unit) ? "custom" : "select";
    if (isCreate && savedUnit)
      return isCustomUnit(savedUnit) ? "custom" : "select";
    return "select";
  });
  const [categoryMode, setCategoryMode] = useState(() => {
    if (product?.category)
      return isCustomCategory(product.category) ? "custom" : "select";
    if (isCreate && savedCategory)
      return isCustomCategory(savedCategory) ? "custom" : "select";
    return "select";
  });

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
          active: product.active ?? true,
        }
      : {
          name: "",
          sku: "",
          unit: savedUnit,
          category: savedCategory,
          barcode: "",
          description: "",
          supplierId: "",
          defaultPrice: 0,
          costPrice: 0,
          active: savedActive,
        },
  });

  const {
    reset,
    watch,
    formState: { isDirty },
  } = form;

  // ── Image upload state ───────────────────────────────────────────────────
  const MAX_IMAGES = 10;
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  // Existing image URLs to keep (user can remove individual ones)
  const [keptImages, setKeptImages] = useState(product?.images ?? []);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  // Reset images when product changes
  useEffect(() => {
    setKeptImages(product?.images ?? []);
    setFiles([]);
    setPreviews([]);
    setFileInputKey(Date.now());
  }, [product]);

  const removeExistingImage = (index) => {
    setKeptImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageChange = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const remaining = MAX_IMAGES - keptImages.length - files.length;
    if (remaining <= 0) {
      toast.error(`Tối đa ${MAX_IMAGES} ảnh.`);
      return;
    }
    const toProcess = selected.slice(0, remaining);
    if (selected.length > remaining) {
      toast.warning(
        `Chỉ thêm ${remaining} ảnh, bỏ qua ${selected.length - remaining} ảnh còn lại.`,
      );
    }

    const invalid = toProcess.filter((f) => !ALLOWED_TYPES.includes(f.type));
    if (invalid.length) {
      toast.error("Chỉ hỗ trợ JPG, PNG hoặc WEBP.");
      return;
    }

    const processed = await Promise.all(
      toProcess.map(async (f) => {
        if (f.size > 2 * 1024 * 1024) {
          try {
            const compressed = await imageCompression(f, {
              maxSizeMB: 1.5,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
            });
            return new File([compressed], f.name, { type: compressed.type });
          } catch {
            return f;
          }
        }
        return f;
      }),
    );

    setFiles((prev) => [...prev, ...processed]);
    setPreviews((prev) => [
      ...prev,
      ...processed.map((f) => URL.createObjectURL(f)),
    ]);
    setFileInputKey(Date.now());
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const imageDirty =
    files.length > 0 ||
    keptImages.length !== (product?.images?.length ?? 0) ||
    keptImages.some((url, i) => url !== (product?.images ?? [])[i]);

  const watchedCategory = watch("category");
  const watchedUnit = watch("unit");
  const watchedActive = watch("active");

  // Persist last used category, unit & active for create mode
  useEffect(() => {
    if (!isCreate) return;
    if (watchedCategory)
      localStorage.setItem("lastProductCategory", watchedCategory);
    if (watchedUnit) localStorage.setItem("lastProductUnit", watchedUnit);
    localStorage.setItem("lastProductActive", String(watchedActive));
  }, [watchedCategory, watchedUnit, watchedActive, isCreate]);

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
        active: product.active ?? true,
      });
      setUnitMode(isCustomUnit(product.unit) ? "custom" : "select");
      setCategoryMode(isCustomCategory(product.category) ? "custom" : "select");
    }
  }, [product, reset]);

  const handleSubmit = (data) => {
    onSubmit({ ...data, images: keptImages }, files);
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
        {CategoryField()}
        {UnitField()}
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

      {/* Kích hoạt sản phẩm */}
      <FormField
        control={form.control}
        name="active"
        render={({ field }) => (
          <FormItem className="flex items-center gap-3">
            <FormLabel className="mt-0">Kích hoạt sản phẩm</FormLabel>
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

  // ── Image upload section ───────────────────────────────────────────────────
  const ImageUploadSection = () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          Hình ảnh sản phẩm{" "}
          <span className="text-xs text-muted-foreground">
            (JPG, PNG, WEBP — tối đa {MAX_IMAGES} ảnh, mỗi ảnh ≤ 2MB)
          </span>
        </span>
        {!isReadOnly && keptImages.length + files.length < MAX_IMAGES && (
          <label className="cursor-pointer">
            <input
              key={fileInputKey}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleImageChange}
            />
            <span className="inline-flex items-center gap-1 text-xs text-primary border border-primary rounded px-2 py-1 hover:bg-primary/10 transition-colors">
              <ImagePlus className="w-3.5 h-3.5" />
              Thêm ảnh
            </span>
          </label>
        )}
      </div>

      {/* Existing images (view/edit mode) */}
      {keptImages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {keptImages.map((url, i) => (
            <div
              key={i}
              className="relative size-20 rounded-md overflow-hidden border"
            >
              <img
                src={url}
                alt={`product-${i}`}
                className="size-full object-cover"
              />
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => removeExistingImage(i)}
                  className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New previews */}
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((src, i) => (
            <div
              key={i}
              className="relative size-20 rounded-md overflow-hidden border"
            >
              <img
                src={src}
                alt={`preview-${i}`}
                className="size-full object-cover"
              />
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {keptImages.length === 0 && previews.length === 0 && (
        <div className="flex items-center justify-center h-20 border border-dashed rounded-md text-muted-foreground text-sm">
          Chưa có ảnh
        </div>
      )}

      {!isReadOnly && files.length > 0 && (
        <p className="text-xs text-blue-600">
          {files.length} ảnh mới sẽ được thêm vào.
        </p>
      )}
    </div>
  );

  // ── Action buttons ─────────────────────────────────────────────────────────
  const ActionButtons = () => (
    <div className="flex justify-end gap-2 pt-2 border-t sticky bottom-0 bg-background pb-1">
      {mode === "view" ? (
        <>
          <Button variant="outline" type="button" onClick={() => onCancel?.()}>
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
              mode === "create" ? onCancel?.() : onModeChange?.("view")
            }
          >
            Hủy
          </Button>
          <Button
            variant={mode === "edit" ? "warning" : "success"}
            type="submit"
            disabled={
              isLoading || (mode !== "create" && !isDirty && !imageDirty)
            }
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
        className="w-full flex flex-col gap-6 h-full justify-between p-1"
      >
        {ProductInfoSection()}

        {ImageUploadSection()}

        {ActionButtons()}
      </form>
    </Form>
  );
}
