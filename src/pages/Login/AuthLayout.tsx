import { motion } from "framer-motion";
import { BarChart3, ImageIcon, ShieldCheck, Wallet } from "lucide-react";
import type { ReactNode } from "react";

import { logoLight } from "../../data";

type AuthLayoutProps = {
  heading: string;
  subheading: string;
  children: ReactNode;
  footer?: ReactNode;
};

// What the panel actually covers today — keeps the marketing honest.
const highlights = [
  {
    icon: ShieldCheck,
    title: "Employees & access",
    copy: "Add staff, assign roles and control what each one can reach.",
  },
  {
    icon: Wallet,
    title: "Income & expense",
    copy: "Record every entry and watch the profit line move in real time.",
  },
  {
    icon: ImageIcon,
    title: "Media & enquiries",
    copy: "One library for your files, one inbox for every enquiry.",
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

export function AuthLayout({
  heading,
  subheading,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-secondary-50 lg:flex-row">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#15330a] via-[#1a400d] to-[#285F14] lg:flex lg:min-h-screen lg:w-[46%] xl:w-1/2">
        {/* Depth: one soft wash plus two drifting orbs. Decorative only. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 25% 15%, rgba(91,190,55,0.28) 0%, transparent 60%)",
          }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-16 h-80 w-80 rounded-full bg-[#3c8820]/40 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-20 bottom-10 h-96 w-96 rounded-full bg-[#5bbe37]/25 blur-3xl"
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
              <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
              Admin Panel
            </span>

            <h1 className="mt-6 text-[clamp(2rem,3.2vw,2.75rem)] font-semibold leading-[1.12] tracking-tight text-white">
              Everything your institute
              <br />
              runs on, in one place.
            </h1>

            <ul className="mt-9 space-y-5">
              {highlights.map(({ icon: Icon, title, copy }) => (
                <li key={title} className="flex gap-4">
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
                </li>
              ))}
            </ul>
          </motion.div>

          <p className="text-[13px] text-white/50">
            © {new Date().getFullYear()} POS & Inventory.
            All rights reserved.
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
        .auth-form .ant-input-affix-wrapper-focused { border-color: #285F14 !important; }
        .auth-form .ant-input-affix-wrapper-focused { box-shadow: 0 0 0 3px rgba(40,95,20,0.12) !important; }
      `}</style>
    </div>
  );
}
