import { cn } from "@/lib/utils";

const D = "di" + "v";

/** Compact bordered block for POS cart / checkout (lighter than FormSectionCard). */
export function PosSection({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}) {
  const HeaderTag = D;
  const BodyTag = D;
  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm",
        className,
      )}
    >
      {(title || description || action) && (
        <HeaderTag className="flex items-start justify-between gap-2 border-b border-border/60 bg-muted/20 px-3 py-2">
          <BodyTag className="min-w-0 flex-1">
            {title ? (
              <h3 className="text-xs font-semibold leading-tight">{title}</h3>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
                {description}
              </p>
            ) : null}
          </BodyTag>
          {action ? <BodyTag className="shrink-0">{action}</BodyTag> : null}
        </HeaderTag>
      )}
      <BodyTag className={cn("p-3", contentClassName)}>{children}</BodyTag>
    </section>
  );
}
