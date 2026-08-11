import { FC, ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink } from "react-router-dom";
import { SubmenuItem } from "../../../types/sidebarType";
import { useSelector } from "react-redux";

interface MenuTooltipProps {
  label: string;
  submenus?: SubmenuItem[];
  children: ReactNode;
}

export const MenuTooltip: FC<MenuTooltipProps> = ({
  label,
  submenus,
  children,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 1024
  );
  const isCollapsed = useSelector((state: any) => state.sidebar.isCollapsed);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const resizeHandler = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", resizeHandler);
    return () => window.removeEventListener("resize", resizeHandler);
  }, []);

  useEffect(() => {
    if (isHovered && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top,
        left: rect.right + 8,
      });
    }
  }, [isHovered]);

  if (!isDesktop || !isCollapsed) {
    return <>{children}</>;
  }

  const tooltipContent = isHovered && (
    <div
      ref={tooltipRef}
      className="fixed z-[9999] pointer-events-auto animate-fadeIn"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-white rounded-lg shadow-2xl border border-primary-100 min-w-[220px] py-2 relative">
        {/* Arrow pointer */}
        <div className="absolute left-0 top-4 -ml-1.5 w-3 h-3 bg-white border-l border-b border-primary-100 transform rotate-45"></div>
        <div
          className={`px-4 py-2.5 font-display font-semibold text-primary bg-primary-50/30 ${
            submenus && submenus.length > 0 ? "border-b border-primary-100" : ""
          }`}
        >
          {label}
        </div>
        {submenus && submenus.length > 0 && (
          <div className="py-1">
            {submenus.map((submenu, index) => {
              const Icon = submenu.icon;
              return (
                <NavLink
                  key={index}
                  to={submenu.address}
                  // Mirrors the expanded list's rule, so a route highlights the
                  // same row whichever of the two views is on screen.
                  end={submenu.exactMatch}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-4 py-2 text-sm transition-colors duration-200 rounded-md mx-1 ${
                      isActive
                        ? "text-primary bg-primary-50 font-medium"
                        : "text-secondary-600 hover:bg-primary-50 hover:text-primary"
                    }`
                  }
                >
                  {Icon && <Icon size={16} className="shrink-0" />}
                  <span className="truncate">{submenu.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div
        ref={triggerRef}
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {children}
      </div>
      {typeof document !== "undefined" &&
        tooltipContent &&
        createPortal(tooltipContent, document.body)}
    </>
  );
};

