import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ContactMethodCard({
  icon: Icon,
  title,
  value,
  href,
  actionLabel,
  external,
}) {
  if (!value) return null;

  return (
    <Card className="h-full shadow-sm gap-5 py-5">
      <CardHeader className="px-5 pb-0">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            <CardDescription className="text-base font-semibold text-foreground break-all leading-relaxed">
              {value}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      {href && actionLabel ? (
        <CardContent className="px-5 pt-0">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="mt-1 w-full sm:w-auto"
          >
            <a
              href={href}
              {...(external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {actionLabel}
            </a>
          </Button>
        </CardContent>
      ) : null}
    </Card>
  );
}
