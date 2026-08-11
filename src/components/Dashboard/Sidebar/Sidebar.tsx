import { LogOut } from "lucide-react";
import { useEffect, useRef } from "react";
import { GoArrowLeft } from "react-icons/go";
import { favicon, logoLight } from "../../../data";
import { logout } from "../../../redux/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "../../../redux/features/hooks";
import { toggleSidebar } from "../../../redux/features/sidebar/sidebarSlice";
import NextImage from "../../shared/NextImage";
import AdminMenu from "./AdminMenu";

const Sidebar = () => {
  const trigger = useRef<HTMLButtonElement | null>(null);
  const sidebar = useRef<HTMLElement | null>(null);
  const sidebarOpen = useAppSelector((state: any) => state.sidebar.isActive);
  const isCollapsed = useAppSelector((state: any) => state.sidebar.isCollapsed);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const clickHandler = (event: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(event.target as Node) ||
        trigger.current.contains(event.target as Node)
      ) {
        return;
      }
      dispatch(toggleSidebar());
    };

    document.addEventListener("mousedown", clickHandler);
    return () => document.removeEventListener("mousedown", clickHandler);
  }, [sidebarOpen, dispatch]);

  useEffect(() => {
    const keyHandler = (event: KeyboardEvent) => {
      if (sidebarOpen && event.key === "Escape") {
        dispatch(toggleSidebar());
      }
    };

    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  }, [sidebarOpen, dispatch]);

  return (
    <aside
      ref={sidebar}
      className={`fixed left-0 top-0 z-50 flex flex-col h-full shrink-0 transform bg-white transition-[width,transform] duration-300 ease-in-out border-r border-primary/20
        ${isCollapsed ? "w-[68px]" : "w-[260px]"}
        ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:translate-x-0`}
      style={{ isolation: "isolate" }}
    >
      <div
        className={`flex relative items-center border-b border-primary/20 transition-all duration-300 bg-white/80 backdrop-blur-sm h-[60px] shrink-0 ${
          isCollapsed ? "justify-center px-2" : "justify-between px-4"
        }`}
      >
        <div
          className={`flex items-center gap-3 ${isCollapsed ? "justify-center w-full" : "pl-2"}`}
        >
          {isCollapsed ? (
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-[0_4px_12px_-2px_rgba(40, 95, 20,0.45)]">
              <NextImage
                src={favicon}
                alt="POS & Inventory"
                className="h-7 w-7 object-contain"
              />
            </div>
          ) : (
            <NextImage
              src={logoLight}
              alt="POS & Inventory"
              accessurl={false}
              className="w-auto h-[35px] transition-opacity duration-300"
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            ref={trigger}
            onClick={() => dispatch(toggleSidebar())}
            className="text-xl text-secondary-600 hover:text-primary hover:bg-primary-50 p-2 rounded-lg transition-colors duration-200 lg:hidden"
          >
            <GoArrowLeft />
          </button>
        </div>
      </div>

      <nav className="flex flex-col bg-white flex-1 min-h-0 overflow-x-hidden overflow-y-auto scrollbar-hide">
        <AdminMenu />

        <div
          className={`bg-white w-full sticky bottom-0 mt-auto py-2 border-t border-primary/20 transition-all duration-300 z-50 ${
            isCollapsed ? "px-3" : "px-4"
          }`}
        >
          <button
            onClick={() => dispatch(logout())}
            className={`border w-full rounded-md flex items-center bg-red-500  text-white font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ${
              isCollapsed
                ? "px-3 py-[9px] justify-center"
                : "px-4 py-[9px] justify-between"
            }`}
            title={isCollapsed ? "Logout" : ""}
          >
            {!isCollapsed && <span className="font-display">Logout</span>}
            <LogOut size={18} />
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
