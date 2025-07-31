import { Outlet, NavLink } from "react-router-dom";
import { FaHome, FaUtensils, FaUsers, FaShoppingCart, FaTable, FaUserFriends, FaStore, FaChartBar } from "react-icons/fa";
import { useAuth } from "../../../hooks/useAuth.js";

const navItems = [
    { to: "/overview", icon: <FaHome />, label: "Tổng quan" },
    { to: "/products", icon: <FaUtensils />, label: "Món ăn / Thực đơn" },
    { to: "/orders", icon: <FaShoppingCart />, label: "Đặt hàng" },
    { to: "/tables", icon: <FaTable />, label: "Bàn" },
    { to: "/customers", icon: <FaUserFriends />, label: "Khách hàng" },
    { to: "/branches", icon: <FaStore />, label: "Chi nhánh" },
    { to: "/reports", icon: <FaChartBar />, label: "Báo cáo" },
    { to: "/staffs", icon: <FaUsers />, label: "Nhân sự" },
];

const FnbAdminWeb = () => {
    const { logout } = useAuth();
    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            <aside className="w-full md:w-64 bg-red-700 text-white p-4">
                <h1 className="text-2xl font-bold mb-6">FNB Admin</h1>
                <nav className="flex flex-col gap-2">
                    {navItems.map(({to, icon, label}) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({isActive}) =>
                                `flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
                                    isActive ? "bg-yellow-300 text-red-700 font-semibold" : "text-white hover:bg-red-600"
                                }`
                            }
                        >
                            <span className="mr-2">{icon}</span>
                            {label}
                        </NavLink>
                    ))}
                    <NavLink
                        to="#"
                        onClick={(e) => {
                            e.preventDefault();
                            logout();
                        }}
                        className="flex items-center px-4 py-2 rounded-md text-white hover:bg-red-600 transition-colors duration-200"
                    >
                        <span className="mr-2">🚪</span> Đăng xuất
                    </NavLink>
                </nav>
            </aside>

            {/* Main content */}
            <main className="flex-1 bg-gray-100 p-6">
                <Outlet/>
            </main>
        </div>
    );
};

export default FnbAdminWeb;