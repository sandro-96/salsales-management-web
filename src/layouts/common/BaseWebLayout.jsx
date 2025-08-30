import { useState, useRef, useEffect } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useShop } from "../../hooks/useShop";
import { FaSignOutAlt, FaCog, FaUserCircle, FaStore, FaBars, FaTimes } from "react-icons/fa";
import DropdownComponent from "../../components/common/Dropdown";

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

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const headerRef = useRef(null);
    const [headerHeight, setHeaderHeight] = useState(0);

    useEffect(() => {
        if (headerRef.current) {
            setHeaderHeight(headerRef.current.offsetHeight);
        }
        const handleResize = () => {
            if (headerRef.current) {
                setHeaderHeight(headerRef.current.offsetHeight);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const SidebarContent = (
        <>
            {
                selectedShop && (
                    <div className="flex items-center mb-6 space-x-3">
                        {selectedShop?.logoUrl ? (
                            <img
                                src={`${import.meta.env.VITE_API_BASE_URL.replace("/api", "")}${selectedShop.logoUrl}`}
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
                )
            }
            
            {/* Menu nav */}
            <nav className="flex flex-col gap-1 flex-1 text-sm">
                {items.map(({ to, icon: Icon, label, onClick }) => (
                    <NavLink
                        key={to || label}
                        to={to || "#"}
                        onClick={onClick}
                        className={({ isActive }) =>
                            `flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
                                isActive ? "font-semibold" : "hover:bg-white/10"
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
                {
                    console.log(user)
                }
                <DropdownComponent
                    position="top"
                    buttonLabel={
                        <div className="flex items-center text-left">
                        {user?.avatarUrl ? (
                            <img
                                src={`${import.meta.env.VITE_API_BASE_URL.replace("/api", "")}${user.avatarUrl}`}
                                alt="User Avatar"
                                className="w-8 h-8 rounded-full mr-3"
                            />
                        ) : (
                            <FaUserCircle className="w-8 h-8 mr-3" style={{ color: pastelMint }} />
                        )}
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm">{user?.fullName || "Người dùng"}</span>
                            <span className="text-xs text-gray-300">{user?.email || "email@example.com"}</span>
                        </div>
                        </div>
                    }
                    items={[
                        {
                            title: "Tài khoản",
                            icon: <FaUserCircle className="h-4 w-4" />,
                            to: "/accounts",
                        },
                        {
                            divider: true,
                            title: "Cửa hàng",
                            icon: <FaCog className="h-4 w-4" />,
                            to: "/shops",
                        },
                        {
                            divider: true,
                            title: "Đăng xuất",
                            icon: <FaSignOutAlt className="h-4 w-4" />,
                            onClick: logout,
                        },
                    ]}
                />
            </div>
        </>
    );

    return (
        <div className="min-h-screen flex">
            {/* Sidebar */}
            <aside
                className={`fixed md:static top-0 left-0 h-screen md:h-auto w-64 p-4 flex flex-col transform ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                } md:translate-x-0 transition-transform duration-300 z-50`}
                style={{
                    background: `linear-gradient(to bottom, ${navyDark}, ${navyLight})`,
                    color: textLight,
                    overflowY: "auto"
                }}
            >
                {/* Close button on mobile */}
                <div className="md:hidden flex justify-end mb-4">
                    <button onClick={() => setSidebarOpen(false)}>
                        <FaTimes size={20} style={{ color: pastelMint }} />
                    </button>
                </div>
                {SidebarContent}
            </aside>

            {/* Main content */}
            <main
                className="flex-1 bg-gray-100 pt-0 pb-6 overflow-auto"
                style={{
                    maxHeight: "100vh",
                    scrollbarGutter: "stable",
                    "--mobile-header-height": `${headerHeight}px`
                }}
            >
                <div
                    ref={headerRef}
                    className="md:hidden sticky top-0 z-40 bg-gray-100 px-4 py-3 flex items-center shadow-sm"
                    style={{ borderBottom: "1px solid #e5e7eb" }}
                >
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded bg-white shadow hover:bg-gray-50 transition-colors"
                        >
                        <FaBars size={20} />
                    </button>
                    <h1 className="flex-1 text-center font-semibold text-lg text-gray-800">
                        {title}
                    </h1>
                    <div style={{ width: 40 }} />
                </div>

                {/* Page Content */}
                <div className="px-6 pt-4">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default BaseWebLayout;
