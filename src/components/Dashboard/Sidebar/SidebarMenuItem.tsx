import { Tooltip } from "antd";
import { FC } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useLocation } from "react-router-dom";
import { toggleSidebar } from "../../../redux/features/sidebar/sidebarSlice";
import { MenuTooltip } from "./MenuTooltip";

interface SidebarMenuItemProps {
  label: string;
  address: string;
  icon?: React.ElementType;
  onClick?: () => void;
}

export const SidebarMenuItem: FC<SidebarMenuItemProps> = ({
  label,
  address,
  icon: Icon,
  onClick,
}) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const isActive = location.pathname === address;
  const isCollapsed = useSelector((state: any) => state.sidebar.isCollapsed);

  const handleClick = () => {
    dispatch(toggleSidebar());
    if (onClick) onClick();
  };

  const menuItem = (
    <NavLink
      to={address}
      end
      onClick={handleClick}
      className={({ isActive }) =>
        `flex items-center gap-3 font-display rounded-[7px] transition-all duration-300 transform relative min-w-0 ${
          isCollapsed ? "justify-center px-3 py-2" : "px-4 py-2"
        } ${
          isActive
            ? "text-white bg-primary shadow-md shadow-primary-200"
            : "text-secondary-600 hover:bg-primary-50 hover:text-primary hover:shadow-sm"
        }`
      }
    >
      {Icon && (
        <Icon
          size={18}
          className="shrink-0 transition-transform duration-300 group-hover:scale-110"
        />
      )}
      {!isCollapsed && (
        <Tooltip title={label} placement="right">
          <span className="text-[15px] md:text-[16px] lg:text-[17px] font-semibold truncate whitespace-nowrap flex-1 min-w-0">
            {label}
          </span>
        </Tooltip>
      )}
      {isActive && !isCollapsed && (
        <span className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full"></span>
      )}
    </NavLink>
  );

  if (isCollapsed) {
    return <MenuTooltip label={label}>{menuItem}</MenuTooltip>;
  }

  return menuItem;
};
