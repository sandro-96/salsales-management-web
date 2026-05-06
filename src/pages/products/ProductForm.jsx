import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useFieldArray, useWatch, useFormContext } from "react-hook-form";
import { format } from "date-fns";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Copy,
  ImagePlus,
  Loader2,
  Plus,
  ScanLine,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import imageCompression from "browser-image-compression";
import { useShop } from "@/hooks/useShop.js";
import { useShopPermissions } from "@/hooks/useShopPermissions.js";
import { PERM } from "@/constants/shopPermissions.js";
import {
  getSuggestedSku,
  getSuggestedBarcode,
  searchProductCatalog,
  uploadStagedVariantImages,
} from "@/api/productApi.js";
import { getShopToppings } from "../../api/shopApi.js";
import BarcodeScanner from "@/components/products/BarcodeScanner.jsx";
import { lookupBarcode } from "@/utils/barcodeUtils.js";
import {
  isValidStandardGs1Barcode,
  normalizeBarcodeDigits,
  resolveBarcodeForSave,
} from "@/utils/gtinBarcode.js";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
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

// ── Variant Schema ──────────────────────────────────────────────────────────
const variantAttributeSchema = z.object({
  key: z.string(),
  value: z.string(),
});

const variantSchema = z.object({
  variantId: z.string().optional(),
  name: z.string().min(1, "Tên biến thể không được để trống"),
  sku: z.string().optional().nullable(),
  price: z.coerce.number().min(0).default(0),
  costPrice: z.coerce.number().min(0).default(0),
  images: z.array(z.string()).optional().default([]),
  attributes: z.array(variantAttributeSchema).default([]),
});

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
  trackInventory: z.boolean().default(false),
  sellByWeight: z.boolean().default(false),
  reason: z.string().optional().nullable(),
  variants: z.array(variantSchema).default([]),
  /** ID topping shop được phép chọn khi bán */
  assignedToppingIds: z.array(z.string()).default([]),
});

