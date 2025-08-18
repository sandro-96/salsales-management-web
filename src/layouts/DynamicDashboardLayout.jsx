import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { layoutRegistry } from "../utils/layoutRegistry";
import DefaultDashboard from "../layouts/DefaultDashboard";
import { useShop } from "../hooks/useShop";
import { getFirstValidNavItem } from "../utils/getFirstValidNavItem";

const DynamicDashboardLayout = ({ children }) => {
    const { device = "web", selectedIndustry, selectedRole, isShopContextReady } = useShop();
    const navigate = useNavigate();
    const location = useLocation();
    const industry = selectedIndustry || "COMMON";
    const role = selectedRole || "USER";
    const config = layoutRegistry?.[industry]?.[device]?.[role];

    const Layout = config?.layout || DefaultDashboard;
    const layoutProps = config?.props || {};

    const firstNavItem = getFirstValidNavItem(layoutProps?.navItems);

    useEffect(() => {
        if (location.pathname === "/" && firstNavItem?.to && isShopContextReady) {
            navigate(firstNavItem.to, { replace: true });
        }
    }, [location.pathname, firstNavItem, navigate, industry, device, role, isShopContextReady]);

    return <Layout {...layoutProps}>{children}</Layout>;
};

export default DynamicDashboardLayout;
