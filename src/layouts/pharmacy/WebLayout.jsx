// src/layouts/pharmacy/WebLayout.jsx
import { Outlet, NavLink } from "react-router-dom";

const PharmacyWebLayout = ({ title, navItems }) => {
    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-green-800 text-white p-4">
                <h1 className="text-2xl font-bold mb-6">{title}</h1>
                <nav className="flex flex-col gap-2">
                    {navItems.map(({ to, icon, label, onClick }) => (
                        <NavLink
                            key={to || label}
                            to={to || "#"}
                            onClick={onClick}
                            className={({ isActive }) =>
                                `flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
                                    isActive
                                        ? "bg-green-300 text-green-900 font-semibold"
                                        : "text-white hover:bg-green-700"
                                }`
                            }
                        >
                            <span className="mr-2">
                                {typeof icon === "function" ? icon() : icon}
                            </span>
                            {label}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Main content */}
            <main className="flex-1 bg-gray-100 p-6">
                <Outlet />
            </main>
        </div>
    );
};

export default PharmacyWebLayout;