// ── Variant Card ─────────────────────────────────────────────────────────────
function VariantCard({
  nestIndex,
  fieldId,
  control,
  isReadOnly,
  onRemove,
  variantMedia,
  setVariantMedia,
  maxVariantImages,
  allowedImageTypes,
}) {
  const { setValue, getValues } = useFormContext();
  const [variantFileInputKey, setVariantFileInputKey] = useState(0);
  const imageUrls = useWatch({ control, name: `variants.${nestIndex}.images` }) ?? [];
  const pending = variantMedia[fieldId] ?? { files: [], previews: [] };
  const pendingCount = pending.files?.length ?? 0;
  const urlCount = Array.isArray(imageUrls) ? imageUrls.length : 0;
  const canAddMore = urlCount + pendingCount < maxVariantImages;

  const {
    fields: attrFields,
    append: appendAttr,
    remove: removeAttr,
  } = useFieldArray({ control, name: `variants.${nestIndex}.attributes` });

  const removeSavedVariantImage = (urlIdx) => {
    const list = [...(getValues(`variants.${nestIndex}.images`) ?? [])];
    list.splice(urlIdx, 1);
    setValue(`variants.${nestIndex}.images`, list, { shouldDirty: true });
  };

  const removePendingVariantImage = (pIdx) => {
    setVariantMedia((prev) => {
      const cur = prev[fieldId] ?? { files: [], previews: [] };
      const previews = [...(cur.previews ?? [])];
      const files = [...(cur.files ?? [])];
      if (previews[pIdx]) URL.revokeObjectURL(previews[pIdx]);
      previews.splice(pIdx, 1);
      files.splice(pIdx, 1);
      const next = { ...prev };
      if (files.length === 0 && previews.length === 0) delete next[fieldId];
      else next[fieldId] = { files, previews };
      return next;
    });
  };

  const handleVariantImageChange = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    const urlsNow = getValues(`variants.${nestIndex}.images`) ?? [];
    const pend = variantMedia[fieldId] ?? { files: [], previews: [] };
    const remaining = maxVariantImages - urlsNow.length - pend.files.length;
    if (remaining <= 0) {
      toast.error(`Tối đa ${maxVariantImages} ảnh / biến thể.`);
      return;
    }
    const toProcess = selected.slice(0, remaining);
    if (selected.length > remaining) {
      toast.warning(`Chỉ thêm ${remaining} ảnh cho biến thể này.`);
    }
    const invalid = toProcess.filter((f) => !allowedImageTypes.includes(f.type));
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
    setVariantMedia((prev) => {
      const cur = prev[fieldId] ?? { files: [], previews: [] };
      return {
        ...prev,
        [fieldId]: {
          files: [...cur.files, ...processed],
          previews: [
            ...cur.previews,
            ...processed.map((f) => URL.createObjectURL(f)),
          ],
        },
      };
    });
    setVariantFileInputKey((k) => k + 1);
  };

  return (
    <div className="border border-border rounded-lg p-4 flex flex-col gap-3 bg-muted/20">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Biến thể #{nestIndex + 1}</span>
        {!isReadOnly && (
          <button
            type="button"
            onClick={onRemove}
            className="text-destructive hover:text-destructive/80 p-1 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Name & SKU */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField
          control={control}
          name={`variants.${nestIndex}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">
                Tên biến thể <span className="text-red-500">*</span>
              </FormLabel>
              {isReadOnly ? (
                <ReadOnlyValue value={field.value} />
              ) : (
                <FormControl>
                  <Input placeholder="VD: Màu đỏ, Size L..." {...field} />
                </FormControl>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`variants.${nestIndex}.sku`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">SKU biến thể</FormLabel>
              {isReadOnly ? (
                <ReadOnlyValue value={field.value} />
              ) : (
                <FormControl>
                  <Input
                    placeholder="VD: SP001-RED-L"
                    {...field}
                    value={field.value ?? ""}
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
      </div>

      {/* Price & CostPrice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField
          control={control}
          name={`variants.${nestIndex}.price`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Giá bán</FormLabel>
              {isReadOnly ? (
                <ReadOnlyValue value={formatVND(field.value)} />
              ) : (
                <FormControl>
                  <NumericInput
                    placeholder="0"
                    value={String(field.value ?? "")}
                    onChange={(val) =>
                      field.onChange(val === "" ? 0 : Number(val))
                    }
                    suffix=" ₫"
                  />
                </FormControl>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`variants.${nestIndex}.costPrice`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Giá vốn</FormLabel>
              {isReadOnly ? (
                <ReadOnlyValue value={formatVND(field.value)} />
              ) : (
                <FormControl>
                  <NumericInput
                    placeholder="0"
                    value={String(field.value ?? "")}
                    onChange={(val) =>
                      field.onChange(val === "" ? 0 : Number(val))
                    }
                    suffix=" ₫"
                  />
                </FormControl>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Ảnh biến thể */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Hình ảnh biến thể ({urlCount + pendingCount}/{maxVariantImages})
          </span>
          {!isReadOnly && canAddMore && (
            <label className="cursor-pointer">
              <input
                key={variantFileInputKey}
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleVariantImageChange}
              />
              <span className="inline-flex items-center gap-1 text-xs text-primary border border-primary rounded px-2 py-0.5 hover:bg-primary/10 transition-colors">
                <ImagePlus className="w-3 h-3" />
                Thêm ảnh
              </span>
            </label>
          )}
        </div>
        {(urlCount > 0 || pendingCount > 0) && (
          <div className="flex flex-wrap gap-2">
            {(imageUrls ?? []).map((url, i) => (
              <div
                key={`u-${i}-${url}`}
                className="relative size-16 rounded-md overflow-hidden border bg-muted"
              >
                <img
                  src={url}
                  alt=""
                  className="size-full object-cover"
                />
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => removeSavedVariantImage(i)}
                    className="absolute top-0.5 right-0.5 rounded-full bg-black/60 text-white p-0.5 hover:bg-black/80"
                    aria-label="Xóa ảnh"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {(pending.previews ?? []).map((src, i) => (
              <div
                key={`p-${fieldId}-${i}`}
                className="relative size-16 rounded-md overflow-hidden border border-dashed border-primary/50"
              >
                <img src={src} alt="" className="size-full object-cover" />
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => removePendingVariantImage(i)}
                    className="absolute top-0.5 right-0.5 rounded-full bg-black/60 text-white p-0.5 hover:bg-black/80"
                    aria-label="Bỏ ảnh mới"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {!isReadOnly && urlCount === 0 && pendingCount === 0 && (
          <p className="text-xs text-muted-foreground italic">
            Chưa có ảnh riêng cho biến thể này.
          </p>
        )}
      </div>

      {/* Attributes */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Thuộc tính
          </span>
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => appendAttr({ key: "", value: "" })}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Thêm thuộc tính
            </button>
          )}
        </div>

        {attrFields.length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            {isReadOnly ? "Không có thuộc tính" : "Chưa có thuộc tính."}
          </p>
        )}

        {attrFields.map((attr, attrIdx) => (
          <div key={attr.id} className="flex gap-2 items-start">
            <FormField
              control={control}
              name={`variants.${nestIndex}.attributes.${attrIdx}.key`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  {isReadOnly ? (
                    <ReadOnlyValue value={field.value} />
                  ) : (
                    <FormControl>
                      <Input placeholder="Tên (VD: Màu sắc)" {...field} />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <span className="text-muted-foreground text-sm shrink-0 mt-2.5">
              :
            </span>
            <FormField
              control={control}
              name={`variants.${nestIndex}.attributes.${attrIdx}.value`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  {isReadOnly ? (
                    <ReadOnlyValue value={field.value} />
                  ) : (
                    <FormControl>
                      <Input placeholder="Giá trị (VD: Đỏ)" {...field} />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => removeAttr(attrIdx)}
                className="text-destructive hover:text-destructive/80 p-1 rounded shrink-0 mt-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
export default function ProductForm({
  mode = "create",
  product,
  prefill,
  onSubmit,
  isLoading = false,
  onModeChange,
  onCancel,
  handleDelete,
}) {
  const isReadOnly = mode === "view";
  const isCreate = mode === "create";

  const { selectedShopId, selectedIndustry, selectedShop } = useShop();
  const { hasShopPermission } = useShopPermissions();
  const canCreate = hasShopPermission(PERM.PRODUCT_CREATE);
  const canUpdate = hasShopPermission(PERM.PRODUCT_UPDATE);
  const canDelete = hasShopPermission(PERM.PRODUCT_DELETE);
  const toppingsFeatureOn = selectedShop?.toppingsEnabled === true;

  const [shopToppingCatalog, setShopToppingCatalog] = useState([]);

  // Suggest loading states
  const [suggestingSkU, setSuggestingSkU] = useState(false);
  const [suggestingBarcode, setSuggestingBarcode] = useState(false);

  // Barcode scanner
  const [scannerOpen, setScannerOpen] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);

  const [nameCatalogHits, setNameCatalogHits] = useState([]);
  const [nameCatalogLoading, setNameCatalogLoading] = useState(false);
  const nameCatalogTimerRef = useRef(null);

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

  const handleBarcodeDetected = async (barcode) => {
    setScannerOpen(false);
    let bcForForm = barcode;
    try {
      const resolved = resolveBarcodeForSave(barcode);
      if (resolved) bcForForm = resolved;
    } catch {
      toast.error(
        "Mã vạch không đúng chữ số kiểm tra GS1. Sửa tay trước khi lưu.",
        { id: "barcode-lookup" },
      );
    }
    form.setValue("barcode", bcForForm, { shouldDirty: true });

    // Tra cứu: catalog hệ thống
    setLookingUp(true);
    toast.info("Đang tra cứu thông tin sản phẩm...", { id: "barcode-lookup" });
    try {
      const info = await lookupBarcode(bcForForm);
      if (info) {
        if (info.name && !form.getValues("name")) {
          form.setValue("name", info.name, { shouldDirty: true });
        }
        if (info.category && !form.getValues("category")) {
          const normalizedCategory =
            typeof info.category === "string"
              ? info.category.toLowerCase()
              : info.category;
          form.setValue("category", normalizedCategory, { shouldDirty: true });
          setCategoryMode(
            isCustomCategory(normalizedCategory) ? "custom" : "select",
          );
        }
        if (info.description && !form.getValues("description")) {
          form.setValue("description", info.description, { shouldDirty: true });
        }
        toast.success(
          info.name
            ? `Đã điền: "${info.name}" từ catalog hệ thống`
            : "Quét thành công, chưa tìm thấy thông tin trên CSDL",
          { id: "barcode-lookup" },
        );
      } else {
        toast.success(
          `Quét được: ${bcForForm} — không tìm thấy thông tin trên cơ sở dữ liệu`,
          { id: "barcode-lookup" },
        );
      }
    } finally {
      setLookingUp(false);
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
  const savedTrackInventory = isCreate
    ? localStorage.getItem("lastProductTrackInventory") === "true"
    : false;

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
    if (isCreate && prefill?.category)
      return isCustomCategory(prefill.category) ? "custom" : "select";
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
          trackInventory: product.trackInventory ?? false,
          sellByWeight: product.sellByWeight ?? false,
          reason: "",
          variants: (product.variants ?? []).map((v) => ({
            variantId: v.variantId ?? undefined,
            name: v.name ?? "",
            sku: v.sku ?? "",
            price: v.price ?? 0,
            costPrice: v.costPrice ?? 0,
            images: Array.isArray(v.images) ? [...v.images] : [],
            attributes: v.attributes
              ? Object.entries(v.attributes).map(([key, value]) => ({
                  key,
                  value,
                }))
              : [],
          })),
          assignedToppingIds: [...(product.assignedToppingIds ?? [])],
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
          trackInventory: savedTrackInventory,
          sellByWeight: false,
          reason: "",
          variants: [],
          assignedToppingIds: [],
        },
  });

  // Apply prefill when it changes (scan-first flow)
  useEffect(() => {
    if (!isCreate || !prefill || Object.keys(prefill).length === 0) return;
    if (prefill.barcode)
      form.setValue("barcode", prefill.barcode, { shouldDirty: true });
    if (prefill.name)
      form.setValue("name", prefill.name, { shouldDirty: true });
    if (prefill.description)
      form.setValue("description", prefill.description, { shouldDirty: true });
    if (prefill.category) {
      form.setValue("category", prefill.category, { shouldDirty: true });
      setCategoryMode(isCustomCategory(prefill.category) ? "custom" : "select");
    }
    if (typeof prefill.trackInventory === "boolean") {
      form.setValue("trackInventory", prefill.trackInventory, {
        shouldDirty: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const {
    reset,
    watch,
    formState: { isDirty },
  } = form;

  const watchedName = useWatch({ control: form.control, name: "name" });
  const watchedAssignedToppings = useWatch({
    control: form.control,
    name: "assignedToppingIds",
  }) ?? [];

  useEffect(() => {
    if (!selectedShopId || !toppingsFeatureOn) {
      setShopToppingCatalog([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await getShopToppings(selectedShopId);
        const list = res.data?.data;
        if (!cancelled && Array.isArray(list)) {
          setShopToppingCatalog(list);
        }
      } catch {
        if (!cancelled) setShopToppingCatalog([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedShopId, toppingsFeatureOn]);

  useEffect(() => {
    if (!isCreate || isReadOnly) {
      setNameCatalogHits([]);
      setNameCatalogLoading(false);
      return;
    }
    const q = (watchedName || "").trim();
    if (q.length < 2) {
      setNameCatalogHits([]);
      setNameCatalogLoading(false);
      return;
    }
    if (nameCatalogTimerRef.current) clearTimeout(nameCatalogTimerRef.current);
    nameCatalogTimerRef.current = setTimeout(async () => {
      setNameCatalogLoading(true);
      try {
        const res = await searchProductCatalog(q, { size: 8 });
        const raw = res.data?.data;
        const list = Array.isArray(raw) ? raw : [];
        const qLower = q.toLowerCase();
        const hits = list
          .slice()
          .sort((a, b) => {
            const an = (a.name || "").toLowerCase() === qLower ? 0 : 1;
            const bn = (b.name || "").toLowerCase() === qLower ? 0 : 1;
            return an - bn;
          })
          .slice(0, 8);
        setNameCatalogHits(hits);
      } catch {
        setNameCatalogHits([]);
      } finally {
        setNameCatalogLoading(false);
      }
    }, 380);
    return () => {
      if (nameCatalogTimerRef.current)
        clearTimeout(nameCatalogTimerRef.current);
    };
  }, [watchedName, isCreate, isReadOnly]);

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({ control: form.control, name: "variants" });

  // ── Image upload state ───────────────────────────────────────────────────
  const MAX_IMAGES = 10;
  const MAX_VARIANT_IMAGES = 5;
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  // Existing image URLs to keep (user can remove individual ones)
  const [keptImages, setKeptImages] = useState(
    product?.images ?? (isCreate && prefill?.images ? prefill.images : []),
  );
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  /** fieldId (useFieldArray) → ảnh mới chưa upload staging */
  const [variantMedia, setVariantMedia] = useState({});

  // Reset images when product changes
  useEffect(() => {
    setKeptImages(
      product?.images ?? (isCreate && prefill?.images ? prefill.images : []),
    );
    setFiles([]);
    setPreviews([]);
    setFileInputKey(Date.now());
    setVariantMedia({});
  }, [product, prefill, isCreate]);

  /** Áp dụng một bản ghi catalog hệ thống (admin) vào form tạo mới. */
  const applySystemCatalogEntry = (entry) => {
    if (!entry) return;
    setNameCatalogHits([]);
    form.setValue("name", entry.name ?? "", { shouldDirty: true });
    if (entry.barcode) {
      form.setValue("barcode", entry.barcode, { shouldDirty: true });
    }
    if (entry.category) {
      form.setValue("category", entry.category, { shouldDirty: true });
      setCategoryMode(
        isCustomCategory(entry.category) ? "custom" : "select",
      );
    }
    if (entry.description != null) {
      form.setValue("description", entry.description, { shouldDirty: true });
    }
    const imgs = Array.isArray(entry.images)
      ? entry.images.filter(Boolean)
      : [];
    setKeptImages(imgs);
    setFiles([]);
    setPreviews([]);
    setFileInputKey(Date.now());
    toast.success("Đã áp dụng thông tin từ catalog hệ thống");
  };

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

  const variantImageDirty = useMemo(
    () => Object.values(variantMedia).some((v) => (v?.files?.length ?? 0) > 0),
    [variantMedia],
  );

  const watchedCategory = watch("category");
  const watchedUnit = watch("unit");
  const watchedActive = watch("active");
  const watchedTrackInventory = watch("trackInventory");
  const watchedSellByWeight = watch("sellByWeight");

  // SP bán theo cân mặc định không theo dõi tồn kho
  useEffect(() => {
    if (isReadOnly) return;
    if (watchedSellByWeight && watchedTrackInventory) {
      form.setValue("trackInventory", false, { shouldDirty: true });
    }
  }, [watchedSellByWeight, watchedTrackInventory, form, isReadOnly]);

  // Persist last used category, unit, active & trackInventory for create mode
  useEffect(() => {
    if (!isCreate) return;
    if (watchedCategory)
      localStorage.setItem("lastProductCategory", watchedCategory);
    if (watchedUnit) localStorage.setItem("lastProductUnit", watchedUnit);
    localStorage.setItem("lastProductActive", String(watchedActive));
    localStorage.setItem(
      "lastProductTrackInventory",
      String(watchedTrackInventory),
    );
  }, [
    watchedCategory,
    watchedUnit,
    watchedActive,
    watchedTrackInventory,
    isCreate,
  ]);

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
        trackInventory: product.trackInventory ?? false,
        sellByWeight: product.sellByWeight ?? false,
        variants: (product.variants ?? []).map((v) => ({
          variantId: v.variantId ?? undefined,
          name: v.name ?? "",
          sku: v.sku ?? "",
          price: v.price ?? 0,
          costPrice: v.costPrice ?? 0,
          images: Array.isArray(v.images) ? [...v.images] : [],
          attributes: v.attributes
            ? Object.entries(v.attributes).map(([key, value]) => ({
                key,
                value,
              }))
            : [],
        })),
        assignedToppingIds: [...(product.assignedToppingIds ?? [])],
      });
      setVariantMedia({});
      setUnitMode(isCustomUnit(product.unit) ? "custom" : "select");
      setCategoryMode(isCustomCategory(product.category) ? "custom" : "select");
    }
  }, [product, reset]);

  const handleSubmit = async (data) => {
    if (!selectedShopId) {
      toast.error("Chưa chọn cửa hàng.");
      return;
    }
    try {
      const mergedVariants = [];
      for (let i = 0; i < (data.variants ?? []).length; i++) {
        const v = data.variants[i];
        const { attributes, images = [], ...rest } = v;
        const attrObj = (attributes ?? []).reduce((acc, { key, value }) => {
          if (key?.trim()) acc[key.trim()] = value ?? "";
          return acc;
        }, {});
        const fieldId = variantFields[i]?.id;
        const pending = fieldId ? variantMedia[fieldId]?.files ?? [] : [];
        let imgList = [...(Array.isArray(images) ? images : []).filter(Boolean)];
        if (pending.length > 0) {
          const res = await uploadStagedVariantImages(selectedShopId, pending);
          const newUrls = res.data?.data ?? [];
          imgList = [...imgList, ...newUrls];
        }
        mergedVariants.push({
          ...rest,
          attributes: attrObj,
          images: imgList,
        });
      }
      await onSubmit(
        {
          ...data,
          images: keptImages,
          variants: mergedVariants,
          assignedToppingIds: data.assignedToppingIds ?? [],
        },
        files,
      );
      setVariantMedia({});
    } catch (e) {
      console.error(e);
      toast.error(
        e.response?.data?.message ||
          "Không lưu được sản phẩm hoặc ảnh biến thể. Vui lòng thử lại.",
      );
    }
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
            <ReadOnlyValue
              value={
                PRODUCT_UNITS.find((u) => u.value === field.value)?.label ??
                field.value
              }
            />
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
            <ReadOnlyValue
              value={
                PRODUCT_CATEGORIES.find((c) => c.value === field.value)
                  ?.label ?? field.value
              }
            />
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
                <div className="relative">
                  <Input
                    placeholder="Nhập tên — gợi ý từ catalog hệ thống (chuẩn hoá)"
                    autoComplete="off"
                    {...field}
                  />
                  {isCreate && nameCatalogLoading && (
                    <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {isCreate &&
                    !nameCatalogLoading &&
                    nameCatalogHits.length > 0 &&
                    (field.value || "").trim().length >= 2 && (
                      <div className="absolute z-30 mt-1 left-0 right-0 bg-popover border rounded-md shadow-md max-h-52 overflow-y-auto">
                        <p className="px-2 py-1.5 text-[10px] text-muted-foreground border-b">
                          Catalog hệ thống — chọn để điền nhanh tên, mã vạch, ảnh…
                        </p>
                        {nameCatalogHits.map((p) => (
                          <button
                            key={p.id || p.barcode}
                            type="button"
                            className="w-full text-left px-2.5 py-2 text-xs hover:bg-muted flex gap-2 items-start"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applySystemCatalogEntry(p)}
                          >
                            <span className="h-9 w-9 rounded border bg-muted shrink-0 overflow-hidden">
                              {p.images?.[0] ? (
                                <img
                                  src={p.images[0]}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                                  —
                                </span>
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="font-medium line-clamp-2 block">
                                {p.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {p.barcode || "—"}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              </FormControl>
            )}
            {isCreate && !isReadOnly && (
              <p className="text-[11px] text-muted-foreground">
                Gõ từ khoá để tìm trong catalog hệ thống; chọn dòng để điền nhanh form (tránh nhập trùng).
              </p>
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
                  <div className="flex items-center gap-3">
                    {/* Scan button only in edit mode — create uses scan-first flow in modal */}
                    {!isCreate && (
                      <button
                        type="button"
                        onClick={() => setScannerOpen(true)}
                        disabled={lookingUp}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {lookingUp ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <ScanLine className="w-3 h-3" />
                        )}
                        {lookingUp ? "Tra cứu..." : "Quét"}
                      </button>
                    )}
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
                  </div>
                )}
              </div>
              {isReadOnly ? (
                <ReadOnlyValue value={field.value} />
              ) : (
                <FormControl>
                  <Input
                    placeholder="12-13 chữ số (EAN/UPC)"
                    {...field}
                    value={field.value ?? ""}
                    onBlur={(e) => {
                      field.onBlur();
                      const v = (e.target.value || "").trim();
                      if (!v) return;
                      const digits = normalizeBarcodeDigits(v);
                      if (!digits) return;
                      if (
                        [8, 12, 13, 14].includes(digits.length) &&
                        !isValidStandardGs1Barcode(digits)
                      ) {
                        toast.error(
                          "Mã vạch có độ dài chuẩn GS1 nhưng sai chữ số kiểm tra. Kiểm tra lại số in trên bao bì.",
                        );
                        return;
                      }
                      if (digits.length === 12 && isValidStandardGs1Barcode(digits)) {
                        try {
                          const canon = resolveBarcodeForSave(digits);
                          if (canon && canon !== (field.value ?? "")) {
                            form.setValue("barcode", canon, { shouldDirty: true });
                            toast.info(
                              "Đã chuẩn hoá UPC-12 → EAN-13 (thêm 0 đầu) để đồng bộ với catalog.",
                            );
                          }
                        } catch {
                          /* đã báo lỗi ở trên */
                        }
                      }
                    }}
                  />
                </FormControl>
              )}
              {!isReadOnly && (
                <p className="text-[11px] text-muted-foreground">
                  EAN-8 / UPC-12 / EAN-13 / GTIN-14: hệ thống kiểm tra checksum; UPC-12
                  hợp lệ được lưu dạng EAN-13. Mã nội bộ (không đủ chuẩn) vẫn nhập được.
                </p>
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
                Giá bán mặc định <span className="text-red-500">*</span>
              </FormLabel>
              {isReadOnly ? (
                <ReadOnlyValue value={formatVND(field.value)} />
              ) : (
                <FormControl>
                  <NumericInput
                    placeholder="0"
                    value={String(field.value ?? "")}
                    onChange={(val) =>
                      field.onChange(val === "" ? 0 : Number(val))
                    }
                    suffix=" ₫"
                  />
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
              <FormLabel>Giá vốn mặc định</FormLabel>
              {isReadOnly ? (
                <ReadOnlyValue value={formatVND(field.value)} />
              ) : (
                <FormControl>
                  <NumericInput
                    placeholder="0"
                    value={String(field.value ?? "")}
                    onChange={(val) =>
                      field.onChange(val === "" ? 0 : Number(val))
                    }
                    suffix=" ₫"
                  />
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

      {/* Theo dõi tồn kho */}
      <FormField
        control={form.control}
        name="trackInventory"
        render={({ field }) => (
          <FormItem className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <FormLabel className="mt-0">Theo dõi tồn kho</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isReadOnly || watchedSellByWeight}
                />
              </FormControl>
            </div>
            {!isReadOnly && (
              <p className="text-xs text-muted-foreground pl-0 max-w-xl">
                Bật để nhập tồn kho, ngưỡng cảnh báo và hạn sử dụng theo chi
                nhánh.
              </p>
            )}
            {!isReadOnly && watchedSellByWeight && (
              <p className="text-xs text-muted-foreground pl-0 max-w-xl">
                Sản phẩm bán theo cân/trọng lượng sẽ <b>không theo dõi tồn kho</b>{" "}
                theo mặc định.
              </p>
            )}
          </FormItem>
        )}
      />

      {/* Bán theo cân / trọng lượng */}
      <FormField
        control={form.control}
        name="sellByWeight"
        render={({ field }) => (
          <FormItem className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <FormLabel className="mt-0">Bán theo cân / trọng lượng</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isReadOnly}
                />
              </FormControl>
            </div>
            {!isReadOnly && (
              <p className="text-xs text-muted-foreground pl-0 max-w-xl">
                Bật khi sản phẩm bán theo cân/trọng lượng (rau củ, thịt, nước
                ép…). Tại POS sẽ nhập số cân thay vì số lượng; giá nhân với
                khối lượng theo đơn vị đã chọn ở trên (ví dụ 30.000 ₫/kg).
              </p>
            )}
          </FormItem>
        )}
      />

      {/* Lý do thay đổi giá — chỉ hiển thị khi chỉnh sửa */}
      {!isReadOnly && !isCreate && (
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lý do thay đổi giá</FormLabel>
              <FormControl>
                <Input
                  placeholder="Lý do thay đổi giá (không bắt buộc)"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}
    </div>
  );

  // ── Price history section (view mode only) ─────────────────────────────────
  const PriceHistorySection = () => {
    const history = product?.priceHistory ?? [];
    if (!isReadOnly || history.length === 0) return null;
    return (
      <div className="flex flex-col gap-3">
        <span className="text-sm font-semibold">
          Lịch sử thay đổi giá{" "}
          <span className="text-xs text-muted-foreground font-normal">
            ({history.length} mục)
          </span>
        </span>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted text-muted-foreground border-b">
                <th className="text-left px-3 py-2 font-medium">Thời điểm</th>
                <th className="text-right px-3 py-2 font-medium">Giá cũ</th>
                <th className="text-right px-3 py-2 font-medium">Giá mới</th>
                <th className="text-right px-3 py-2 font-medium">Vốn cũ</th>
                <th className="text-right px-3 py-2 font-medium">Vốn mới</th>
                <th className="text-left px-3 py-2 font-medium">Lý do</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr
                  key={i}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                    {h.changedAt
                      ? format(new Date(h.changedAt), "dd/MM/yyyy HH:mm")
                      : "-"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {h.oldPrice != null
                      ? Number(h.oldPrice).toLocaleString("vi-VN") + " ₫"
                      : "-"}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {h.newPrice != null
                      ? Number(h.newPrice).toLocaleString("vi-VN") + " ₫"
                      : "-"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {h.oldCostPrice != null
                      ? Number(h.oldCostPrice).toLocaleString("vi-VN") + " ₫"
                      : "-"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {h.newCostPrice != null
                      ? Number(h.newCostPrice).toLocaleString("vi-VN") + " ₫"
                      : "-"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground italic">
                    {h.reason ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ── Image upload section ───────────────────────────────────────────────────
  // ── Topping gán từ danh mục shop ───────────────────────────────────────────
  const toggleAssignedTopping = (toppingId) => {
    if (!toppingId || isReadOnly) return;
    const cur = form.getValues("assignedToppingIds") ?? [];
    const next = new Set(cur);
    if (next.has(toppingId)) next.delete(toppingId);
    else next.add(toppingId);
    form.setValue("assignedToppingIds", [...next], { shouldDirty: true });
  };

  const ToppingsSection = () => {
    if (!toppingsFeatureOn) return null;
    if (isReadOnly) {
      const apps = product?.applicableToppings ?? [];
      if (!apps.length) {
        return (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">Topping áp dụng</span>
            <p className="text-xs text-muted-foreground">
              Không gán topping cho sản phẩm này.
            </p>
          </div>
        );
      }
      return (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Topping áp dụng</span>
          <ul className="text-sm space-y-1 border rounded-md p-3 bg-muted/30">
            {apps.map((t) => (
              <li key={t.toppingId}>
                {t.name}{" "}
                <span className="text-muted-foreground">
                  (+{Number(t.extraPrice).toLocaleString("vi-VN")} ₫)
                </span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-3">
        <div>
          <span className="text-sm font-semibold">Topping áp dụng</span>
          <p className="text-xs text-muted-foreground mt-0.5">
            Chọn từ danh mục topping chung của shop (nút &quot;Cài đặt topping&quot;
            trên trang sản phẩm).
          </p>
        </div>
        {!shopToppingCatalog.length ? (
          <div className="text-sm text-amber-800 border border-amber-200 bg-amber-50 rounded-md px-3 py-2">
            Chưa có topping trong danh mục shop. Hãy mở &quot;Cài đặt topping&quot;
            trên trang sản phẩm.
          </div>
        ) : (
          <div className="flex flex-col gap-2 border rounded-md p-3">
            {shopToppingCatalog.map((t) => {
              const id = t.toppingId;
              const checked = (watchedAssignedToppings ?? []).includes(id);
              return (
                <label
                  key={id}
                  className="flex items-start gap-2 text-sm cursor-pointer py-1"
                >
                  <input
                    type="checkbox"
                    className="mt-1 rounded border-gray-300"
                    checked={checked}
                    onChange={() => toggleAssignedTopping(id)}
                  />
                  <span>
                    {t.name}{" "}
                    <span className="text-muted-foreground text-xs">
                      (+{Number(t.extraPrice).toLocaleString("vi-VN")} ₫)
                    </span>
                    {t.active === false && (
                      <span className="text-xs text-amber-600 ml-1">
                        (đang tắt bán)
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const VariantsSection = () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">
          Biến thể sản phẩm{" "}
          <span className="text-xs text-muted-foreground font-normal">
            ({variantFields.length})
          </span>
        </span>
        {!isReadOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendVariant({
                variantId: undefined,
                name: "",
                sku: "",
                price: form.getValues("defaultPrice") ?? 0,
                costPrice: form.getValues("costPrice") ?? 0,
                images: [],
                attributes: [],
              })
            }
            className="flex items-center gap-1 h-8 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm biến thể
          </Button>
        )}
      </div>

      {variantFields.length === 0 ? (
        <div className="flex items-center justify-center h-14 border border-dashed rounded-md text-muted-foreground text-sm">
          {isReadOnly
            ? "Không có biến thể"
            : 'Chưa có biến thể. Nhấn "Thêm biến thể" để bắt đầu.'}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {variantFields.map((variant, index) => (
            <VariantCard
              key={variant.id}
              fieldId={variant.id}
              nestIndex={index}
              control={form.control}
              isReadOnly={isReadOnly}
              onRemove={() => {
                setVariantMedia((prev) => {
                  const next = { ...prev };
                  const pend = next[variant.id];
                  if (pend?.previews?.length) {
                    pend.previews.forEach((u) => URL.revokeObjectURL(u));
                  }
                  delete next[variant.id];
                  return next;
                });
                removeVariant(index);
              }}
              variantMedia={variantMedia}
              setVariantMedia={setVariantMedia}
              maxVariantImages={MAX_VARIANT_IMAGES}
              allowedImageTypes={ALLOWED_TYPES}
            />
          ))}
        </div>
      )}
    </div>
  );

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
          {handleDelete && canDelete && (
            <Button
              variant="destructive"
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
            >
              Xóa
            </Button>
          )}
          {canUpdate && (
            <Button
              variant="warning"
              type="button"
              onClick={() => onModeChange?.("edit")}
            >
              Chỉnh sửa
            </Button>
          )}
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
          {((mode === "create" && canCreate) ||
            (mode === "edit" && canUpdate)) && (
            <Button
              variant={mode === "edit" ? "warning" : "success"}
              type="submit"
              disabled={
                isLoading ||
                (mode !== "create" &&
                  !isDirty &&
                  !imageDirty &&
                  !variantImageDirty)
              }
            >
              {isLoading
                ? "Đang xử lý..."
                : mode === "edit"
                  ? "Cập nhật"
                  : "Thêm sản phẩm"}
            </Button>
          )}
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

        {VariantsSection()}

        {ToppingsSection()}

        {ImageUploadSection()}

        {PriceHistorySection()}

        {ActionButtons()}
      </form>

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={handleBarcodeDetected}
      />
    </Form>
  );
}
