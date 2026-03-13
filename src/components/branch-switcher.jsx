import * as React from "react";
import { ChevronDown, GitBranch, Store } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useShop } from "@/hooks/useShop";

export function BranchSwitcher() {
  const { branches, selectedBranch, selectedBranchId, setSelectedBranchId } =
    useShop();

  // Don't render if shop has only 1 branch — no point switching
  if (!branches || branches.length <= 1) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="w-full px-1.5">
              <div className="flex aspect-square size-6 items-center justify-center rounded-md border bg-muted">
                <GitBranch className="size-3.5 text-muted-foreground" />
              </div>
              <span className="truncate text-sm grow-1">
                {selectedBranch ? selectedBranch.name : "Tất cả chi nhánh"}
              </span>
              <ChevronDown className="opacity-50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-64 rounded-lg bg-background"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Chi nhánh
            </DropdownMenuLabel>

            <DropdownMenuRadioGroup
              value={selectedBranchId ?? "__all__"}
              onValueChange={(value) =>
                setSelectedBranchId(value === "__all__" ? null : value)
              }
            >
              <DropdownMenuRadioItem
                value="__all__"
                noIndicator
                className="gap-2 p-2 data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground [&>[data-radix-menu-item-indicator]]:hidden"
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-muted">
                  <Store className="size-3.5 text-muted-foreground" />
                </div>
                Tất cả chi nhánh
              </DropdownMenuRadioItem>

              <DropdownMenuSeparator />

              {branches.map((branch) => (
                <DropdownMenuRadioItem
                  key={branch.id}
                  value={branch.id}
                  noIndicator
                  className="gap-2 p-2 data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground [&>[data-radix-menu-item-indicator]]:hidden"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <GitBranch className="size-3.5" />
                  </div>
                  <span className="truncate">{branch.name}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
