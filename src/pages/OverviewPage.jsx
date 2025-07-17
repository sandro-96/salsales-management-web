// src/pages/OverviewPage.jsx
import { useShop } from "../hooks/useShop";

const OverviewPage = () => {
    const { selectedShop, selectedRole, isOwner, isStaff, isCashier } = useShop();

    if (!selectedShop) return <p>Đang tải cửa hàng...</p>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Tổng quan cửa hàng</h1>
            <p><strong>Cửa hàng:</strong> {selectedShop.name}</p>
            <p><strong>Vai trò:</strong> {selectedRole}</p>

            {isOwner && <p className="mt-4 text-green-700">Bạn là chủ cửa hàng. Bạn có toàn quyền.</p>}
            {isStaff && <p className="mt-4 text-blue-700">Bạn là nhân viên. Có quyền quản lý sản phẩm, đơn hàng.</p>}
            {isCashier && <p className="mt-4 text-purple-700">Bạn là thu ngân. Có thể tạo đơn hàng và thanh toán.</p>}

            {/* Bạn có thể thêm component theo role tại đây */}
        </div>
    );
};

export default OverviewPage;
