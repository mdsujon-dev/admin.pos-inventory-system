import { motion } from "framer-motion";
import { Boxes, ScanBarcode, Store, Wallet } from "lucide-react";
import type { ReactNode } from "react";

import { logoLight } from "../../data";

type AuthLayoutProps = {
  heading: string;
  subheading: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Shown as "Step 1 of 2" above the heading — used by the reset flow. */
  step?: { current: number; total: number };
};

// What the panel actually covers today — keeps the marketing honest.
const highlights = [
  {
    icon: ScanBarcode,
    title: "Point of sale",
    copy: "Scan, bill and take payment at the counter — invoice and receipt print themselves.",
  },
  {
    icon: Boxes,
    title: "Live stock",
    copy: "Every sale, purchase and return moves the shelf count, with low-stock and expiry watched for you.",
  },
  {
    icon: Wallet,
    title: "Money that adds up",
    copy: "Ledger, receivables, payables and profit — each one traced back to the entry it came from.",
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

export function AuthLayout({
  heading,
  subheading,
  children,
  footer,
  step,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-secondary-50 lg:flex-row">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary lg:flex lg:min-h-screen lg:w-[46%] xl:w-1/2">
        {/* Depth: one soft wash, a faint grid, plus two drifting orbs. Decorative only. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 25% 15%, rgba(1,149,50,0.28) 0%, transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse at 50% 40%, #000 30%, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at 50% 40%, #000 30%, transparent 78%)",
          }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-16 h-80 w-80 rounded-full bg-accent/40 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-20 bottom-10 h-96 w-96 rounded-full bg-primary-400/25 blur-3xl"
          animate={{ x: [0, -36, 0], y: [0, -28, 0] }}
          transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
          {/* The wordmark is dark green, so it needs a light chip to sit on. */}
          <motion.div
            initial={{ y: -14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease }}
            className="inline-flex w-fit items-center rounded-xl bg-white px-4 py-2.5 shadow-lg"
          >
            <img
              src={logoLight}
              alt="POS & Inventory"
              className="h-9 w-auto object-contain"
            />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease }}
            className="max-w-lg py-10"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/80">
              <Store className="h-3.5 w-3.5" aria-hidden="true" />
              Admin Panel
            </span>

            <h1 className="mt-6 text-[clamp(2rem,3.2vw,2.75rem)] font-semibold leading-[1.12] tracking-tight text-white">
              From the counter to the
              <br />
              closing balance, in one place.
            </h1>

            <ul className="mt-9 space-y-3">
              {highlights.map(({ icon: Icon, title, copy }, i) => (
                <motion.li
                  key={title}
                  initial={{ x: -12, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1, ease }}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm transition-colors duration-300 hover:border-white/25 hover:bg-white/[0.11]"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10 text-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-white">
                      {title}
                    </p>
                    <p className="mt-0.5 text-sm leading-[1.6] text-white/70">
                      {copy}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <p className="text-[13px] text-white/50">
            © {new Date().getFullYear()} POS &amp; Inventory. All rights
            reserved.
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-1 items-center justify-center px-5 py-12 sm:px-8 lg:px-12">
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease }}
          className="w-full max-w-[420px]"
        >
          {/* On mobile the brand panel is hidden, so the mark shows up here. */}
          <div className="mb-8 flex justify-center lg:hidden">
            <img
              src={logoLight}
              alt="POS & Inventory"
              className="h-10 w-auto object-contain"
            />
          </div>

          <div className="rounded-xl border border-secondary-100 bg-white p-6 shadow-card sm:p-8">
            <div className="mb-7">
              {/* Multi-screen flows say where you are, so nobody wonders how
                  many more forms are coming. */}
              {step && (
                <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-50 px-2.5 py-1 text-[12px] font-semibold text-primary-700">
                  <span className="flex gap-1" aria-hidden="true">
                    {Array.from({ length: step.total }, (_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full ${
                          i < step.current ? "bg-primary" : "bg-primary-200"
                        }`}
                      />
                    ))}
                  </span>
                  Step {step.current} of {step.total}
                </span>
              )}
              <h2 className="text-[26px] font-semibold tracking-tight text-secondary-900">
                {heading}
              </h2>
              <p className="mt-1.5 text-sm text-secondary-500">{subheading}</p>
            </div>

            {children}
          </div>

          {footer && (
            <div className="mt-6 text-center text-[13px] text-secondary-500">
              {footer}
            </div>
          )}
        </motion.div>
      </main>

      {/* Brand-green focus states for the auth forms only. */}
      <style>{`
        .auth-form .ant-form-item-label > label { font-weight: 500; color: #333333; }
        .auth-form .ant-input-affix-wrapper:hover,
        .auth-form .ant-input-affix-wrapper-focused { border-color: #019532 !important; }
        .auth-form .ant-input-affix-wrapper-focused { box-shadow: 0 0 0 3px rgba(1,149,50,0.12) !important; }
      `}</style>
    </div>
  );
}
