// src/layouts/retail/RetailWebLayout.jsx
import { Outlet, NavLink } from "react-router-dom";
import { useShop } from "../../hooks/useShop";

const RetailWebLayout = ({ title, navItems }) => {
    const { selectedShop } = useShop();

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-blue-700 text-white p-4">
                <h1 className="text-2xl font-bold mb-6">{title}</h1>
                <nav className="flex flex-col gap-2">
                    {navItems.map(({ to, icon, label, onClick }) => (
                        <NavLink
                            key={to || label}
                            to={to || "#"}
                            onClick={onClick}
                            className={({ isActive }) =>
                                `flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
                                    isActive ? "bg-yellow-300 text-blue-700 font-semibold" : "text-white hover:bg-blue-600"
                                }`
                            }
                        >
                            <span className="mr-2">{icon}</span>
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

export default RetailWebLayout;