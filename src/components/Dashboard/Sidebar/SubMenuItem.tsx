import { Tooltip } from "antd";
import { Dot } from "lucide-react";
import { FC } from "react";
import { NavLink } from "react-router-dom";

interface SubMenuItemProps {
  label: string;
  address: string;
  icon?: React.ElementType;
  onClick?: () => void;
  exactMatch?: boolean;
}

export const SubMenuItem: FC<SubMenuItemProps> = ({
  label,
  address,
  icon: Icon,
  exactMatch,
  onClick,
}) => {
  return (
    <NavLink
      to={address}
      end={exactMatch}
      onClick={onClick}
      className={({ isActive }) =>
        `relative flex items-center gap-2.5 font-display px-3 rounded-[7px] transition-all duration-300 group min-w-0 ${
          isActive
            ? "bg-primary-50 text-primary font-semibold py-2.5"
            : "text-secondary-500 hover:text-primary hover:bg-primary-50/50 py-1.5"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Accent bar on the group's rail — reads as "you are here" without
              needing the row itself to shout. */}
          <span
            className={`absolute -left-3 top-1/2 -translate-y-1/2 w-[3px] rounded-full bg-primary transition-all duration-300 ${
              isActive ? "h-5 opacity-100" : "h-0 opacity-0"
            }`}
          />
          {Icon ? (
            <Icon
              size={17}
              strokeWidth={isActive ? 2.2 : 1.8}
              className="shrink-0 transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <Dot
              size={20}
              className={`shrink-0 transition-all duration-300 group-hover:scale-125 ${
                isActive ? "text-primary fill-primary" : ""
              }`}
            />
          )}
          <Tooltip title={label} placement="right">
            <span className="text-[14px] md:text-[15px] lg:text-[16px] font-semibold truncate whitespace-nowrap flex-1 min-w-0">
              {label}
            </span>
          </Tooltip>
        </>
      )}
    </NavLink>
  );
};
