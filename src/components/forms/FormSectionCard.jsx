import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function FormSectionCard({
  title,
  description,
  action,
  children,
  className,
}) {
  return (
    <Card className={cn("gap-0 py-0 shadow-none", className)}>
      <CardHeader className="border-b border-border/60 px-4 py-3">
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
      <CardContent className="flex flex-col gap-4 px-4 py-4">
        {children}
      </CardContent>
    </Card>
  );
}

export function FieldLabel({
  icon: Icon,
  htmlFor,
  required,
  invalid,
  children,
  className,
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className={cn(
        "flex items-center gap-1.5",
        invalid && "text-destructive",
        className,
      )}
    >
      {Icon ? (
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      ) : null}
      {children}
      {required ? <span className="text-red-500">*</span> : null}
    </Label>
  );
}
