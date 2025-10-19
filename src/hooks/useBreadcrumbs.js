// src/hooks/useBreadcrumbs.js
import { useLocation, useParams, matchRoutes } from "react-router-dom";
import { routeConfig } from "../routes/routeConfig.jsx";

export const useBreadcrumbs = () => {
  const location = useLocation();
  const params = useParams();
  const matches = matchRoutes(routeConfig, location.pathname);
  if (!matches) return [];

  return matches
    .map(({ route, pathname }) => {
      const bc = route.breadcrumb ?? route.title;
      if (!bc) return null;
      const label = typeof bc === "function" ? bc(params) : bc;
      return { title: label, path: pathname };
    })
    .filter(Boolean);
};
