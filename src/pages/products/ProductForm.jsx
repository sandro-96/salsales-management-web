import { useEffect, useMemo, useRef, useState } from "react";
import {
  useForm,
  useFieldArray,
  useWatch,
  useFormContext,
} from "react-hook-form";
import { format } from "date-fns";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Copy,
  History,
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
import { ProductImageGallery } from "@/components/products/ProductImageGallery.jsx";
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
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownEditor } from "@/components/markdown/MarkdownEditor.jsx";
import { MarkdownContent } from "@/components/markdown/MarkdownContent.jsx";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  translateProductUnit,
  translateProductCategory,
} from "@/constants/productConstants.js";

// ── Helpers ─────────────────────────────────────────────────────────────────
const isCustomUnit = (val) =>
  !!val && !PRODUCT_UNITS.find((u) => u.value === val);
const isCustomCategory = (val) =>
  !!val && !PRODUCT_CATEGORIES.find((c) => c.value === val);

const formatVND = (val, locale = "vi-VN") =>
  val != null && val !== 0
    ? Number(val).toLocaleString(locale) + " ₫"
    : "-";

const RECENT_PRODUCT_NAMES_KEY = "recentProductNames";
const RECENT_PRODUCT_NAMES_MAX = 25;

function loadRecentProductNames() {
  try {
    const raw = localStorage.getItem(RECENT_PRODUCT_NAMES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => typeof x === "string" && x.trim().length > 0);
  } catch {
    return [];
  }
}

