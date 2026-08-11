import { Tooltip } from "antd";
import { Dot } from "lucide-react";
import { FC } from "react";
import { NavLink } from "react-router-dom";

interface SubMenuItemProps {
  label: string;
  address: string;
  onClick?: () => void;
  exactMatch?: boolean;
}

export const SubMenuItem: FC<SubMenuItemProps> = ({
  label,
  address,
  exactMatch,
  onClick,
}) => {
  return (
    <NavLink
      to={address}
      end={exactMatch}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2 font-display py-2 px-3 rounded-[7px] transition-all duration-300 group min-w-0 ${
          isActive
            ? "bg-primary-50 text-primary font-semibold"
            : "text-secondary-500 hover:text-primary hover:bg-primary-50/50"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Dot
            size={20}
            className={`shrink-0 transition-all duration-300 group-hover:scale-125 ${
              isActive ? "text-primary fill-primary" : ""
            }`}
          />
          <Tooltip title={label} placement="right">
            <span className="text-sm truncate whitespace-nowrap flex-1 min-w-0">
              {label}
            </span>
          </Tooltip>
        </>
      )}
    </NavLink>
  );
};
