import dayjs from "dayjs";
import { motion } from "framer-motion";
import { ArrowDownCircle, ArrowUpCircle, Banknote } from "lucide-react";
import React, { useState } from "react";
import PageMeta from "../../components/Common/PageMeta";
import CustomDatePicker from "../../components/shared/CustomDatePicker";
import { Money } from "../../components/shared/Money";
import { useHasPermission } from "../../hooks/useHasPermission";
import { useMe } from "../../hooks/useMe";
import {
  useGetTransactionMonthlyQuery,
  useGetTransactionStatsQuery,
} from "../../redux/features/transaction/transactionApi";
import { Metric } from "./components/DashboardKit";
import { riseIn } from "./components/dashboardMotion";
import IncomeExpenseChart from "./components/IncomeExpenseChart";
import WelcomeDashboard from "./components/WelcomeDashboard";

/**
 * The dashboard.
 *
 * Everyone who signs in is an employee, so there is one of these rather than a
 * screen per persona — what changes between two people is which tiles they were
 * granted, not which page they land on. A role holding none of them gets the
 * welcome screen rather than an empty grid.
 *
 * Only the ledger is on it today. The sales, stock and low-stock tiles this
 * grid is shaped for arrive with their modules; each is a `Metric` behind its
 * own `useHasPermission`, the same as the three below.
 */
const Dashboard: React.FC = () => {
  const { me } = useMe();

  // Per-card permissions — SUPER_ADMIN passes all of these.
  const canIncome = useHasPermission("Income", "View");
  const canExpenses = useHasPermission("Expenses", "View");
  const canProfit = useHasPermission("Net Profit", "View");
  const canIncomeExpense = useHasPermission("Income vs Expenses", "View");

  const hasAnyKpi = canIncome || canExpenses || canProfit;
  const hasAnything = hasAnyKpi || canIncomeExpense;

  // ── Date range (drives the finance tiles) ─────────────────────────────────
  // CustomDatePicker emits [startISO, endISO] with the end pushed to the next
  // midnight — exclusive, as the aggregates expect.
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([
    dayjs().startOf("month").startOf("day").toISOString(),
    dayjs().add(1, "day").startOf("day").toISOString(),
  ]);
  const startDate = dateRange[0] || undefined;
  const endDate = dateRange[1] || undefined;

  const { data: stats, isFetching } = useGetTransactionStatsQuery(
    { startDate, endDate },
    { skip: !hasAnyKpi }
  );

  const { data: financeSeries = [], isFetching: financeChartLoading } =
    useGetTransactionMonthlyQuery(
      { startDate, endDate },
      { skip: !canIncomeExpense }
    );

  if (!hasAnything) {
    return (
      <div className="space-y-4">
        <PageMeta
          title="Dashboard - POS & Inventory"
          description="Welcome to the POS & Inventory admin panel."
          canonicalUrl={window.location.origin}
        />
        <WelcomeDashboard />
      </div>
    );
  }

  // `net` is computed server-side rather than subtracted here, because refunds
  // are contra-entries — an expense refunded lowers Expense instead of adding
  // to Income, and the two tiles would otherwise disagree with the third.
  const income = stats?.incomeTotal ?? 0;
  const expense = stats?.expenseTotal ?? 0;
  const net = stats?.net ?? 0;
  const rangeLabel =
    startDate && endDate
      ? `${dayjs(startDate).format("DD MMM")} – ${dayjs(endDate)
          .subtract(1, "day")
          .format("DD MMM YYYY")}`
      : "All time";

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-4"
    >
      <PageMeta
        title="Dashboard - POS & Inventory"
        description="POS & Inventory admin dashboard — the shop at a glance."
        canonicalUrl={window.location.origin}
      />

      <motion.div
        variants={riseIn}
        className="relative rounded-xl border border-secondary-100 shadow-sm"
      >
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-400 via-primary-700 to-primary-900" />
          <div className="pointer-events-none absolute -right-10 -top-16 h-72 w-72 rounded-full bg-white/20 blur-[60px]" />
          <div className="pointer-events-none absolute left-10 -top-6 h-32 w-48 rounded-full bg-primary-300/30 blur-[40px]" />
        </div>

        <div className="relative flex flex-wrap items-end justify-between gap-3 px-5 py-5">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/70">
              {dayjs().format("dddd, D MMMM YYYY")}
            </p>
            <h1 className="mt-0.5 truncate text-2xl font-bold tracking-tight text-white">
              {me?.name ? `Welcome back, ${me.name.split(" ")[0]}` : "Overview"}
            </h1>
            <p className="mt-1 text-sm text-white/70">
              The shop at a glance · {rangeLabel}
            </p>
          </div>
          {hasAnyKpi && (
            <CustomDatePicker selectedData={dateRange} onChange={setDateRange} />
          )}
        </div>
      </motion.div>

      {hasAnyKpi && (
        <motion.div
          variants={riseIn}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
        >
          {canIncome && (
            <Metric
              label="Income"
              value={<Money value={income} />}
              hint="Money in for the selected range"
              icon={ArrowDownCircle}
              accent="#16a34a"
              loading={isFetching}
            />
          )}
          {canExpenses && (
            <Metric
              label="Expense"
              value={<Money value={expense} />}
              hint="Money out for the selected range"
              icon={ArrowUpCircle}
              accent="#dc2626"
              loading={isFetching}
            />
          )}
          {canProfit && (
            <Metric
              label="Net Profit"
              value={<Money value={net} />}
              hint="Income − Expense"
              icon={Banknote}
              accent="#0F3519"
              loading={isFetching}
            />
          )}
        </motion.div>
      )}

      {canIncomeExpense && (
        <motion.div variants={riseIn}>
          <IncomeExpenseChart
            data={financeSeries}
            loading={financeChartLoading}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default Dashboard;
