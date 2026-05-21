import { useNavigate } from "react-router-dom";
import RouteOutletSuspense from "@/components/routing/RouteOutletSuspense.jsx";
import { useTranslation } from "react-i18next";
import { useShop } from "../../hooks/useShop";
import { useAuth } from "../../hooks/useAuth";
import { useNetwork } from "../../hooks/useNetwork";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LayoutDashboard, LogOut, Store, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shell POS dùng chung (cùng header / main với FNB POS). */
const PosChromeLayout = ({ title }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { apiReachable } = useNetwork();
  const { selectedShop, branches, selectedBranchId, setSelectedBranchId } =
    useShop();

  const initials =
    user?.fullName
      ?.split(" ")
      .map((w) => w[0])
      .slice(-2)
      .join("")
      .toUpperCase() || "U";

  const branchName =
    branches.find((b) => b.id === selectedBranchId)?.name ?? null;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <header className="h-14 shrink-0 flex items-center justify-between border-b bg-card px-3 sm:px-4 gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Avatar className="h-8 w-8 shrink-0 rounded-md border bg-muted/40">
            <AvatarImage
              src={selectedShop?.logoUrl}
              alt={selectedShop?.name || ""}
              className="object-cover"
            />
            <AvatarFallback className="rounded-md text-xs font-semibold">
              {selectedShop?.name?.charAt(0)?.toUpperCase() || (
                <Store className="h-4 w-4 text-primary" />
              )}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate leading-tight">
              {selectedShop?.name || title}
            </p>
            <p className="text-[10px] text-muted-foreground truncate hidden sm:block">
              {t("pages.pos.chrome.posMode")}
              {branchName ? ` · ${branchName}` : ""}
            </p>
          </div>

          {branches.length > 1 && (
            <Select
              value={selectedBranchId || ""}
              onValueChange={setSelectedBranchId}
            >
              <SelectTrigger className="w-[140px] sm:w-[180px] h-8 text-xs ml-1">
                <SelectValue
                  placeholder={t("pages.pos.chrome.selectBranchPlaceholder")}
                />
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

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {!apiReachable && (
            <Badge
              variant="outline"
              className={cn(
                "gap-1 text-[10px] h-7 border-red-300 text-red-700",
                "dark:border-red-500/50 dark:text-red-300",
              )}
            >
              <WifiOff className="h-3 w-3" />
              <span className="hidden sm:inline">{t("network.offline")}</span>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1.5 h-8"
            onClick={() => navigate("/overview")}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t("pages.pos.chrome.dashboard")}
            </span>
          </Button>

          <div className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l">
            <Avatar className="h-7 w-7 hidden sm:flex">
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback className="text-[10px]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium hidden lg:inline max-w-[8rem] truncate">
              {user?.fullName}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={logout}
              aria-label={t("nav.logout")}
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden min-h-0">
        <RouteOutletSuspense />
      </main>
    </div>
  );
};

export default PosChromeLayout;
