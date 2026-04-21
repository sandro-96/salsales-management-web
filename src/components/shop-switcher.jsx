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
import { formatSubscriptionLine } from "@/constants/subscriptionStatus.js";

export function ShopSwitcher() {
  const { selectedShop, shops, setSelectedShop } = useShop();
  const navigate = useNavigate();
  if (!selectedShop) return null;
  const selectedSubLine = formatSubscriptionLine(
    selectedShop.subscriptionStatus,
    selectedShop.subscriptionDaysRemaining,
  );
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="w-full px-1.5 h-auto min-h-9 py-1.5">
              <div className="flex aspect-square size-6 items-center justify-center rounded-md border shrink-0">
                <Avatar className="size-6 rounded-md">
                  <AvatarImage
                    src={selectedShop.logoUrl}
                    alt={selectedShop.name}
                    className="size-full object-cover"
                  />
                  <AvatarFallback className="rounded-lg">
                    {selectedShop.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
                <span className="truncate w-full font-medium leading-tight">
                  {selectedShop.name}
                </span>
                {selectedSubLine ? (
                  <span className="truncate w-full text-[10px] leading-tight text-muted-foreground">
                    {selectedSubLine}
                  </span>
                ) : null}
              </div>
              <ChevronDown className="opacity-50 shrink-0" />
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
              {shops.map((shop, index) => {
                const subLine = formatSubscriptionLine(
                  shop.subscriptionStatus,
                  shop.subscriptionDaysRemaining,
                );
                return (
                <DropdownMenuRadioItem
                  key={shop.id}
                  value={shop.id}
                  noIndicator={true}
                  className="gap-2 p-2 data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground [&>[data-radix-menu-item-indicator]]:hidden"
                >
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-md border">
                    <Avatar className="size-6 rounded-lg">
                      <AvatarImage src={shop.logoUrl} alt={shop.name} />
                      <AvatarFallback className="rounded-lg">
                        {shop.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col items-start gap-0.5">
                    <span className="truncate w-full font-medium leading-tight">
                      {shop.name}
                    </span>
                    {subLine ? (
                      <span className="truncate w-full text-[10px] leading-tight text-muted-foreground">
                        {subLine}
                      </span>
                    ) : null}
                  </div>
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuRadioItem>
                );
              })}
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
