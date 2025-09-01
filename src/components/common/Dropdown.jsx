import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { NavLink } from "react-router-dom";
import React from "react";

export default function DropdownComponent({
  buttonLabel,
  items,
  position = "bottom",
  lrPosition = "left",
  hideDownIcon = false,
}) {
  const positionClass =
    position === "top"
      ? `bottom-full mb-2 origin-bottom-${lrPosition} ${lrPosition}-0`
      : `top-full mt-2 origin-top-${lrPosition} ${lrPosition}-0`;

  return (
    <Menu as="div" className="relative inline-block text-left w-full">
      <MenuButton
        className="inline-flex w-full justify-between items-center gap-x-1.5 
      rounded-md cursor-pointer px-2 py-2.5 text-sm font-semibold text-white hover:bg-white/20 outline-none"
      >
        {buttonLabel}
        {!hideDownIcon && (
          <span className={`${position === "top" ? "rotate-180" : ""}`}>
            <ChevronDownIcon
              aria-hidden="true"
              className="size-5 text-gray-400"
            />
          </span>
        )}
      </MenuButton>

      <MenuItems
        transition
        className={`absolute p-1 z-10 w-56 rounded-lg bg-gray-800 shadow-lg outline-1 outline-gray-600 transition 
          data-closed:scale-95 data-closed:transform data-closed:opacity-0 
          data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in ${positionClass}`}
      >
        <div>
          {items.map((item, idx) => (
            <React.Fragment key={idx}>
              {item.divider && (
                <div className="my-1 mx-4 border-t border-white/10" />
              )}
              <MenuItem className="rounded-md">
                {({ active }) =>
                  item.to ? (
                    <NavLink
                      to={item.to}
                      className={`flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-300 ${
                        active ? "bg-white/5 text-white" : ""
                      }`}
                    >
                      {item.avatar && (
                        <img
                          src={item.avatar}
                          alt=""
                          className="h-5 w-5 rounded-full"
                        />
                      )}
                      {item.icon && !item.avatar && item.icon}
                      <span>{item.title}</span>
                    </NavLink>
                  ) : (
                    <button
                      onClick={item.onClick}
                      className={`flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-gray-300 text-left ${
                        active ? "bg-white/5 text-white" : ""
                      }`}
                    >
                      {item.avatar && (
                        <img
                          src={item.avatar}
                          alt=""
                          className="h-5 w-5 rounded-full"
                        />
                      )}
                      {item.icon && !item.avatar && item.icon}
                      <span>{item.title}</span>
                    </button>
                  )
                }
              </MenuItem>
            </React.Fragment>
          ))}
        </div>
      </MenuItems>
    </Menu>
  );
}
