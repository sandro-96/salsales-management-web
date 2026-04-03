import { Outlet, useNavigate } from "react-router-dom";
import { useShop } from "../../hooks/useShop";
import { useAuth } from "../../hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LayoutDashboard, LogOut, Store } from "lucide-react";

const FnbPosLayout = ({ title }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    selectedShop,
    branches,
    selectedBranchId,
    setSelectedBranchId,
  } = useShop();

  const initials = user?.fullName
    ?.split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <header className="h-14 shrink-0 flex items-center justify-between border-b bg-card px-4 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Store className="h-5 w-5 text-primary shrink-0" />
          <span className="font-semibold text-sm truncate">
            {selectedShop?.name || title}
          </span>

          {branches.length > 1 && (
            <Select value={selectedBranchId || ""} onValueChange={setSelectedBranchId}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Chọn chi nhánh" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id} className="text-xs">
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1.5"
            onClick={() => navigate("/overview")}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>

          <div className="flex items-center gap-2 pl-2 border-l">
            <Avatar className="h-7 w-7">
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium hidden md:inline">{user?.fullName}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={logout}>
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default FnbPosLayout;
