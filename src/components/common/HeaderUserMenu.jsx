import React from "react";
import {
  BellIcon,
  CreditCardIcon,
  LogOutIcon,
  UserCircleIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HeaderUserMenu({ className }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const currentPath = window.location.pathname;

  const name = user?.fullName || t("header.userMenu.fallbackName");
  const email = user?.email || t("header.userMenu.fallbackEmail");
  const avatar = user?.avatarUrl || null;
  const initials =
    name
      ?.split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(-2)
      .join("")
      .toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "h-9 w-9 p-0 justify-center min-w-0 rounded-full",
            className,
          )}
        >
          <Avatar className="h-8 w-8 rounded-full">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="rounded-full text-[10px] font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="min-w-60 rounded-lg"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-2 py-2 text-left">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback className="rounded-lg text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {email}
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => navigate("/accounts")}
            className={cn(
              currentPath === "/accounts" &&
                "bg-accent text-accent-foreground",
            )}
          >
            <UserCircleIcon className="mr-2 h-4 w-4" />
            {t("header.userMenu.account")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => navigate("/billing")}
            className={cn(
              currentPath === "/billing" && "bg-accent text-accent-foreground",
            )}
          >
            <CreditCardIcon className="mr-2 h-4 w-4" />
            {t("header.userMenu.billing")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => navigate("/notifications")}
            className={cn(
              currentPath === "/notifications" &&
                "bg-accent text-accent-foreground",
            )}
          >
            <BellIcon className="mr-2 h-4 w-4" />
            {t("header.userMenu.notifications")}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={logout}>
          <LogOutIcon className="mr-2 h-4 w-4" />
          {t("header.userMenu.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

