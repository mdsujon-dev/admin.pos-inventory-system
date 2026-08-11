import { Tooltip } from "antd";
import { useEffect, useState } from "react";
import { IoIosArrowForward } from "react-icons/io";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { useFilteredSidebar } from "../../../hooks/useFilteredSidebar";
import { SubmenuItem } from "../../../types/sidebarType";
import { MenuTooltip } from "./MenuTooltip";
import sidebarMenuRoutes from "./SidebarItems";
import { SidebarMenuItem } from "./SidebarMenuItem";
import { SubMenuItem } from "./SubMenuItem";

const AdminMenu = () => {
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const location = useLocation();
  const isCollapsed = useSelector((state: any) => state.sidebar.isCollapsed);
  const visibleRoutes = useFilteredSidebar(sidebarMenuRoutes);

  // Auto-expand the group that contains the current route (on load + on nav),
  // so the active page is always visible in the sidebar after a refresh.
  useEffect(() => {
    const activeGroup = sidebarMenuRoutes.find((r) =>
      r.submenus?.some((s) => s.address === location.pathname)
    );
    if (activeGroup) setOpenSubmenu(activeGroup.label);
  }, [location.pathname]);

  const toggleSubmenu = (submenu: string) => {
    if (isCollapsed) return;
    setOpenSubmenu((prev) => (prev === submenu ? null : submenu));
  };

  const closeSubmenu = () => {
    setOpenSubmenu(null);
  };

  const isOpen = (submenu: string) => openSubmenu === submenu;

  const isParentActive = (submenus: SubmenuItem[]) => {
    return submenus.some((submenu) => location.pathname === submenu.address);
  };

  return (
    <div className={`py-6 space-y-2 transition-all duration-300 ${
      isCollapsed ? "px-2" : "px-4"
    }`}>
      {visibleRoutes.map((route, index) => {
        // Show a section header before the first item of each new section
        // (only when expanded). Skips empty sections automatically.
        const prevSection = index > 0 ? visibleRoutes[index - 1].section : undefined;
        const showSectionHeader =
          !isCollapsed && route.section && route.section !== prevSection;

        return (
        <div key={index}>
          {showSectionHeader && (
            <p className="px-4 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-secondary-400 first:pt-0">
              {route.section}
            </p>
          )}
          {!route.submenus ? (
            <SidebarMenuItem
              icon={route.icon}
              label={route.label}
              address={route.address ?? ""}
              onClick={closeSubmenu}
            />
          ) : (
            <MenuTooltip label={route.label} submenus={route.submenus}>
              <div>
                <div
                  onClick={() => toggleSubmenu(route.label)}
                  className={`${
                    isParentActive(route.submenus) || isOpen(route.label)
                      ? "text-white bg-gradient-to-r from-primary to-primary-600 shadow-md shadow-primary-200"
                      : "text-secondary-600 hover:bg-primary-50 hover:text-primary hover:shadow-sm"
                  } flex items-center transition-all duration-300 transform rounded-[7px] font-display cursor-pointer group ${
                    isCollapsed 
                      ? "justify-center px-3 py-2" 
                      : "justify-between px-4 py-2"
                  }`}
                >
                  <div
                    className={`flex items-center min-w-0 ${
                      isCollapsed ? "gap-0 justify-center" : "gap-3 flex-1"
                    }`}
                  >
                    <route.icon
                      size={18}
                      className="shrink-0 transition-transform duration-300 group-hover:scale-110"
                    />
                    {!isCollapsed && (
                      <Tooltip title={route.label} placement="right">
                        <span className="text-[15px] md:text-[16px] lg:text-[17px] font-semibold truncate whitespace-nowrap">
                          {route.label}
                        </span>
                      </Tooltip>
                    )}
                  </div>
                  {!isCollapsed && (
                    <IoIosArrowForward
                      className={`transform transition-all ease-in-out ${
                        isOpen(route.label)
                          ? "duration-300 rotate-90 text-white"
                          : "rotate-0 duration-300 group-hover:text-primary"
                      }`}
                    />
                  )}
                </div>
                {!isCollapsed && (
                  <div
                    className={`grid ml-4 border-l-2 border-primary-100 transition-[grid-template-rows,opacity,margin] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                      isOpen(route.label)
                        ? "grid-rows-[1fr] opacity-100 mt-2"
                        : "grid-rows-[0fr] opacity-0 mt-0"
                    }`}
                  >
                    <div
                      className={`overflow-hidden transition-[padding] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                        isOpen(route.label) ? "pl-3" : "pl-3"
                      }`}
                    >
                      {route.submenus.map((subroute) => (
                        <SubMenuItem
                          key={subroute.label}
                          label={subroute.label}
                          address={subroute.address}
                          exactMatch={subroute.exactMatch}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </MenuTooltip>
          )}
        </div>
        );
      })}
    </div>
  );
};

export default AdminMenu;
