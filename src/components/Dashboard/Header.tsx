import { Avatar, Dropdown } from "antd";
import { ItemType } from "antd/es/menu/interface";
import {
  LogOut,
  Maximize,
  Minimize,
  PanelLeftClose,
  PanelLeftOpen,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useMe } from "../../hooks/useMe";
import { useNotificationSocket } from "../../hooks/useNotificationSocket";
import { logout } from "../../redux/features/auth/authSlice";
import {
  toggleCollapse,
  toggleSidebar,
} from "../../redux/features/sidebar/sidebarSlice";
import type { RootState } from "../../redux/features/store";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { me: user } = useMe();
  const isCollapsed = useSelector(
    (state: RootState) => state.sidebar.isCollapsed
  );
  useNotificationSocket();

  // Full-screen toggle — reflects the browser's actual fullscreen state so the
  // icon stays correct even when the user exits with Esc.
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const currentDate = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(new Date());

  const handleLogout = () => {
    dispatch(logout());
  };

  // Top-left menu button: on desktop collapse/expand the sidebar,
  // on mobile open/close the sidebar drawer.
  const handleMenuToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      dispatch(toggleCollapse());
    } else {
      dispatch(toggleSidebar());
    }
  };

  const menuItems: ItemType[] = [
    {
      key: "user-info",
      label: (
        <div className="flex flex-col">
          <span className="font-medium text-gray-800">
            {user?.name || "Guest"}
          </span>
          <span className="text-sm text-gray-500">
            {user?.email || "No Email"}
          </span>
        </div>
      ),
      disabled: true,
    },
    {
      type: "divider",
    },
    {
      key: "profile",
      label: "Profile",
      icon: <User size={16} />,
      onClick: () => navigate("/settings/profile"),
    },
    {
      key: "logout",
      label: "Logout",
      icon: <LogOut size={16} />,
      onClick: handleLogout,
    },
  ];

  return (
    /* 65px, matching the sidebar's logo band so their bottom borders read as
       one unbroken line across the top of the app. */
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-primary/20 pl-3 pr-3 sm:pr-6 !h-[65px] shrink-0 flex items-center justify-between gap-2 transition-all duration-300">
      {/* min-w-0 so the greeting can actually shrink: without it a long name
          pushes the avatar off the right edge of a phone. */}
      <div className="flex min-w-0 items-center gap-4">
        <button
          onClick={handleMenuToggle}
          className="p-2.5 rounded-xl border border-transparent hover:border-primary-200 text-primary bg-primary-50 hover:bg-primary hover:text-white transition-all shadow-sm hover:shadow-md"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen size={22} />
          ) : (
            <PanelLeftClose size={22} />
          )}
        </button>
        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate text-base font-semibold leading-tight text-secondary-900 sm:text-lg">
            Welcome,{" "}
            <span className="text-primary">{user?.name || "Guest"}</span>
          </span>
          <span className="hidden sm:inline text-secondary-300">·</span>
          <span className="hidden sm:inline text-sm text-secondary-500">
            {currentDate}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {/* Full-screen toggle. Desktop only: a phone browser is already full
            screen, and the button costs width the greeting needs. */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit full screen" : "Full screen"}
          aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
          className="hidden h-9 w-9 place-items-center rounded-lg border border-secondary-100 text-secondary-600 transition-colors hover:bg-secondary-50 hover:text-primary sm:grid"
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>

        {/* Signed-in user name + email */}
        <div className="hidden text-right leading-tight sm:block">
          <p className="text-sm font-semibold text-secondary-900">
            {user?.name || "Guest"}
          </p>
          <p className="max-w-[200px] truncate text-xs text-secondary-500">
            {user?.email || ""}
          </p>
        </div>

        <Dropdown
          menu={{ items: menuItems }}
          placement="bottomRight"
          trigger={["click"]}
        >
          <Avatar
            src={user?.profilePhoto || "/assets/default_image.png"}
            style={{
              verticalAlign: "middle",
            }}
            className="bg-primary text-white font-semibold cursor-pointer select-none border border-gray-200"
            gap={1}
          >
            {!user?.profilePhoto && (user?.name?.charAt(0) || "?")}
          </Avatar>
        </Dropdown>
      </div>
    </header>
  );
};

export default Header;
