// create a new file src/layouts/service/web/AdminDashboard.jsx
import { Outlet, NavLink } from "react-router-dom";
import { FaHome, FaUsers, FaCog } from "react-icons/fa";
const ServiceAdminDashboard = () => {
    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-blue-700 text-white p-4">
                <h1 className="text-2xl font-bold mb-6">Service Admin</h1>
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
                        to="/staffs"
                        className={({ isActive }) =>
                            isActive ? "font-semibold text-yellow-300" : "text-white"
                        }
                    >
                        <FaUsers className="inline mr-2" /> Nhân viên
                    </NavLink>
                    <NavLink
                        to="/settings"
                        className={({ isActive }) =>
                            isActive ? "font-semibold text-yellow-300" : "text-white"
                        }
                    >
                        <FaCog className="inline mr-2" /> Cài đặt
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
export default ServiceAdminDashboard;
// Note: Ensure to create the necessary pages for the routes defined in this dashboard, such as Overview, Staffs, and Settings.