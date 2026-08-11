import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompact } from "./format";
import { MonthPoint } from "./finance";

interface Props {
  data: MonthPoint[];
  loading?: boolean;
}

// One colour, two weights. The palette is a single hue now, so the two series
// are separated by lightness instead: the solid brand for money in, a pale tint
// of the same green for money out. Two adjacent shades (600 and 500) would sit
// beside each other in a bar chart and read as one series.
const INCOME = "#019532"; // primary-600 — the brand
const EXPENSE = "#a8f0c0"; // primary-200

/** Estimated revenue vs expenses by month. */
const IncomeExpenseChart: React.FC<Props> = ({ data, loading }) => (
  <div className="rounded-xl border border-secondary-100 bg-white p-6 lg:col-span-2">
    <div className="mb-5">
      <h3 className="text-lg font-semibold text-secondary-900">
        Income vs Expenses
      </h3>
      <p className="text-xs text-secondary-400">
        Actual income vs expense · selected date range
      </p>
    </div>

    {loading ? (
      <div className="h-[300px] animate-pulse rounded-xl bg-secondary-50" />
    ) : (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 6, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#858585"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#858585"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v) => formatCompact(Number(v))}
          />
          <Tooltip
            cursor={{ fill: "rgba(1,149,50,0.06)" }}
            formatter={(v: number) => `৳${Number(v).toLocaleString("en-BD")}`}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e0e0e0",
              fontSize: 12,
            }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey="income" name="Income" fill={INCOME} radius={[6, 6, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expenses" name="Expenses" fill={EXPENSE} radius={[6, 6, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    )}
  </div>
);

export default IncomeExpenseChart;
