import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";
import React from "react";

export default function DropdownComponent({
  buttonLabel,
  items,
  hideDownIcon = false,
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between text-white hover:bg-white/20"
        >
          <div className="flex items-center gap-2">{buttonLabel}</div>
          {!hideDownIcon && (
            <svg
              className="h-4 w-4 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="bottom" // mặc định hiển thị bên dưới
        align="end" // mặc định canh phải, có thể đổi thành "start" nếu muốn trái
        className="w-56 bg-gray-800 text-gray-200"
      >
        {items.map((item, idx) => (
          <React.Fragment key={idx}>
            {item.divider && <DropdownMenuSeparator />}
            <DropdownMenuItem asChild>
              {item.to ? (
                <NavLink
                  to={item.to}
                  className="flex w-full items-center gap-2"
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
                  className="flex w-full items-center gap-2 text-left"
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
              )}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
