import { useState, useRef, useEffect } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useShop } from "../../hooks/useShop";
import {
  FaSignOutAlt,
  FaCog,
  FaUserCircle,
  FaStore,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import DropdownComponent from "../../components/common/Dropdown";

const pastelMint = "#A8DADC";
const pastelSand = "#FFE8C2";
const textLight = "#F1FAEE";
const textDark = "#1B2A41";

const BaseWebLayout = ({ title, navItems }) => {
  const { logout, user } = useAuth();
  const { selectedShop } = useShop();
  const items = Array.isArray(navItems) ? navItems : [];

  const SidebarContent = (
    <>
      {selectedShop && (
        <div className="flex items-center mb-6 space-x-3">
          {selectedShop?.logoUrl ? (
            <img
              src={`${import.meta.env.VITE_API_BASE_URL.replace("/api", "")}${
                selectedShop.logoUrl
              }`}
              alt="Shop Logo"
              className="w-10 h-10 rounded-full object-cover"
              style={{ border: `2px solid ${pastelMint}` }}
            />
          ) : (
            <FaStore size={40} style={{ color: pastelMint }} />
          )}
          <div>
            <p className="font-bold text-lg">
              {selectedShop?.name || "Cửa hàng"}
            </p>
            <p className="text-sm" style={{ color: pastelMint }}>
              {selectedShop?.industry || "Industry"}
            </p>
          </div>
        </div>
      )}

      {/* Menu nav */}
      <div className="flex flex-1 flex-col overflow-y-auto p-4 [&>[data-slot=section]+[data-slot=section]]:mt-8">
        <div data-slot="section" className="flex flex-col gap-0.5">
          {items.map(({ to, icon: Icon, label, onClick }) => (
            <NavLink
              key={to || label}
              to={to || "#"}
              onClick={onClick}
              className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-base/6 font-medium text-zinc-950 sm:py-2 sm:text-sm/5 *:data-[slot=icon]:size-6 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:fill-zinc-500 sm:*:data-[slot=icon]:size-5 *:last:data-[slot=icon]:ml-auto *:last:data-[slot=icon]:size-5 sm:*:last:data-[slot=icon]:size-4 *:data-[slot=avatar]:-m-0.5 *:data-[slot=avatar]:size-7 sm:*:data-[slot=avatar]:size-6 data-hover:bg-zinc-950/5 data-hover:*:data-[slot=icon]:fill-zinc-950 data-active:bg-zinc-950/5 data-active:*:data-[slot=icon]:fill-zinc-950 data-current:*:data-[slot=icon]:fill-zinc-950 dark:text-white/20 dark:*:data-[slot=icon]:fill-zinc-400 dark:data-hover:bg-white/5 dark:data-hover:*:data-[slot=icon]:fill-white dark:data-active:bg-white/5 dark:data-active:*:data-[slot=icon]:fill-white dark:data-current:*:data-[slot=icon]:fill-white ${
                  isActive ? "font-semibold" : "hover:bg-white/10"
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      backgroundColor:
                        "color-mix(in oklab,var(--color-white)30%,transparent)",
                    }
                  : { color: textLight }
              }
            >
              {Icon && <Icon />}
              {label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        className="pt-4 mt-4 space-y-2 text-sm"
        style={{ borderTop: `1px solid ${pastelMint}` }}
      >
        <DropdownComponent
          position="top"
          buttonLabel={
            <div className="flex items-center text-left">
              {user?.avatarUrl ? (
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL.replace(
                    "/api",
                    ""
                  )}${user.avatarUrl}`}
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full mr-3"
                />
              ) : (
                <FaUserCircle
                  className="w-8 h-8 mr-3"
                  style={{ color: pastelMint }}
                />
              )}
              <div className="flex flex-col">
                <span className="font-semibold text-sm">
                  {user?.fullName || "Người dùng"}
                </span>
                <span className="text-xs text-gray-300">
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
    <div className="relative isolate flex min-h-svh w-full bg-white max-lg:flex-col lg:bg-zinc-100 dark:bg-zinc-900 dark:lg:bg-zinc-950">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 max-lg:hidden">
        <nav className="flex h-full min-h-0 flex-col">{SidebarContent}</nav>
      </div>

      {/* Main content */}
      <main className="flex flex-1 flex-col pb-2 lg:min-w-0 lg:pt-2 lg:pr-2 lg:pl-64">
        {/* Page Content */}
        <div className="grow p-6 lg:rounded-lg lg:bg-white lg:p-10 lg:shadow-xs lg:ring-1 lg:ring-zinc-950/5 dark:lg:bg-zinc-900 dark:lg:ring-white/10">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default BaseWebLayout;