function rememberProductName(name) {
  const t = String(name ?? "").trim();
  if (!t) return;
  const prev = loadRecentProductNames();
  const without = prev.filter((n) => n !== t);
  const next = [t, ...without].slice(0, RECENT_PRODUCT_NAMES_MAX);
  try {
    localStorage.setItem(RECENT_PRODUCT_NAMES_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}

// ── ReadOnly display ─────────────────────────────────────────────────────────
function ReadOnlyValue({ value, variant = "single", className }) {
  const { t } = useTranslation();
  const text = value != null && value !== "" ? String(value) : "-";
  const textClass =
    variant === "multi"
      ? "whitespace-pre-line break-words line-clamp-4"
      : "truncate whitespace-nowrap";
  return (
    <div
      className={cn(
        "flex justify-between gap-2 rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-foreground",
        variant === "multi"
          ? "min-h-[5rem] items-start"
          : "min-h-[2.75rem] items-center",
        className,
      )}
    >
      <div className={cn("min-w-0 flex-1", textClass)}>{text}</div>
      {value != null && value !== "" && (
        <button
          type="button"
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={t("pages.products.form.copy")}
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard
              .writeText(String(value))
              .then(() => toast.success(t("pages.products.form.copied")))
              .catch(() => toast.error(t("pages.products.form.copyFail")));
          }}
        >
          <Copy className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

const IMAGE_ACCEPT = "image/jpeg,image/jpg,image/png,image/webp";

function ImageFileUploadTrigger({
  fileInputKey,
  onChange,
  multiple = true,
  label,
  hint,
  variant = "zone",
  className,
}) {
  const { t } = useTranslation();
  const displayLabel = label ?? t("pages.products.form.addImage");

  const input = (
    <input
      key={fileInputKey}
      type="file"
      multiple={multiple}
      accept={IMAGE_ACCEPT}
      className="sr-only"
      onChange={onChange}
    />
  );

  if (variant === "button") {
    return (
      <label
        className={cn(
          "inline-flex w-full cursor-pointer sm:w-auto",
          className,
        )}
      >
        {input}
        <span className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground sm:w-auto">
          <ImagePlus className="size-4 shrink-0 text-primary" />
          {displayLabel}
        </span>
      </label>
    );
  }

  return (
    <label
      className={cn(
        "flex min-h-[9rem] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/35 bg-muted/20 px-4 py-6 text-center transition-colors hover:border-primary/45 hover:bg-primary/5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 lg:min-h-[11rem]",
        className,
      )}
    >
      {input}
      <span className="flex size-11 items-center justify-center rounded-full bg-primary/10">
        <ImagePlus className="size-5 text-primary" />
      </span>
      <span className="text-sm font-medium text-foreground">{displayLabel}</span>
      {hint ? (
        <span className="max-w-[16rem] text-xs leading-snug text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function FormSectionCard({ title, description, action, children, className }) {
  return (
    <Card className={cn("gap-0 py-0 shadow-none", className)}>
      <CardHeader className="border-b border-border/60 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {description ? (
            <CardDescription className="text-xs leading-relaxed">
              {description}
            </CardDescription>
          ) : null}
        </div>
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-4 py-4 sm:px-5 sm:py-4">
        {children}
      </CardContent>
    </Card>
  );
}

// ── Variant Schema ──────────────────────────────────────────────────────────
const variantAttributeSchema = z.object({
  key: z.string(),
  value: z.string(),
});

function buildVariantSchema(t) {
  return z.object({
    variantId: z.string().optional(),
    name: z.string().min(1, t("pages.products.form.validation.variantNameRequired")),
    sku: z.string().optional().nullable(),
    price: z.coerce.number().min(0).default(0),
    costPrice: z.coerce.number().min(0).default(0),
    images: z.array(z.string()).optional().default([]),
    attributes: z.array(variantAttributeSchema).default([]),
  });
}

function buildFormSchema(t) {
  return z.object({
    name: z.string().min(1, t("pages.products.form.validation.nameRequired")),
    sku: z
      .string()
      .min(1, t("pages.products.form.validation.skuRequired"))
      .regex(/^[A-Z0-9_]*$/, t("pages.products.form.validation.skuFormat")),
    unit: z.string().min(1, t("pages.products.form.validation.unitRequired")),
    category: z.string().optional().nullable(),
    barcode: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    supplierId: z.string().optional().nullable(),
    defaultPrice: z.coerce
      .number({
        invalid_type_error: t("pages.products.form.validation.defaultPriceRequired"),
      })
      .positive(t("pages.products.form.validation.defaultPricePositive")),
    costPrice: z.coerce.number().min(0).default(0),
    active: z.boolean().default(true),
    trackInventory: z.boolean().default(false),
    sellByWeight: z.boolean().default(false),
    reason: z.string().optional().nullable(),
    variants: z.array(buildVariantSchema(t)).default([]),
    assignedToppingIds: z.array(z.string()).default([]),
  });
}

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
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";
  const { setValue, getValues } = useFormContext();
  const [variantFileInputKey, setVariantFileInputKey] = useState(0);
  const imageUrls =
    useWatch({ control, name: `variants.${nestIndex}.images` }) ?? [];
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
      toast.error(
        t("pages.products.form.maxVariantImages", { max: maxVariantImages }),
      );
      return;
    }
    const toProcess = selected.slice(0, remaining);
    if (selected.length > remaining) {
      toast.warning(
        t("pages.products.form.variantImagesRemaining", { count: remaining }),
      );
    }
    const invalid = toProcess.filter(
      (f) => !allowedImageTypes.includes(f.type),
    );
    if (invalid.length) {
      toast.error(t("pages.products.form.imageTypeError"));
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
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-medium">
          {t("pages.products.form.variantNumber", { n: nestIndex + 1 })}
        </span>
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
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField
          control={control}
          name={`variants.${nestIndex}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">
                {t("pages.products.form.variantName")}{" "}
                <span className="text-red-500">*</span>
              </FormLabel>
              {isReadOnly ? (
                <ReadOnlyValue value={field.value} />
              ) : (
                <FormControl>
                  <Input
                    placeholder={t("pages.products.form.variantNamePlaceholder")}
                    {...field}
                  />
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
              <FormLabel className="text-xs">
                {t("pages.products.form.variantSku")}
              </FormLabel>
              {isReadOnly ? (
                <ReadOnlyValue value={field.value} />
              ) : (
                <FormControl>
                  <Input
                    placeholder={t("pages.products.form.variantSkuPlaceholder")}
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
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField
          control={control}
          name={`variants.${nestIndex}.price`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">
                {t("pages.products.form.salePrice")}
              </FormLabel>
              {isReadOnly ? (
                <ReadOnlyValue value={formatVND(field.value, numberLocale)} />
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
              <FormLabel className="text-xs">
                {t("pages.products.form.costPrice")}
              </FormLabel>
              {isReadOnly ? (
                <ReadOnlyValue value={formatVND(field.value, numberLocale)} />
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {t("pages.products.form.variantImagesLabel", {
              current: urlCount + pendingCount,
              max: maxVariantImages,
            })}
          </span>
          {!isReadOnly && canAddMore && (
            <ImageFileUploadTrigger
              variant="button"
              fileInputKey={variantFileInputKey}
              onChange={handleVariantImageChange}
              className="w-auto shrink-0"
            />
          )}
        </div>
        {(urlCount > 0 || pendingCount > 0) && (
          <div className="flex flex-wrap gap-2">
            {(imageUrls ?? []).map((url, i) => (
              <div
                key={`u-${i}-${url}`}
                className="relative size-16 rounded-md overflow-hidden border bg-muted"
              >
                <img src={url} alt="" className="size-full object-cover" />
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => removeSavedVariantImage(i)}
                    className="absolute top-0.5 right-0.5 rounded-full bg-black/60 text-white p-0.5 hover:bg-black/80"
                    aria-label={t("pages.products.form.removeImage")}
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
                    aria-label={t("pages.products.form.discardNewImage")}
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
            {t("pages.products.form.noVariantImagesYet")}
          </p>
        )}
      </div>

      {/* Attributes */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {t("pages.products.form.attributes")}
          </span>
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => appendAttr({ key: "", value: "" })}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <Plus className="w-3 h-3" />
              {t("pages.products.form.addAttribute")}
            </button>
          )}
        </div>

        {attrFields.length === 0 && (
          <p className="text-xs text-muted-foreground italic">
            {isReadOnly
              ? t("pages.products.form.noAttributes")
              : t("pages.products.form.noAttributesYet")}
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
                      <Input
                        placeholder={t("pages.products.form.attrNamePlaceholder")}
                        {...field}
                      />
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
                      <Input
                        placeholder={t("pages.products.form.attrValuePlaceholder")}
                        {...field}
                      />
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
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";
  const formSchema = useMemo(() => buildFormSchema(t), [t]);
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

  const [nameHistoryOpen, setNameHistoryOpen] = useState(false);
  const [recentNamePickList, setRecentNamePickList] = useState([]);
  const nameHistoryWrapRef = useRef(null);

  useEffect(() => {
    if (!nameHistoryOpen) return;
    const onPointerDown = (e) => {
      if (
        nameHistoryWrapRef.current &&
        !nameHistoryWrapRef.current.contains(e.target)
      ) {
        setNameHistoryOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [nameHistoryOpen]);

  useEffect(() => {
    if (!nameHistoryOpen) return;
    const root = nameHistoryWrapRef.current?.closest(
      "[data-product-form-scroll]",
    );
    if (!root) return;
    const onScroll = () => setNameHistoryOpen(false);
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, [nameHistoryOpen]);

  useEffect(() => {
    if (!nameHistoryOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setNameHistoryOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nameHistoryOpen]);

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
        toast.success(t("pages.products.form.skuSuggested"));
      }
    } catch {
      toast.error(t("pages.products.form.skuSuggestFail"));
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
      toast.error(t("pages.products.form.barcodeChecksumInvalid"), {
        id: "barcode-lookup",
      });
    }
    form.setValue("barcode", bcForForm, { shouldDirty: true });

    // Tra cứu: catalog hệ thống
    setLookingUp(true);
    toast.info(t("pages.products.form.barcodeLookingUp"), {
      id: "barcode-lookup",
    });
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
            ? t("pages.products.form.barcodeFilledFromCatalog", {
                name: info.name,
              })
            : t("pages.products.form.barcodeScanNoCatalog"),
          { id: "barcode-lookup" },
        );
      } else {
        toast.success(
          t("pages.products.form.barcodeScannedRaw", { barcode: bcForForm }),
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
        toast.success(t("pages.products.form.barcodeSuggested"));
      }
    } catch {
      toast.error(t("pages.products.form.barcodeSuggestFail"));
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
          active: true,
          trackInventory: savedTrackInventory,
          sellByWeight: false,
          reason: "",
          variants: [],
          assignedToppingIds: [],
        },
  });

  // Apply prefill when it changes (scan-first flow hoặc clone từ SP có sẵn)
  useEffect(() => {
    if (!isCreate || !prefill || Object.keys(prefill).length === 0) return;

    if (prefill.__isClone) {
      const {
        __isClone: _clone,
        images: cloneImages,
        variants: cloneVariants,
        ...cloneRest
      } = prefill;
      const normalizedVariants = (cloneVariants ?? []).map((v) => {
        let attrs = [];
        const raw = v?.attributes;
        if (Array.isArray(raw)) {
          attrs = raw
            .filter((a) => a && typeof a === "object")
            .map((a) => ({
              key: String(a.key ?? "").trim(),
              value: a.value != null ? String(a.value) : "",
            }))
            .filter((a) => a.key);
        } else if (raw && typeof raw === "object") {
          attrs = Object.entries(raw).map(([key, value]) => ({
            key: String(key ?? "").trim(),
            value: value != null ? String(value) : "",
          }));
        }
        return {
          name: v?.name ?? "",
          sku: "",
          price: v?.price ?? 0,
          costPrice: v?.costPrice ?? 0,
          images: Array.isArray(v?.images) ? [...v.images] : [],
          attributes: attrs,
        };
      });
      form.reset({
        name: cloneRest.name ?? "",
        sku: cloneRest.sku ?? "",
        unit: cloneRest.unit ?? "",
        category: cloneRest.category ?? "",
        barcode: cloneRest.barcode ?? "",
        description: cloneRest.description ?? "",
        supplierId: cloneRest.supplierId ?? "",
        defaultPrice: cloneRest.defaultPrice ?? 0,
        costPrice: cloneRest.costPrice ?? 0,
        active: cloneRest.active !== false,
        trackInventory: !!cloneRest.trackInventory,
        sellByWeight: !!cloneRest.sellByWeight,
        reason: "",
        variants: normalizedVariants,
        assignedToppingIds: [...(cloneRest.assignedToppingIds ?? [])],
      });
      setKeptImages(
        Array.isArray(cloneImages) ? [...cloneImages] : [],
      );
      setFiles([]);
      setPreviews([]);
      setVariantMedia({});
      setFileInputKey(Date.now());
      setUnitMode(isCustomUnit(cloneRest.unit) ? "custom" : "select");
      setCategoryMode(
        isCustomCategory(cloneRest.category) ? "custom" : "select",
      );
      return;
    }

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
  const watchedAssignedToppings =
    useWatch({
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
  const [galleryIndex, setGalleryIndex] = useState(0);
  /** fieldId (useFieldArray) → ảnh mới chưa upload staging */
  const [variantMedia, setVariantMedia] = useState({});

  const galleryImages = useMemo(
    () => [...keptImages, ...previews],
    [keptImages, previews],
  );

  useEffect(() => {
    setGalleryIndex(0);
  }, [keptImages.length, previews.length, product?.id]);

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
      setCategoryMode(isCustomCategory(entry.category) ? "custom" : "select");
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
    toast.success(t("pages.products.form.catalogApplied"));
  };

  const removeExistingImage = (index) => {
    setKeptImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageChange = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const remaining = MAX_IMAGES - keptImages.length - files.length;
    if (remaining <= 0) {
      toast.error(t("pages.products.form.maxProductImages", { max: MAX_IMAGES }));
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
      toast.error(t("pages.products.form.imageTypeError"));
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

  const handleGalleryRemove = (index) => {
    const keptCount = keptImages.length;
    if (index < keptCount) {
      removeExistingImage(index);
    } else {
      removeImage(index - keptCount);
    }
    setGalleryIndex((prev) => Math.max(0, prev > index ? prev - 1 : prev === index ? 0 : prev));
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
  const watchedTrackInventory = watch("trackInventory");
  const watchedSellByWeight = watch("sellByWeight");

  // SP bán theo cân mặc định không theo dõi tồn kho
  useEffect(() => {
    if (isReadOnly) return;
    if (watchedSellByWeight && watchedTrackInventory) {
      form.setValue("trackInventory", false, { shouldDirty: true });
    }
  }, [watchedSellByWeight, watchedTrackInventory, form, isReadOnly]);

  // Persist last used category, unit & trackInventory for create mode
  useEffect(() => {
    if (!isCreate) return;
    if (watchedCategory)
      localStorage.setItem("lastProductCategory", watchedCategory);
    if (watchedUnit) localStorage.setItem("lastProductUnit", watchedUnit);
    localStorage.setItem(
      "lastProductTrackInventory",
      String(watchedTrackInventory),
    );
  }, [watchedCategory, watchedUnit, watchedTrackInventory, isCreate]);

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
      toast.error(t("pages.products.form.noShopSelected"));
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
        const pending = fieldId ? (variantMedia[fieldId]?.files ?? []) : [];
        let imgList = [
          ...(Array.isArray(images) ? images : []).filter(Boolean),
        ];
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
      rememberProductName(data.name);
      setVariantMedia({});
    } catch (e) {
      console.error(e);
      toast.error(
        e.response?.data?.message || t("pages.products.form.saveFail"),
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
            {t("pages.products.form.unit")}{" "}
            <span className="text-red-500">*</span>
          </FormLabel>
          {isReadOnly ? (
            <ReadOnlyValue
              value={translateProductUnit(t, field.value)}
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
                    <SelectValue
                      placeholder={t("pages.products.form.unitPlaceholder")}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PRODUCT_UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {translateProductUnit(t, u.value)}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__">
                    {t("pages.products.form.customEntry")}
                  </SelectItem>
                </SelectContent>
              </Select>
              {unitMode === "custom" && (
                <FormControl>
                  <Input
                    placeholder={t("pages.products.form.unitCustomPlaceholder")}
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
          <FormLabel>{t("pages.products.form.category")}</FormLabel>
          {isReadOnly ? (
            <ReadOnlyValue
              value={translateProductCategory(t, field.value)}
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
                    <SelectValue
                      placeholder={t("pages.products.form.categoryPlaceholder")}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {translateProductCategory(t, c.value)}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__">
                    {t("pages.products.form.customEntry")}
                  </SelectItem>
                </SelectContent>
              </Select>
              {categoryMode === "custom" && (
                <FormControl>
                  <Input
                    placeholder={t("pages.products.form.categoryCustomPlaceholder")}
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
    <>
      <FormSectionCard
        title={t("pages.products.form.sectionBasic")}
        description={
          isCreate && !isReadOnly
            ? t("pages.products.form.sectionBasicDesc")
            : undefined
        }
      >
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
          {CategoryField()}
          {UnitField()}
        </div>
        {!isReadOnly && isCreate && !watchedCategory && (
          <p className="rounded-md border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            {t("pages.products.form.sectionCategoryHint")}
          </p>
        )}
        <FormField
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <FormItem>
            <div className="relative z-10" ref={nameHistoryWrapRef}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <FormLabel className="sm:mt-0.5">
                  {t("pages.products.form.productName")}{" "}
                  <span className="text-red-500">*</span>
                </FormLabel>
                {!isReadOnly && (
                  <button
                    type="button"
                    aria-expanded={nameHistoryOpen}
                    className="flex shrink-0 items-center gap-1 self-start text-xs text-muted-foreground transition-colors hover:text-primary sm:self-auto"
                    onClick={() => {
                      if (!nameHistoryOpen) {
                        setRecentNamePickList(loadRecentProductNames());
                      }
                      setNameHistoryOpen((o) => !o);
                    }}
                  >
                    <History className="h-3 w-3" />
                    {t("pages.products.form.recentNamesBtn")}
                  </button>
                )}
              </div>
              {nameHistoryOpen && !isReadOnly && (
                <div
                  className="absolute right-0 top-full z-40 mt-1 w-[min(calc(100vw-2rem),20rem)] max-w-[min(100%,calc(100vw-2rem))] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
                  role="listbox"
                >
                  <p className="border-b px-2.5 py-1.5 text-[10px] text-muted-foreground">
                    {t("pages.products.form.recentNamesTitle")}
                  </p>
                  <div className="max-h-52 touch-pan-y overflow-y-auto overscroll-y-contain">
                    {recentNamePickList.length === 0 ? (
                      <p className="px-3 py-3 text-xs text-muted-foreground">
                        {t("pages.products.form.recentNamesEmpty")}
                      </p>
                    ) : (
                      recentNamePickList.map((n, idx) => (
                        <button
                          key={`${idx}-${n.slice(0, 48)}`}
                          type="button"
                          className="flex w-full items-start gap-2 px-2.5 py-2 text-left text-sm hover:bg-muted"
                          title={n}
                          role="option"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            field.onChange(n);
                            setNameHistoryOpen(false);
                          }}
                        >
                          <span className="line-clamp-2 min-w-0 flex-1">
                            {n}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {isReadOnly ? (
              <ReadOnlyValue value={field.value} />
            ) : (
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder={t("pages.products.form.namePlaceholder")}
                    autoComplete="off"
                    aria-invalid={!!fieldState.error}
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
                          {t("pages.products.form.catalogDropdownHint")}
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
                {t("pages.products.form.catalogSearchHint")}
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
      </FormSectionCard>

      <FormSectionCard
        title={t("pages.products.form.sectionCodes")}
        description={
          !isReadOnly ? t("pages.products.form.sectionCodesDesc") : undefined
        }
      >
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem className="min-w-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <FormLabel>
                  {t("pages.products.form.sku")} <span className="text-red-500">*</span>
                </FormLabel>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={handleSuggestSku}
                    disabled={suggestingSkU || !watchedCategory}
                    title={
                      !watchedCategory
                        ? t("pages.products.form.selectCategoryForSku")
                        : ""
                    }
                    className="flex shrink-0 items-center gap-1 self-start text-xs text-muted-foreground transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 sm:self-auto"
                  >
                    <Sparkles className="w-3 h-3" />
                    {suggestingSkU
                      ? t("pages.products.form.fetching")
                      : !watchedCategory
                        ? t("pages.products.form.selectCategoryFirst")
                        : t("pages.products.form.suggest")}
                  </button>
                )}
              </div>
              {isReadOnly ? (
                <ReadOnlyValue value={field.value} />
              ) : (
                <FormControl>
                  <Input
                    placeholder={t("pages.products.form.skuPlaceholder")}
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
            <FormItem className="min-w-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <FormLabel>{t("pages.products.form.barcode")}</FormLabel>
                {!isReadOnly && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:shrink-0 sm:justify-end">
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
                        {lookingUp
                          ? t("pages.products.form.scanning")
                          : t("pages.products.form.scan")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSuggestBarcode}
                      disabled={suggestingBarcode || !watchedCategory}
                      title={
                        !watchedCategory
                          ? t("pages.products.form.selectCategoryForBarcode")
                          : ""
                      }
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="w-3 h-3" />
                      {suggestingBarcode
                        ? t("pages.products.form.fetching")
                        : !watchedCategory
                          ? t("pages.products.form.selectCategoryFirst")
                          : t("pages.products.form.suggestEan13")}
                    </button>
                  </div>
                )}
              </div>
              {isReadOnly ? (
                <ReadOnlyValue value={field.value} />
              ) : (
                <FormControl>
                  <Input
                    placeholder={t("pages.products.form.barcodePlaceholder")}
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
                          t("pages.products.form.barcodeInvalidChecksum"),
                        );
                        return;
                      }
                      if (
                        digits.length === 12 &&
                        isValidStandardGs1Barcode(digits)
                      ) {
                        try {
                          const canon = resolveBarcodeForSave(digits);
                          if (canon && canon !== (field.value ?? "")) {
                            form.setValue("barcode", canon, {
                              shouldDirty: true,
                            });
                            toast.info(
                              t("pages.products.form.barcodeNormalized"),
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
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      </FormSectionCard>

      <FormSectionCard title={t("pages.products.form.sectionPricing")}>
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
        <FormField
          control={form.control}
          name="defaultPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("pages.products.form.defaultSalePrice")}{" "}
                <span className="text-red-500">*</span>
              </FormLabel>
              {isReadOnly ? (
                <ReadOnlyValue value={formatVND(field.value, numberLocale)} />
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
              <FormLabel>{t("pages.products.form.defaultCostPrice")}</FormLabel>
              {isReadOnly ? (
                <ReadOnlyValue value={formatVND(field.value, numberLocale)} />
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
            <FormLabel>{t("pages.products.form.description")}</FormLabel>
            {isReadOnly ? (
              <div
                className={cn(
                  "rounded-md border border-input bg-muted/50 px-3 py-2 text-sm",
                  !field.value?.trim() && "text-muted-foreground",
                )}
              >
                {field.value?.trim() ? (
                  <MarkdownContent
                    content={field.value}
                    className="max-h-64 overflow-auto"
                  />
                ) : (
                  "-"
                )}
              </div>
            ) : (
              <FormControl>
                <MarkdownEditor
                  shopId={selectedShopId}
                  placeholder={t("pages.products.form.descriptionPlaceholder")}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              </FormControl>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {!isReadOnly && !isCreate && (
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("pages.products.form.priceReason")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("pages.products.form.priceReasonPlaceholder")}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}
      </FormSectionCard>

      <FormSectionCard title={t("pages.products.form.sectionSettings")}>
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
      <FormField
        control={form.control}
        name="trackInventory"
        render={({ field }) => (
          <FormItem className="flex flex-col gap-1">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 sm:items-center">
              <FormLabel className="mt-0.5 leading-snug sm:mt-0">
                {t("pages.products.form.trackInventory")}
              </FormLabel>
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
                {t("pages.products.form.trackInventoryHint")}
              </p>
            )}
            {!isReadOnly && watchedSellByWeight && (
              <p className="text-xs text-muted-foreground pl-0 max-w-xl">
                {t("pages.products.form.sellByWeightDisabledHint")}
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
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 sm:items-center">
              <FormLabel className="mt-0.5 leading-snug sm:mt-0">
                {t("pages.products.form.sellByWeight")}
              </FormLabel>
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
                {t("pages.products.form.sellByWeightHint")}
              </p>
            )}
          </FormItem>
        )}
      />
      </div>
      </FormSectionCard>
    </>
  );

  // ── Price history section (view mode only) ─────────────────────────────────
  const PriceHistorySection = () => {
    const history = product?.priceHistory ?? [];
    if (!isReadOnly || history.length === 0) return null;
    return (
      <div className="flex flex-col gap-3">
        <span className="text-sm font-semibold">
          {t("pages.products.form.priceHistoryTitle")}{" "}
          <span className="text-xs text-muted-foreground font-normal">
            {t("pages.products.form.priceHistoryCount", {
              count: history.length,
            })}
          </span>
        </span>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted text-muted-foreground border-b">
                <th className="text-left px-3 py-2 font-medium">
                  {t("pages.products.form.priceHistoryColTime")}
                </th>
                <th className="text-right px-3 py-2 font-medium">
                  {t("pages.products.form.priceHistoryColOldPrice")}
                </th>
                <th className="text-right px-3 py-2 font-medium">
                  {t("pages.products.form.priceHistoryColNewPrice")}
                </th>
                <th className="text-right px-3 py-2 font-medium">
                  {t("pages.products.form.priceHistoryColOldCost")}
                </th>
                <th className="text-right px-3 py-2 font-medium">
                  {t("pages.products.form.priceHistoryColNewCost")}
                </th>
                <th className="text-left px-3 py-2 font-medium">
                  {t("pages.products.form.priceHistoryColReason")}
                </th>
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
                      ? Number(h.oldPrice).toLocaleString(numberLocale) + " ₫"
                      : "-"}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {h.newPrice != null
                      ? Number(h.newPrice).toLocaleString(numberLocale) + " ₫"
                      : "-"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {h.oldCostPrice != null
                      ? Number(h.oldCostPrice).toLocaleString(numberLocale) + " ₫"
                      : "-"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {h.newCostPrice != null
                      ? Number(h.newCostPrice).toLocaleString(numberLocale) + " ₫"
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
            <span className="text-sm font-semibold">
              {t("pages.products.form.toppingsSection")}
            </span>
            <p className="text-xs text-muted-foreground">
              {t("pages.products.form.noToppingsAssigned")}
            </p>
          </div>
        );
      }
      return (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">
            {t("pages.products.form.toppingsSection")}
          </span>
          <ul className="text-sm space-y-1 border rounded-md p-3 bg-muted/30">
            {apps.map((top) => (
              <li key={top.toppingId}>
                {top.name}{" "}
                <span className="text-muted-foreground">
                  (+{Number(top.extraPrice).toLocaleString(numberLocale)} ₫)
                </span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return (
      <FormSectionCard
        title={t("pages.products.form.toppingsSection")}
        description={t("pages.products.form.toppingsIntro")}
      >
        {!shopToppingCatalog.length ? (
          <div className="text-sm text-amber-800 border border-amber-200 bg-amber-50 rounded-md px-3 py-2 dark:text-amber-200 dark:border-amber-500/40 dark:bg-amber-500/10">
            {t("pages.products.form.emptyToppingsCatalog")}
          </div>
        ) : (
          <div className="flex flex-col gap-2 border rounded-md p-3">
            {shopToppingCatalog.map((top) => {
              const id = top.toppingId;
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
                    {top.name}{" "}
                    <span className="text-muted-foreground text-xs">
                      (+{Number(top.extraPrice).toLocaleString(numberLocale)} ₫)
                    </span>
                    {top.active === false && (
                      <span className="text-xs text-amber-600 ml-1">
                        {t("pages.products.form.toppingInactive")}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </FormSectionCard>
    );
  };

  const addVariantButton = !isReadOnly ? (
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
      className="h-8 gap-1 text-xs"
    >
      <Plus className="w-3.5 h-3.5" />
      {t("pages.products.form.addVariant")}
    </Button>
  ) : null;

  const VariantsSection = () => (
    <FormSectionCard
      title={t("pages.products.form.variantsSection")}
      description={
        !isReadOnly && variantFields.length === 0
          ? t("pages.products.form.noVariantsHint")
          : undefined
      }
      action={
        <span className="text-xs text-muted-foreground tabular-nums">
          {variantFields.length}
        </span>
      }
    >
      {!isReadOnly ? (
        <div className="flex justify-end">{addVariantButton}</div>
      ) : null}

      {variantFields.length === 0 ? (
        <div className="flex h-16 items-center justify-center rounded-md border border-dashed px-3 text-center text-sm text-muted-foreground">
          {isReadOnly ? t("pages.products.form.noVariants") : null}
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
    </FormSectionCard>
  );

  const ImageUploadSection = () => {
    const canAddMore =
      !isReadOnly && keptImages.length + files.length < MAX_IMAGES;
    const imageHint = t("pages.products.form.maxImagesHintShort", {
      max: MAX_IMAGES,
    });

    return (
      <FormSectionCard
        title={t("pages.products.form.imagesSection")}
        description={imageHint}
      >
        {galleryImages.length > 0 ? (
          <div className="flex flex-col gap-3">
            <ProductImageGallery
              images={galleryImages}
              activeIndex={galleryIndex}
              onActiveIndexChange={setGalleryIndex}
              alt={watch("name") || "product"}
              mainClassName="aspect-[4/3] max-h-52 w-full lg:max-h-64"
              onRemoveAt={!isReadOnly ? handleGalleryRemove : undefined}
            />
            {canAddMore && (
              <ImageFileUploadTrigger
                variant="button"
                fileInputKey={fileInputKey}
                onChange={handleImageChange}
              />
            )}
          </div>
        ) : canAddMore ? (
          <ImageFileUploadTrigger
            fileInputKey={fileInputKey}
            onChange={handleImageChange}
            hint={imageHint}
          />
        ) : (
          <div className="flex h-36 items-center justify-center rounded-md border border-dashed bg-muted/20 text-sm text-muted-foreground lg:h-44">
            {t("pages.products.form.noProductImages")}
          </div>
        )}

        {!isReadOnly && files.length > 0 && (
          <p className="text-xs text-blue-600">
            {t("pages.products.form.newImagesPending", { count: files.length })}
          </p>
        )}
      </FormSectionCard>
    );
  };

  // ── Action buttons ─────────────────────────────────────────────────────────
  const ActionButtons = () => (
    <div className="sticky bottom-0 z-40 -mx-4 mt-auto flex flex-col gap-2 border-t border-border bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:mx-0 sm:flex-row sm:justify-end sm:px-6 sm:pb-4 sm:pt-3 [&_button]:w-full sm:[&_button]:w-auto">
      {mode === "view" ? (
        <>
          <Button variant="outline" type="button" onClick={() => onCancel?.()}>
            {t("pages.products.form.back")}
          </Button>
          {handleDelete && canDelete && (
            <Button
              variant="destructive"
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {t("pages.products.form.delete")}
            </Button>
          )}
          {canUpdate && (
            <Button
              variant="warning"
              type="button"
              onClick={() => onModeChange?.("edit")}
            >
              {t("pages.products.form.edit")}
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
            {t("pages.products.form.cancel")}
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
                ? t("pages.products.form.processing")
                : mode === "edit"
                  ? t("pages.products.form.update")
                  : t("pages.products.form.addProduct")}
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
        className="flex min-h-full w-full flex-col gap-4 pb-2"
      >
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_272px]">
          <div className="order-2 flex min-w-0 flex-col gap-4 lg:order-1">
            {ProductInfoSection()}
          </div>
          <div className="order-1 lg:sticky lg:top-2 lg:order-2 lg:self-start">
            {ImageUploadSection()}
          </div>
        </div>

        {VariantsSection()}

        {ToppingsSection()}

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
