import { cn } from "@/lib/utils";

/**
 * Shared list-page title block: bold h1 + optional primary icon + subtitle + right actions.
 */
export function ListPageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
  className,
  titleClassName,
}) {
  const heading = (
    <div className={cn("min-w-0 space-y-1", className)}>
      <h1
        className={cn(
          "flex min-w-0 items-center gap-2 text-2xl font-bold tracking-tight",
          titleClassName,
        )}
      >
        {Icon ? (
          <Icon className="h-6 w-6 shrink-0 text-primary" aria-hidden />
        ) : null}
        <span className="min-w-0 truncate">{title}</span>
      </h1>
      {subtitle ? (
        <div className="text-sm text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:hover:underline">
          {subtitle}
        </div>
      ) : null}
    </div>
  );

  if (actions) {
    return (
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        {heading}
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">
          {actions}
        </div>
      </div>
    );
  }

  return heading;
}
