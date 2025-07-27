// src/layouts/DynamicDashboardLayout.jsx
import { useShop } from "../hooks/useShop"; // giả sử bạn có hook lấy thông tin shop hiện tại
import { getDashboardComponent } from "../utils/getDashboardComponent";

const DynamicDashboardLayout = () => {
    const { selectedShop, device = "web" } = useShop();
    const LayoutComponent = getDashboardComponent(selectedShop.type?.industry, selectedShop?.role, device);
    return <LayoutComponent />;
};

export default DynamicDashboardLayout;
