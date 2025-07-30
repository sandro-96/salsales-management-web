// File: src/layouts/fnb/web/AdminDashboard.jsx
import { Outlet, NavLink } from "react-router-dom";
import { FaHome, FaUtensils, FaUsers } from "react-icons/fa";
import {useAuth} from "../../../hooks/useAuth.js";

const FnbAdminWeb = () => {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-red-700 text-white p-4">
        <h1 className="text-2xl font-bold mb-6">FNB Admin</h1>
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
            to="/products"
            className={({ isActive }) =>
              isActive ? "font-semibold text-yellow-300" : "text-white"
            }
          >
            <FaUtensils className="inline mr-2" /> Món ăn / Thực đơn
          </NavLink>
          <NavLink
            to="/staffs"
            className={({ isActive }) =>
              isActive ? "font-semibold text-yellow-300" : "text-white"
            }
          >
            <FaUsers className="inline mr-2" /> Nhân sự
          </NavLink>
          <NavLink
              to="#"
              onClick={(e) => {
                e.preventDefault(); // Prevent navigation
                logout(); // Call the logout function
              }}
              className={({ isActive }) =>
                  isActive ? "font-semibold text-yellow-300" : "text-white"
              }
          >
            <span className="inline mr-2">🚪</span> Đăng xuất
          </NavLink>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-100 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default FnbAdminWeb;
