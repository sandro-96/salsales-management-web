// src/layouts/DynamicDashboardLayout.jsx
import { layoutRegistry } from "../utils/layoutRegistry";
import DefaultDashboard from "../layouts/DefaultDashboard";
import { useShop } from "../hooks/useShop";

const DynamicDashboardLayout = ({ children }) => {
    const { selectedShop, device = "web" } = useShop();

    const industry = selectedShop?.industry;
    const role = selectedShop?.role;
    const config = layoutRegistry?.[industry]?.[device]?.[role];

    const Layout = config?.layout || DefaultDashboard;
    const layoutProps = config?.props || {};

    return <Layout {...layoutProps}>{children}</Layout>;
};

export default DynamicDashboardLayout;