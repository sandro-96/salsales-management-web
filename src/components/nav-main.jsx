import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn, isActiveNavPath } from "@/lib/utils";
import { preloadRoute } from "@/utils/routePreload.js";

function NavBadge({ count, variant = "default" }) {
  if (!count || count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <SidebarMenuBadge
      className={cn(
        variant === "primary" &&
          "bg-primary text-primary-foreground peer-data-[active=true]/menu-button:text-primary-foreground",
        variant === "warning" && "bg-amber-500 text-white",
      )}
    >
      {label}
    </SidebarMenuBadge>
  );
}

function NavMenuLink({ item, active }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const { t } = useTranslation();
  const label = item.labelKey ? t(item.labelKey) : item.label;
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={label}
        className={cn(item.variant === "pinned" && "h-10")}
      >
        <NavLink
          to={item.to}
          aria-current={active ? "page" : undefined}
          onMouseEnter={() => preloadRoute(item.to)}
          onFocus={() => preloadRoute(item.to)}
          onClick={() => {
            if (isMobile) setOpenMobile(false);
          }}
          className={cn(
            "no-underline outline-none ring-sidebar-ring focus-visible:ring-2",
            item.variant === "pinned" &&
              "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground",
          )}
        >
          {Icon ? <Icon /> : null}
          <span className="truncate">{label}</span>
        </NavLink>
      </SidebarMenuButton>
      {item.badge > 0 ? (
        <NavBadge count={item.badge} variant={item.badgeVariant} />
      ) : null}
    </SidebarMenuItem>
  );
}

export function NavMain({ pinnedItem, groups, showGroupLabels = true }) {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const renderItem = (item) => {
    const to = item.to;
    if (!to) return null;
    const active = isActiveNavPath(pathname, to, item.end);
    return <NavMenuLink key={to} item={item} active={active} />;
  };

  if (!pinnedItem && (!groups || groups.length === 0)) return null;

  return (
    <div className="flex flex-col gap-1 py-1">
      {pinnedItem ? (
        <SidebarGroup className="py-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {renderItem({ ...pinnedItem, variant: "pinned" })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ) : null}

      {groups?.map(({ section, items }) => (
        <SidebarGroup key={section} className="py-0">
          {showGroupLabels ? (
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 px-2">
              {t(`nav.group.${section}`, { defaultValue: section })}
            </SidebarGroupLabel>
          ) : null}
          <SidebarGroupContent>
            <SidebarMenu>{items.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </div>
  );
}
