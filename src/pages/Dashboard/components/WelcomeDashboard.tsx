import { LayoutDashboard, Sparkles } from "lucide-react";
import React from "react";
import { useMe } from "../../../hooks/useMe";

/**
 * Friendly fallback shown when the signed-in user has no dashboard-card
 * permissions — instead of an empty dashboard they get a warm welcome.
 */
const WelcomeDashboard: React.FC = () => {
  const { me } = useMe();
  const firstName = (me?.name || "there").trim().split(" ")[0];

  return (
    <div className="flex min-h-[72vh] items-center justify-center">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 p-10 text-center text-white sm:p-14">
        {/* decorative glows */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />

        <div className="relative">
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <LayoutDashboard className="h-8 w-8" />
          </div>

          <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium uppercase tracking-[0.18em] text-white/70">
            <Sparkles className="h-4 w-4" />
            POS & Inventory Admin
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back, {firstName}
          </h1>

          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/80">
            You're all set. Your dashboard widgets will appear here once an
            administrator grants you access — until then, use the menu to reach
            your assigned sections.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeDashboard;
