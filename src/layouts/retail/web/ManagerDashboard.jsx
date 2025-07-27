// create a new file src/layouts/retail/web/ManagerDashboard.jsx
import { Outlet, NavLink } from "react-router-dom";
import { FaHome, FaChartBar, FaUsers } from "react-icons/fa";
const RetailManagerDashboard = () => {
    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-green-700 text-white p-4">
                <h1 className="text-2xl font-bold mb-6">Retail Manager</h1>
                <nav className="flex flex-col gap-4">
                    <NavLink
                        to="/overview"
                        className={({ isActive }) =>
                            isActive ? "font-semibold text-yellow-300" : "text-white"
                        }
                    >
                        <FaHome className="inline mr-2" /> Tổng quan
                    </NavLink>
                    <NavLink
                        to="/reports"
                        className={({ isActive }) =>
                            isActive ? "font-semibold text-yellow-300" : "text-white"
                        }
                    >
                        <FaChartBar className="inline mr-2" /> Báo cáo
                    </NavLink>
                    <NavLink
                        to="/staffs"
                        className={({ isActive }) =>
                            isActive ? "font-semibold text-yellow-300" : "text-white"
                        }
                    >
                        <FaUsers className="inline mr-2" /> Nhân viên
                    </NavLink>
                </nav>
            </aside>

            {/* Main content */}
            <main className="flex-1 bg-gray-100 p-6">
                <Outlet />
            </main>
        </div>
    );
}
export default RetailManagerDashboard;
// This file defines the layout for the Retail Manager Dashboard, including a sidebar with navigation links and