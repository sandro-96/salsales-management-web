// src/layouts/DashboardLayout.jsx
import { Outlet, Link } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";
import {useShop} from "../hooks/useShop.js";

const DashboardLayout = () => {
    const { isOwner } = useShop();
    return (
        <div className="flex h-screen">
            <aside className="w-64 bg-gray-800 text-white p-4">
                <h2 className="text-xl font-bold mb-4">Sales Manager</h2>
                <nav>
                    <ul className="space-y-2">
                        <li><Link to="/overview">Tổng quan</Link></li>
                        <li><Link to="/products">Sản phẩm</Link></li>
                        {/* ⚙️ Chỉ hiển thị nếu là OWNER */}
                        {isOwner && (
                            <li className="pt-4 border-t border-gray-600">
                                <Link
                                    to="/shop-settings"
                                    className="text-sm text-gray-300 hover:text-white"
                                >
                                    ⚙️ Cài đặt cửa hàng
                                </Link>
                            </li>
                        )}
                    </ul>
                </nav>
            </aside>

            <main className="flex-1 p-6 bg-gray-100 overflow-auto">
                <Breadcrumbs/>
                <Outlet/>
            </main>
        </div>
    );
};

export default DashboardLayout;
