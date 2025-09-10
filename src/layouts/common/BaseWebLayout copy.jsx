import { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useShop } from "../../hooks/useShop";
import {
  FaSignOutAlt,
  FaCog,
  FaUserCircle,
  FaPlus,
  FaStore,
  FaBars,
  FaTimes, // Thêm FaTimes
} from "react-icons/fa";
import DropdownComponent from "../../components/common/Dropdown";

const navyDark = "#1B2A41";
const navyLight = "#2C3E50";
const pastelMint = "#A8DADC";
const pastelSand = "#FFE8C2";
const textLight = "#F1FAEE";
const textDark = "#1B2A41";

const BaseWebLayout = ({ title, navItems }) => {
  const { logout, user } = useAuth();
  const { selectedShop, shops, setSelectedShop } = useShop();
  const items = Array.isArray(navItems) ? navItems : [];
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const shopItems = shops.map((shop) => ({
    title: shop.name,
    avatar: shop.logoUrl
      ? `${import.meta.env.VITE_API_BASE_URL.replace("/api", "")}${
          shop.logoUrl
        }`
      : null,
    icon: <FaStore />,
    onClick: () => {
      if (shop.id !== selectedShop?.id) {
        setSelectedShop(shop);
        navigate(`overview`);
      }
    },
  }));

  const SidebarContent = (
    <>
      <div className="flex flex-col border-b border-zinc-600 p-4">
        <DropdownComponent
          position="bottom"
          buttonLabel={
            <div className="flex min-w-0 items-center gap-3">
              <span className="size-6 inline-grid shrink-0 align-middle [--avatar-radius:50%] outline -outline-offset-1 outline-black/10 dark:outline-white/10 rounded-(--avatar-radius) *:rounded-(--avatar-radius)">
                {selectedShop?.logoUrl ? (
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL.replace(
                      "/api",
                      ""
                    )}${selectedShop?.logoUrl}`}
                    alt="Shop Avatar"
                    className="w-full h-full"
                  />
                ) : (
                  <FaStore
                    className="w-full h-full"
                    style={{ color: pastelMint }}
                  />
                )}
              </span>
              <div className="min-w-0 text-left">
                <span className="block truncate font-semibold text-sm">
                  {selectedShop?.name || "Cửa hàng"}
                </span>
              </div>
            </div>
          }
          items={[
            {
              title: "Settings",
              icon: <FaCog className="h-4 w-4" />,
              to: "/shops" + (selectedShop ? `/${selectedShop.id}` : ""),
            },
            ...shopItems,
            shops.length > 0 && {
              divider: true,
              title: "New Shop",
              icon: <FaPlus className="h-3 w-3" />,
              to: "/shops/create",
            },
          ]}
        />
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        <div data-slot="section" className="flex flex-col gap-0.5">
          {items.map(({ to, icon: Icon, label, onClick }) => (
            <NavLink
              key={to || label}
              to={to || "#"}
              onClick={onClick}
              className="flex w-full items-center gap-3 hover:bg-white/20 rounded-lg px-2 py-2.5 text-left text-base/6 font-medium text-zinc-950 sm:py-2 sm:text-sm/5"
              style={({ isActive }) =>
                isActive
                  ? { backgroundColor: pastelSand, color: textDark }
                  : { color: textLight }
              }
            >
              {Icon && <Icon />}
              {label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="max-lg:hidden flex flex-col border-t border-zinc-600 p-4">
        <DropdownComponent
          position="top"
          buttonLabel={
            <div className="flex min-w-0 items-center gap-3">
              <span className="size-10 inline-grid shrink-0 align-middle [--avatar-radius:20%] outline -outline-offset-1 outline-black/10 dark:outline-white/10 rounded-(--avatar-radius) *:rounded-(--avatar-radius)">
                {user?.avatarUrl ? (
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL.replace(
                      "/api",
                      ""
                    )}${user.avatarUrl}`}
                    alt="User Avatar"
                    className="w-full h-full"
                  />
                ) : (
                  <FaUserCircle
                    className="w-full h-full"
                    style={{ color: pastelMint }}
                  />
                )}
              </span>
              <div className="min-w-0 text-left">
                <span className="block truncate font-semibold text-sm">
                  {user?.fullName || "Người dùng"}
                </span>
                <span className="block truncate text-xs text-gray-300">
                  {user?.email || "email@example.com"}
                </span>
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
    <div className="relative isolate flex min-h-svh w-full bg-white max-lg:flex-col lg:bg-zinc-100">
      <header
        className="flex items-center p-3 lg:hidden gap-3"
        style={{
          background: `linear-gradient(to bottom, ${navyDark}, ${navyLight})`,
        }}
      >
        <span className="relative">
          <button
            className="p-2 rounded hover:bg-gray-800 transition-colors cursor-pointer"
            onClick={() => setSidebarOpen(true)} // Mở sidebar
          >
            <FaBars size={20} color="white" />
          </button>
        </span>
        <span className="w-full font-medium text-white">{title}</span>
        <span className="">
          <DropdownComponent
            position="bottom"
            lrPosition="right"
            hideDownIcon={true}
            buttonLabel={
              <div className="flex min-w-0 items-center gap-3">
                <span className="size-6 inline-grid shrink-0 align-middle [--avatar-radius:20%] outline -outline-offset-1 outline-black/10 dark:outline-white/10 rounded-(--avatar-radius) *:rounded-(--avatar-radius)">
                  {user?.avatarUrl ? (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL.replace(
                        "/api",
                        ""
                      )}${user.avatarUrl}`}
                      alt="User Avatar"
                      className="w-full h-full"
                    />
                  ) : (
                    <FaUserCircle
                      className="w-full h-full"
                      style={{ color: pastelMint }}
                    />
                  )}
                </span>
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
        </span>
      </header>

      {/* Sidebar và Backdrop cho mobile */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)} // Đóng sidebar khi nhấp vào backdrop
          />
          {/* Sidebar */}
          <div className="lg:hidden fixed inset-y-0 left-0 w-64 z-50 transition-transform duration-300 ease-in-out transform translate-x-0">
            <nav
              className="flex h-full min-h-0 flex-col pt-5"
              style={{
                background: `linear-gradient(to bottom, ${navyDark}, ${navyLight})`,
                color: textLight,
              }}
            >
              {SidebarContent}
              <button
                className="p-2 rounded hover:bg-gray-800 transition-colors cursor-pointer absolute top-2 right-2"
                onClick={() => setSidebarOpen(false)} // Đóng sidebar
              >
                <FaTimes size={20} color="white" /> {/* Sử dụng FaTimes */}
              </button>
            </nav>
          </div>
        </>
      )}

      {/* Sidebar cố định cho desktop */}
      <div className="fixed inset-y-0 left-0 w-64 max-lg:hidden">
        <nav
          className="flex h-full min-h-0 flex-col"
          style={{
            background: `linear-gradient(to bottom, ${navyDark}, ${navyLight})`,
            color: textLight,
          }}
        >
          {SidebarContent}
        </nav>
      </div>

      <main
        className="flex flex-1 flex-col pb-2 lg:min-w-0 lg:pt-2 lg:pr-2 lg:pl-64"
        style={{
          background: `linear-gradient(to bottom, ${navyDark}, ${navyLight})`,
        }}
      >
        <div className="grow p-6 lg:rounded-lg lg:bg-white lg:p-10 lg:shadow-xs lg:ring-1 lg:ring-zinc-950/5 bg-white relative">
          <div className="mx-auto max-w-6xl h-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default BaseWebLayout;
