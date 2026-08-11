import { useRef } from "react";
import { Outlet } from "react-router-dom";
import ForcePasswordChangeModal from "../components/Common/ForcePasswordChangeModal";
import Header from "../components/Dashboard/Header";
import Sidebar from "../components/Dashboard/Sidebar/Sidebar";
import { useAccessDeniedNotice } from "../hooks/useAccessDeniedNotice";
import { useSmoothScroll } from "../hooks/useSmoothScroll";

const MainLayout = () => {
  // Explains the bounce when a guarded route sent someone here instead.
  useAccessDeniedNotice();
  // The scrolling column and the thing inside it that gives it its height —
  // Lenis needs both, and neither is the window here.
  const scrollArea = useRef<HTMLDivElement | null>(null);
  const scrollContent = useRef<HTMLDivElement | null>(null);
  useSmoothScroll(scrollArea, scrollContent);

  return (
    <div className="w-full h-screen bg-[#F4F7FE]">
      <div className="flex h-full max-w-9xl mx-auto bg-[#F4F7FE] overflow-hidden shadow-sm">
        {/* Sits above every page: an account still on its issued password gets
            no further until it has been replaced. */}
        <ForcePasswordChangeModal />
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content — min-w-0 lets the flex child actually shrink when the
            sidebar expands/collapses; overflow-x-hidden stops wide tables from
            pushing the layout out of alignment. */}
        <div
          ref={scrollArea}
          className="relative flex flex-1 flex-col min-w-0 overflow-y-auto overflow-x-hidden transition-[width] duration-300"
        >
          {/* One child holding everything, so Lenis has a single element whose
              height is the scrollable length. The header stays inside it and
              stays sticky — Lenis moves the real scroll offset rather than
              transforming this, so sticky still has something to stick to. */}
          <div ref={scrollContent} className="flex min-w-0 flex-1 flex-col">
            <Header />
            <main className="flex-1 min-w-0">
              {/* Tighter on a phone: 16px of chrome each side of a 360px screen
                  is nearly a tenth of the width, and every panel inside already
                  carries its own padding. Unchanged from `sm` up. */}
              <div className="p-3 min-w-0 max-w-full sm:p-4">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
