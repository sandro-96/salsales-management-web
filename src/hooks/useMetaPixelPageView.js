import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { metaPageView } from "@/utils/metaPixel";

export function useMetaPixelPageView() {
  const location = useLocation();

  useEffect(() => {
    metaPageView({
      path: location.pathname,
    });
  }, [location.pathname]);
}

