import { cn } from "@/lib/utils";
import { ShoppingBag, X } from "lucide-react";

/**
 * Gallery: ảnh chính lớn + dải thumbnail (khi có nhiều ảnh).
 */
export function ProductImageGallery({
  images = [],
  activeIndex = 0,
  onActiveIndexChange,
  alt = "",
  className,
  mainClassName = "aspect-square",
  emptyIcon: EmptyIcon = ShoppingBag,
  onRemoveAt,
}) {
  const list = images.filter(Boolean);
  const safeIndex =
    list.length === 0 ? 0 : Math.min(Math.max(0, activeIndex), list.length - 1);
  const mainSrc = list[safeIndex] ?? null;

  if (!list.length) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border bg-muted",
          mainClassName,
          className,
        )}
      >
        <EmptyIcon className="h-16 w-16 text-muted-foreground/40" />
      </div>
    );
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div
        className={cn(
          "w-full overflow-hidden rounded-lg border bg-muted",
          mainClassName,
        )}
      >
        <img src={mainSrc} alt={alt} className="h-full w-full object-cover" />
      </div>

      {list.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {list.map((url, i) => (
            <div key={`${url}-${i}`} className="relative shrink-0">
              <button
                type="button"
                onClick={() => onActiveIndexChange?.(i)}
                className={cn(
                  "block size-14 overflow-hidden rounded-md border-2 transition-all",
                  i === safeIndex
                    ? "border-primary ring-1 ring-primary/30"
                    : "border-transparent opacity-75 hover:opacity-100",
                )}
              >
                <img src={url} alt="" className="size-full object-cover" />
              </button>
              {onRemoveAt && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveAt(i);
                  }}
                  className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
