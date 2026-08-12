import { ApexOptions } from "apexcharts";
import React from "react";
import ReactApexChart from "react-apexcharts";
import { formatCompact, formatExact } from "../../../utils/money";

/**
 * A chart panel, dressed like the tables next to it.
 *
 * Same glass, same green hairline — the charts are another way of reading the
 * same books, not a separate widget stuck onto the page.
 */
const ChartCard = ({
  title,
  subtitle,
  hasData,
  emptyText,
  children,
}: {
  title: string;
  subtitle: string;
  hasData: boolean;
  emptyText: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-lg border border-primary/30 bg-white/40 p-4 backdrop-blur-md">
    <p className="m-0 text-[14px] font-bold text-secondary-800">{title}</p>
    <p className="m-0 mb-2 text-[12px] text-secondary-400">{subtitle}</p>
    {hasData ? (
      children
    ) : (
      <div className="grid h-[240px] place-items-center text-center">
        <p className="m-0 max-w-[240px] text-[13px] text-secondary-400">
          {emptyText}
        </p>
      </div>
    )}
  </div>
);

/** Shared axis and tooltip behaviour — money everywhere, short on the axis. */
const moneyAxis = {
  labels: {
    formatter: (value: number) => formatCompact(value),
    style: { colors: "#858585", fontSize: "11px" },
  },
};

const moneyTooltip = {
  y: { formatter: (value: number) => formatExact(value) },
};

const baseChart: ApexOptions["chart"] = {
  toolbar: { show: false },
  fontFamily: "inherit",
  background: "transparent",
};

export interface AccountsChartsProps {
  pnl?: {
    revenue: number;
    costOfGoods: number;
    operatingExpense: number;
    netProfit: number;
  };
  cash?: {
    salesReceipts?: { total: number };
    otherIncome?: { total: number };
    supplierPayments?: { total: number };
    expensePayments?: { total: number };
  };
  stock?: { stockCost: number; potentialProfit: number };
}

/**
 * The three questions the numbers above already answer, drawn.
 *
 * Deliberately the same figures as the cards rather than new ones: a chart
 * that disagrees with the number beside it is worse than no chart, and the
 * point here is shape — how much of the revenue survives to the bottom, which
 * way the cash leans, how much of the shelf is markup.
 */
const AccountsCharts = ({ pnl, cash, stock }: AccountsChartsProps) => {
  const revenue = pnl?.revenue ?? 0;
  const cogs = pnl?.costOfGoods ?? 0;
  const opex = pnl?.operatingExpense ?? 0;
  const net = pnl?.netProfit ?? 0;

  const salesIn = cash?.salesReceipts?.total ?? 0;
  const otherIn = cash?.otherIncome?.total ?? 0;
  const suppliersOut = cash?.supplierPayments?.total ?? 0;
  const costsOut = cash?.expensePayments?.total ?? 0;

  const stockCost = stock?.stockCost ?? 0;
  const markup = stock?.potentialProfit ?? 0;

  /** Revenue, and what is left of it after each bite. */
  const tradingOptions: ApexOptions = {
    chart: { ...baseChart, type: "bar" },
    colors: ["#3b82f6", "#f59e0b", "#8b5cf6", net < 0 ? "#f43f5e" : "#019532"],
    plotOptions: {
      bar: { borderRadius: 6, columnWidth: "55%", distributed: true },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    grid: { borderColor: "#f0f2f0", strokeDashArray: 4 },
    xaxis: {
      categories: ["Revenue", "Cost of goods", "Running costs", "Net profit"],
      labels: { style: { colors: "#858585", fontSize: "11px" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: moneyAxis,
    tooltip: moneyTooltip,
  };

  /** Which way the till leaned, and what each side was made of. */
  const cashOptions: ApexOptions = {
    chart: { ...baseChart, type: "bar", stacked: true },
    colors: ["#10b981", "#06b6d4"],
    plotOptions: {
      bar: { borderRadius: 6, horizontal: true, barHeight: "45%" },
    },
    dataLabels: { enabled: false },
    legend: { position: "top", horizontalAlign: "left", fontSize: "12px" },
    grid: { borderColor: "#f0f2f0", strokeDashArray: 4 },
    xaxis: { categories: ["In", "Out"], ...moneyAxis },
    yaxis: { labels: { style: { colors: "#858585", fontSize: "12px" } } },
    tooltip: moneyTooltip,
  };

  const cashSeries = [
    { name: "Sales / Suppliers", data: [salesIn, suppliersOut] },
    { name: "Other / Running costs", data: [otherIn, costsOut] },
  ];

  /** How much of the shelf's ticket price is markup rather than cost. */
  const shelfOptions: ApexOptions = {
    chart: { ...baseChart, type: "donut" },
    colors: ["#64748b", "#019532"],
    labels: ["Stock at cost", "Potential profit"],
    stroke: { width: 0 },
    legend: { position: "bottom", fontSize: "12px" },
    dataLabels: {
      enabled: true,
      formatter: (value: number) => `${Number(value).toFixed(0)}%`,
      style: { fontSize: "11px" },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "At today's prices",
              fontSize: "11px",
              color: "#858585",
              formatter: () => formatCompact(stockCost + markup),
            },
          },
        },
      },
    },
    tooltip: moneyTooltip,
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ChartCard
        title="Where the money went"
        subtitle="Revenue, and what each cost takes out of it"
        hasData={revenue > 0 || cogs > 0 || opex > 0}
        emptyText="Nothing traded in this period, so there is nothing to break down."
      >
        <ReactApexChart
          options={tradingOptions}
          series={[{ name: "Amount", data: [revenue, cogs, opex, net] }]}
          type="bar"
          height={260}
        />
      </ChartCard>

      <ChartCard
        title="Cash in and out"
        subtitle="What moved through the till, and where it came from"
        hasData={salesIn + otherIn + suppliersOut + costsOut > 0}
        emptyText="No money moved in this period."
      >
        <ReactApexChart
          options={cashOptions}
          series={cashSeries}
          type="bar"
          height={260}
        />
      </ChartCard>

      <ChartCard
        title="On the shelf"
        subtitle="What the stock cost against what it would earn"
        hasData={stockCost + markup > 0}
        emptyText="There is no stock on hand to value."
      >
        <ReactApexChart
          options={shelfOptions}
          series={[stockCost, markup]}
          type="donut"
          height={260}
        />
      </ChartCard>
    </div>
  );
};

export default AccountsCharts;
