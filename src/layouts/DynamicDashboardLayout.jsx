// src/layouts/DynamicDashboardLayout.jsx
import { useShop } from "../hooks/useShop";
import { getDashboardComponent } from "../utils/getDashboardComponent";

const DynamicDashboardLayout = () => {
    const { selectedShop, device = "web" } = useShop();
    const LayoutComponent = getDashboardComponent(selectedShop?.type?.industry, selectedShop?.role, device);
    return <LayoutComponent />;
};

export default DynamicDashboardLayout;
