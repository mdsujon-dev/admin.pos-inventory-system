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

const INCOME = "#285F14"; // teal
const EXPENSE = "#f43f5e"; // rose

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
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f1" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v) => formatCompact(Number(v))}
          />
          <Tooltip
            cursor={{ fill: "rgba(40,95,20,0.06)" }}
            formatter={(v: number) => `৳${Number(v).toLocaleString("en-BD")}`}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e2e8f0",
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
