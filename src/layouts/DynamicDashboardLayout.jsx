import React, { useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { layoutRegistry } from "../utils/layoutRegistry";
import DefaultDashboard from "../layouts/DefaultDashboard";
import { useShop } from "../hooks/useShop";
import { useShopPermissions } from "../hooks/useShopPermissions";
import { getFirstValidNavItem } from "../utils/getFirstValidNavItem";
import { filterNavByShopPermissions } from "../utils/navPermissionMap";

const DynamicDashboardLayout = ({ children }) => {
    const { device = "web", selectedIndustry, selectedRole, isShopContextReady } = useShop();
    const { hasShopPermission, hasAnyShopPermission, hasAllShopPermissions } = useShopPermissions();
    const navigate = useNavigate();
    const location = useLocation();
    const industry = selectedIndustry || "COMMON";
    const role = selectedRole || "USER";
    const config = layoutRegistry?.[industry]?.[device]?.[role];

    const Layout = config?.layout || DefaultDashboard;
    const layoutProps = config?.props || {};

    const firstNavItem = useMemo(() => {
        const filtered = filterNavByShopPermissions(layoutProps?.navItems, {
            hasShopPermission,
            hasAnyShopPermission,
            hasAllShopPermissions,
        });
        return getFirstValidNavItem(filtered);
    }, [layoutProps?.navItems, hasShopPermission, hasAnyShopPermission, hasAllShopPermissions]);

    useEffect(() => {
        if (location.pathname !== "/" || !isShopContextReady) return;
        const target = firstNavItem?.to || "/accounts";
        navigate(target, { replace: true });
    }, [location.pathname, firstNavItem, navigate, industry, device, role, isShopContextReady]);

    return <Layout {...layoutProps}>{children}</Layout>;
};

export default DynamicDashboardLayout;
