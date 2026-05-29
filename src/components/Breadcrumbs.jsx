import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import { cn } from "@/lib/utils";
import React from "react";

export default function Breadcrumbs() {
  const breadcrumbs = useBreadcrumbs();

  if (breadcrumbs.length <= 0) return null;

  return (
    <Breadcrumb className="min-w-0 max-w-full">
      <BreadcrumbList className="min-w-0 flex-nowrap gap-1.5 sm:gap-2.5">
        {breadcrumbs.map((bc, i) => {
          const isLast = i === breadcrumbs.length - 1;
          return (
            <React.Fragment key={bc.path}>
              <BreadcrumbItem
                className={cn(
                  "shrink-0",
                  isLast && "min-w-0 max-w-full shrink",
                )}
              >
                {isLast ? (
                  <BreadcrumbPage className="font-medium">{bc.title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={bc.path}>{bc.title}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator className="shrink-0" />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
