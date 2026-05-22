import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PRODUCT_IMAGE_ACCEPT,
  prepareProductImageFiles,
} from "@/utils/productImageFiles.js";
import {
  Bold,
  Code,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Loader2,
  Quote,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { uploadStagedVariantImages } from "@/api/productApi.js";
import { MarkdownContent } from "@/components/markdown/MarkdownContent.jsx";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  applyTextareaEdit,
  insertAtCursor,
  prefixLines,
  wrapSelection,
} from "@/utils/markdownEditor.js";

function ToolbarButton({ title, onClick, disabled, children }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
      title={title}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

/**
 * GitHub-style markdown editor: Write / Preview tabs, formatting toolbar, image upload.
 */
export function MarkdownEditor({
  value = "",
  onChange,
  onBlur,
  placeholder,
  disabled = false,
  shopId,
  className,
  minHeight = 160,
}) {
  const { t } = useTranslation();
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const historyRef = useRef([value ?? ""]);
  const historyIndexRef = useRef(0);

  const [tab, setTab] = useState("write");
  const [uploadingImage, setUploadingImage] = useState(false);

  const pushHistory = useCallback(
    (next) => {
      const hist = historyRef.current;
      const idx = historyIndexRef.current;
      const trimmed = hist.slice(0, idx + 1);
      trimmed.push(next);
      if (trimmed.length > 50) trimmed.shift();
      historyRef.current = trimmed;
      historyIndexRef.current = trimmed.length - 1;
    },
    [],
  );

  const commitEdit = useCallback(
    (editFn) => {
      const el = textareaRef.current;
      if (!el || disabled) return;
      const result = editFn(el);
      if (!result) return;
      pushHistory(result.newValue);
      onChange?.(result.newValue);
      applyTextareaEdit(
        el,
        result.newValue,
        result.selectionStart,
        result.selectionEnd,
      );
    },
    [disabled, onChange, pushHistory],
  );

  const handleChange = (e) => {
    const next = e.target.value;
    pushHistory(next);
    onChange?.(next);
  };

  const handleUndo = () => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    const prev = historyRef.current[historyIndexRef.current];
    onChange?.(prev);
    const el = textareaRef.current;
    if (el) {
      applyTextareaEdit(el, prev, prev.length, prev.length);
    }
  };

  const handleImageUpload = async (fileList) => {
    if (!shopId || !fileList?.length) return;
    const selected = Array.from(fileList);
    const { ok: processed, rejected } = await prepareProductImageFiles(selected);
    if (rejected.length) {
      toast.error(t("pages.products.form.markdown.imageTypeError"));
    }
    if (!processed.length) return;

    setUploadingImage(true);
    try {
      const res = await uploadStagedVariantImages(shopId, processed);
      const urls = res.data?.data ?? [];
      if (!urls.length) {
        toast.error(t("pages.products.form.markdown.imageUploadFailed"));
        return;
      }

      const snippets = urls
        .map((url, i) => `![${t("pages.products.form.markdown.imageAlt", { n: i + 1 })}](${url})`)
        .join("\n\n");

      commitEdit((el) => insertAtCursor(el, `${snippets}\n`));
      toast.success(t("pages.products.form.markdown.imageUploaded"));
    } catch {
      toast.error(t("pages.products.form.markdown.imageUploadFailed"));
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const insertLink = () => {
    commitEdit((el) => {
      const sel = el.value.slice(el.selectionStart, el.selectionEnd);
      if (sel) {
        return wrapSelection(el, "[", "](https://)", sel);
      }
      return insertAtCursor(el, "[text](https://)");
    });
  };

  const tabBtnClass = (active) =>
    cn(
      "rounded-t-md border border-b-0 px-3 py-1.5 text-sm font-medium transition-colors",
      active
        ? "border-border bg-background text-foreground"
        : "border-transparent bg-transparent text-muted-foreground hover:text-foreground",
    );

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-input bg-background",
        disabled && "opacity-60",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-1 border-b border-border bg-muted/30 px-1 pt-1">
        <div className="flex items-end gap-0.5">
          <button
            type="button"
            className={tabBtnClass(tab === "write")}
            onClick={() => setTab("write")}
            disabled={disabled}
          >
            {t("pages.products.form.markdown.write")}
          </button>
          <button
            type="button"
            className={tabBtnClass(tab === "preview")}
            onClick={() => setTab("preview")}
            disabled={disabled}
          >
            {t("pages.products.form.markdown.preview")}
          </button>
        </div>

        {tab === "write" && (
          <div className="flex flex-wrap items-center gap-0.5 px-1 pb-1">
            <ToolbarButton
              title={t("pages.products.form.markdown.heading")}
              disabled={disabled}
              onClick={() =>
                commitEdit((el) => prefixLines(el, "## ", t("pages.products.form.markdown.headingPlaceholder")))
              }
            >
              <Heading2 className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title={t("pages.products.form.markdown.bold")}
              disabled={disabled}
              onClick={() =>
                commitEdit((el) =>
                  wrapSelection(el, "**", "**", t("pages.products.form.markdown.bold")),
                )
              }
            >
              <Bold className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title={t("pages.products.form.markdown.italic")}
              disabled={disabled}
              onClick={() =>
                commitEdit((el) =>
                  wrapSelection(el, "_", "_", t("pages.products.form.markdown.italic")),
                )
              }
            >
              <Italic className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title={t("pages.products.form.markdown.quote")}
              disabled={disabled}
              onClick={() =>
                commitEdit((el) => prefixLines(el, "> ", t("pages.products.form.markdown.quote")))
              }
            >
              <Quote className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title={t("pages.products.form.markdown.code")}
              disabled={disabled}
              onClick={() =>
                commitEdit((el) =>
                  wrapSelection(el, "`", "`", t("pages.products.form.markdown.code")),
                )
              }
            >
              <Code className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title={t("pages.products.form.markdown.link")}
              disabled={disabled}
              onClick={insertLink}
            >
              <Link2 className="size-3.5" />
            </ToolbarButton>
            <span className="mx-0.5 h-4 w-px bg-border" aria-hidden />
            <ToolbarButton
              title={t("pages.products.form.markdown.bulletList")}
              disabled={disabled}
              onClick={() =>
                commitEdit((el) => prefixLines(el, "- ", t("pages.products.form.markdown.listItem")))
              }
            >
              <List className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title={t("pages.products.form.markdown.numberedList")}
              disabled={disabled}
              onClick={() =>
                commitEdit((el) => prefixLines(el, "1. ", t("pages.products.form.markdown.listItem")))
              }
            >
              <ListOrdered className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title={t("pages.products.form.markdown.taskList")}
              disabled={disabled}
              onClick={() =>
                commitEdit((el) => prefixLines(el, "- [ ] ", t("pages.products.form.markdown.taskItem")))
              }
            >
              <ListChecks className="size-3.5" />
            </ToolbarButton>
            {shopId && (
              <>
                <span className="mx-0.5 h-4 w-px bg-border" aria-hidden />
                <ToolbarButton
                  title={t("pages.products.form.markdown.insertImage")}
                  disabled={disabled || uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingImage ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ImagePlus className="size-3.5" />
                  )}
                </ToolbarButton>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={PRODUCT_IMAGE_ACCEPT}
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleImageUpload(e.target.files);
                    e.target.value = "";
                  }}
                />
              </>
            )}
            <ToolbarButton
              title={t("pages.products.form.markdown.undo")}
              disabled={disabled || historyIndexRef.current <= 0}
              onClick={handleUndo}
            >
              <Undo2 className="size-3.5" />
            </ToolbarButton>
          </div>
        )}
      </div>

      {tab === "write" ? (
        <textarea
          ref={textareaRef}
          value={value ?? ""}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          rows={6}
          className={cn(
            "w-full resize-y border-0 bg-transparent px-3 py-2 text-sm leading-relaxed",
            "placeholder:text-muted-foreground focus-visible:outline-none",
            "disabled:cursor-not-allowed",
          )}
          style={{ minHeight }}
        />
      ) : (
        <div
          className="min-h-[88px] overflow-auto px-3 py-2"
          style={{ minHeight }}
        >
          {value?.trim() ? (
            <MarkdownContent content={value} />
          ) : (
            <p className="text-sm text-muted-foreground italic">
              {t("pages.products.form.markdown.previewEmpty")}
            </p>
          )}
        </div>
      )}

      <p className="border-t border-border/60 px-3 py-1.5 text-xs text-muted-foreground">
        {t("pages.products.form.markdown.hint")}
      </p>
    </div>
  );
}
