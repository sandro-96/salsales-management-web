import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PhoneNumbersDisplay } from "@/components/common/PhoneNumbersDisplay.jsx";

export function PhoneNumbersField({
  value,
  onChange,
  dialCode = "",
  readOnly = false,
  emptyLabel = "—",
  className,
  inputClassName,
}) {
  const { t } = useTranslation();
  const rows = Array.isArray(value) && value.length > 0 ? value : [""];

  const updateRow = (index, next) => {
    const copy = [...rows];
    copy[index] = next;
    onChange(copy);
  };

  const addRow = () => onChange([...rows, ""]);

  const removeRow = (index) => {
    if (rows.length <= 1) {
      onChange([""]);
      return;
    }
    onChange(rows.filter((_, i) => i !== index));
  };

  if (readOnly) {
    const shown = rows.map((p) => p?.trim()).filter(Boolean);
    return (
      <PhoneNumbersDisplay
        phones={shown}
        dialCode={dialCode}
        emptyLabel={emptyLabel}
        className={className}
        variant="boxed"
      />
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {rows.map((row, index) => (
        <div key={index} className="flex gap-2 items-start">
          <div
            className={cn(
              "flex min-h-10 flex-1 min-w-0 rounded-md border border-input bg-background",
              inputClassName,
            )}
          >
            {dialCode ? (
              <span className="flex min-h-10 shrink-0 items-center border-r border-input bg-muted/80 px-3 text-sm tabular-nums text-muted-foreground">
                {dialCode}
              </span>
            ) : null}
            <Input
              value={row}
              onChange={(e) => updateRow(index, e.target.value)}
              placeholder={t("common.phoneNumbers.placeholder")}
              className={cn(
                "h-10 border-0 shadow-none focus-visible:ring-0 rounded-none",
                dialCode ? "rounded-r-md" : "rounded-md",
              )}
              inputMode="tel"
              autoComplete="tel"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 h-10 w-10"
            onClick={() => removeRow(index)}
            disabled={rows.length <= 1 && !row.trim()}
            title={t("common.phoneNumbers.remove")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addRow}>
        <Plus className="h-4 w-4" />
        {t("common.phoneNumbers.add")}
      </Button>
    </div>
  );
}
