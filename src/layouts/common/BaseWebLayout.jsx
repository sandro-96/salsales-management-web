import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useShop } from "../../hooks/useShop";
import { FaSignOutAlt, FaCog, FaUserCircle, FaStore } from "react-icons/fa";

const navyDark = "#1B2A41";
const navyLight = "#2C3E50";
const pastelMint = "#A8DADC";
const pastelSand = "#FFE8C2";
const textLight = "#F1FAEE";
const textDark = "#1B2A41";

const BaseWebLayout = ({ title, navItems }) => {
    const { logout, user } = useAuth();
    const { selectedShop } = useShop();

    const items = Array.isArray(navItems) ? navItems : [];

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside
                className="w-full md:w-64 text-white p-4 flex flex-col"
                style={{
                    background: `linear-gradient(to bottom, ${navyDark}, ${navyLight})`
                }}
            >
                {/* Shop info */}
                <div className="flex items-center mb-6 space-x-3">
                    {selectedShop?.logoUrl ? (
                        <img
                            src={`${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}${selectedShop.logoUrl}`}
                            alt="Shop Logo"
                            className="w-10 h-10 rounded-full object-cover"
                            style={{ border: `2px solid ${pastelMint}` }}
                        />
                    ) : (
                        <FaStore size={40} style={{ color: pastelMint }} />
                    )}
                    <div>
                        <p className="font-bold text-lg">{selectedShop?.name || "Cửa hàng"}</p>
                        <p className="text-sm" style={{ color: pastelMint }}>
                            {selectedShop?.industry || "Industry"}
                        </p>
                    </div>
                </div>

                {/* Menu nav */}
                <nav className="flex flex-col gap-1 flex-1 text-sm">
                    {items.map(({ to, icon: Icon, label, onClick }) => (
                        <NavLink
                            key={to || label}
                            to={to || "#"}
                            onClick={onClick}
                            className={({ isActive }) =>
                                `flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
                                    isActive
                                        ? "font-semibold"
                                        : "hover:bg-white/10"
                                }`
                            }
                            style={({ isActive }) =>
                                isActive
                                    ? { backgroundColor: pastelSand, color: textDark }
                                    : { color: textLight }
                            }
                        >
                            <span className="mr-2">{Icon && <Icon />}</span>
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div
                    className="pt-4 mt-4 space-y-2 text-sm"
                    style={{ borderTop: `1px solid ${pastelMint}` }}
                >
                    <NavLink
                        to="/settings"
                        className="flex items-center px-4 py-2 rounded-md hover:bg-white/10 transition-colors"
                        style={{ color: textLight }}
                    >
                        <FaCog className="mr-2" style={{ color: pastelMint }} /> Cài đặt cửa hàng
                    </NavLink>

                    <NavLink
                        to="/account"
                        className="flex items-center px-4 py-2 rounded-md hover:bg-white/10 transition-colors"
                        style={{ color: textLight }}
                    >
                        <FaUserCircle className="mr-2" style={{ color: pastelMint }} /> {user?.name || "Tài khoản"}
                    </NavLink>

                    <button
                        onClick={logout}
                        className="flex items-center px-4 py-2 rounded-md hover:bg-white/10 transition-colors w-full text-left"
                        style={{ color: textLight }}
                    >
                        <FaSignOutAlt className="mr-2" style={{ color: pastelMint }} /> Đăng xuất
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 bg-gray-100 p-6">
                <h1 className="text-2xl font-bold mb-4">{title}</h1>
                <Outlet />
            </main>
        </div>
    );
};

export default BaseWebLayout;
