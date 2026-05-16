import React from "react";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function OrderTabBar({
  tabs,
  activeTabId,
  onSelect,
  onAdd,
  onClose,
  tables,
}) {
  const { t } = useTranslation();
  return (
    <div className="border-b flex items-center gap-0.5 px-1.5 pt-1.5 overflow-x-auto bg-muted/30">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const itemCount = tab.cart.reduce((s, i) => s + i.quantity, 0);
        const tableName =
          tab.tableId && tab.tableId !== "none"
            ? tables.find((tbl) => tbl.id === tab.tableId)?.name
            : null;
        const codeLabel = tab.displayOrderCode || null;
        const label =
          codeLabel ||
          tableName ||
          (tab.orderId
            ? t("pages.pos.tabs.placedOrderFallback")
            : t("pages.pos.tabs.draftOrder", { id: tab.id }));
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-t-md text-xs font-medium transition-colors shrink-0 ${
              isActive
                ? "bg-card border border-b-card text-foreground -mb-px z-10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span className="truncate max-w-[80px]">{label}</span>
            {itemCount > 0 && (
              <Badge
                variant={isActive ? "default" : "secondary"}
                className="h-4 min-w-4 px-1 text-[10px] justify-center"
              >
                {itemCount}
              </Badge>
            )}
            {tabs.length > 1 && (
              <span
                role="button"
                tabIndex={0}
                aria-label={t("pages.pos.tabs.closeTabAria")}
                className="ml-0.5 shrink-0 inline-flex items-center justify-center rounded p-1 -m-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity active:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(tab.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose(tab.id);
                  }
                }}
              >
                <X className="h-3.5 w-3.5 sm:h-3 sm:w-3 text-muted-foreground hover:text-destructive" />
              </span>
            )}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 ml-0.5"
        title={t("pages.pos.tabs.addTabTitle")}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
