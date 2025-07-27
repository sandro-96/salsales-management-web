// create a new file src/layouts/pharmacy/pos/CashierDashboard.jsx
import { Outlet, NavLink } from "react-router-dom";
import { FaHome, FaPrescriptionBottleAlt, FaUsers } from "react-icons/fa";
const PharmacyCashierDashboard = () => {
    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-purple-700 text-white p-4">
                <h1 className="text-2xl font-bold mb-6">Pharmacy Cashier</h1>
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
                        to="/prescriptions"
                        className={({ isActive }) =>
                            isActive ? "font-semibold text-yellow-300" : "text-white"
                        }
                    >
                        <FaPrescriptionBottleAlt className="inline mr-2" /> Đơn thuốc
                    </NavLink>
                    <NavLink
                        to="/customers"
                        className={({ isActive }) =>
                            isActive ? "font-semibold text-yellow-300" : "text-white"
                        }
                    >
                        <FaUsers className="inline mr-2" /> Khách hàng
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
export default PharmacyCashierDashboard;