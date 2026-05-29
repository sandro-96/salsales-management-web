import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MarkdownContent } from "@/components/markdown/MarkdownContent.jsx";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COLLAPSED_MAX_PX = 200;

export function StorefrontProductDescription({ content }) {
  const { t } = useTranslation();
  const contentRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [needsExpand, setNeedsExpand] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [content]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const measure = () => {
      setNeedsExpand(el.scrollHeight > COLLAPSED_MAX_PX + 4);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [content]);

  if (!content?.trim()) return null;

  const collapsed = needsExpand && !expanded;

  return (
    <section className="mt-8 border-t border-border pt-6">
      <h2 className="text-base font-semibold mb-3">
        {t("pages.storefront.product.descTitle")}
      </h2>

      <div className="relative">
        <div
          ref={contentRef}
          className={cn(
            "transition-[max-height] duration-300 ease-out",
            collapsed && "max-h-[200px] overflow-hidden",
          )}
        >
          <MarkdownContent content={content} />
        </div>

        {collapsed && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background from-40% to-transparent"
            aria-hidden
          />
        )}
      </div>

      {needsExpand && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 w-full text-primary hover:text-primary"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <>
              {t("pages.storefront.product.descSeeLess")}
              <ChevronUp className="size-4" />
            </>
          ) : (
            <>
              {t("pages.storefront.product.descSeeMore")}
              <ChevronDown className="size-4" />
            </>
          )}
        </Button>
      )}
    </section>
  );
}
