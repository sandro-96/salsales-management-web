import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function OverviewKpiSkeleton() {
  return (
    <div className="min-w-0">
      <div className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-4 min-w-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="shadow-sm py-0 gap-0">
            <CardContent className="p-2.5 sm:p-6 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-3 w-16 sm:h-4 sm:w-24" />
                <Skeleton className="h-7 w-7 sm:h-9 sm:w-9 rounded-md sm:rounded-lg shrink-0" />
              </div>
              <Skeleton className="h-5 w-20 sm:h-8 sm:w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-2.5 w-32 mx-auto mt-1.5 sm:hidden" />
    </div>
  );
}

export function OverviewChartSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-72 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

export function OverviewListSkeleton({ rows = 5 }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-8 w-20" />
      </CardHeader>
      <CardContent className="px-0 space-y-0">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-6 py-3 border-t first:border-t-0"
          >
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4 max-w-[200px]" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
