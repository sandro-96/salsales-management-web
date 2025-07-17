// src/hooks/useBreadcrumbs.js
import { useLocation, matchRoutes } from "react-router-dom";
import { routeConfig } from "../routes/routeConfig.jsx";

export const useBreadcrumbs = () => {
    const location = useLocation();

    // matchRoutes sẽ tìm tất cả route phù hợp với URL hiện tại
    const matches = matchRoutes(routeConfig, location.pathname);

    if (!matches) return [];

    // Trả ra mảng breadcrumb { title, path }
    return matches
        .map(({ route, pathname }) => {
            const title = route.title || null;
            if (!title) return null;
            return { title, path: pathname };
        })
        .filter(Boolean); // loại bỏ null
};
