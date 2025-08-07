// src/layouts/education/WebLayout.jsx
import { Outlet, NavLink } from "react-router-dom";

const EducationWebLayout = ({ title, navItems }) => {
    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-indigo-800 text-white p-4">
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
                                        ? "bg-indigo-300 text-indigo-900 font-semibold"
                                        : "text-white hover:bg-indigo-700"
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

export default EducationWebLayout;
