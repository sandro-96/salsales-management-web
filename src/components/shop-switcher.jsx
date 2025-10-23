import * as React from "react";
import { ChevronDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useShop } from "@/hooks/useShop";
import { useNavigate } from "react-router-dom";

export function ShopSwitcher() {
  const { selectedShop, shops, setSelectedShop } = useShop();
  const navigate = useNavigate();
  if (!selectedShop) return null;
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="w-full px-1.5">
              <div className="flex aspect-square size-6 items-center justify-center rounded-md border ">
                <Avatar className="size-6 rounded-md">
                  <AvatarImage
                    src={`${import.meta.env.VITE_API_BASE_URL.replace(
                      "/api",
                      ""
                    )}${selectedShop.logoUrl}`}
                    alt={selectedShop.name}
                  />
                  <AvatarFallback className="rounded-lg">
                    {selectedShop.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="truncate font-medium grow-1">
                {selectedShop.name}
              </span>
              <ChevronDown className="opacity-50 " />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 rounded-lg bg-background"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Shops
            </DropdownMenuLabel>

            <DropdownMenuRadioGroup
              value={selectedShop.id}
              onValueChange={(value) => {
                const shop = shops.find((s) => s.id === value);
                if (shop) setSelectedShop(shop);
              }}
            >
              {shops.map((shop, index) => (
                <DropdownMenuRadioItem
                  key={shop.id}
                  value={shop.id}
                  noIndicator={true}
                  className="gap-2 p-2 data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground [&>[data-radix-menu-item-indicator]]:hidden"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <Avatar className="size-6 rounded-lg">
                      <AvatarImage
                        src={`${import.meta.env.VITE_API_BASE_URL.replace(
                          "/api",
                          ""
                        )}${shop.logoUrl}`}
                        alt={shop.name}
                      />
                      <AvatarFallback className="rounded-lg">
                        {shop.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  {shop.name}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator className="border-t border-muted-foreground" />
            <DropdownMenuItem
              className="gap-2 p-2"
              onSelect={() => {
                navigate("/shops/create");
              }}
            >
              <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Add shop</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
