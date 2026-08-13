import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Package,
  Percent,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import Money from "../../components/shared/Money";
import {
  useGetCashFlowQuery,
  useGetPayablesQuery,
  useGetPotentialProfitQuery,
  useGetProfitAndLossQuery,
} from "../../redux/features/accounts/reportApi";
import { SectionCard } from "../Inventory/Products/ProductFormUI";
import { MetricCard } from "../../components/Common/MetricCard";
import AccountsCharts from "./components/AccountsCharts";

const { RangePicker } = DatePicker;

/**
 * The books at a glance.
 *
 * Two answers side by side, because they are different questions and a shop
 * needs both: profit says whether trading is working, cash says whether the
 * rent can be paid. A profitable month with everything tied up in stock is a
 * real situation, and only the second half of this screen shows it.
 */
const AccountsOverview = () => {
  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs(),
  ]);

  const args = [
    { name: "from", value: range[0].toISOString() },
    { name: "to", value: range[1].toISOString() },
  ];

  const { data: pnlData } = useGetProfitAndLossQuery(args);
  const { data: cashData } = useGetCashFlowQuery(args);
  const { data: stockData } = useGetPotentialProfitQuery(undefined);
  // Not date-filtered on purpose: a debt is owed today whenever it was run up.
  const { data: payablesData } = useGetPayablesQuery(undefined);

  const pnl = pnlData?.data;
  const cash = cashData?.data;
  const stock = stockData?.data;
  const payables = payablesData?.data;

  return (
    <div>
      <PageMeta
        title="Accounts - POS & Inventory"
        description="Profit, cash position and what the shop is sitting on"
        noindex
      />
      <PageHeader
        title="Accounts"
        subtitle="What the shop earned, what it holds, and what moved through the till"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Accounts" },
        ]}
        extra={
          <RangePicker
            value={range}
            onChange={(value) =>
              value?.[0] && value?.[1] && setRange([value[0], value[1]])
            }
            allowClear={false}
          />
        }
      />

      {/* Trading */}
      <SectionCard
        icon={TrendingUp}
        title="Trading"
        subtitle="Revenue less what the goods cost, then less what the shop costs to run"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={Receipt} label="Revenue" accent="#10b981" hint="VAT excluded" value={<Money value={pnl?.revenue ?? 0} />} />
          <MetricCard
            icon={Package}
            label="Cost of goods"
            accent="#64748b"
            hint="From the batches actually sold"
            value={<Money value={pnl?.costOfGoods ?? 0} />}
          />
          <MetricCard
            icon={TrendingUp}
            label="Gross profit"
            accent={(pnl?.grossProfit ?? 0) < 0 ? "#f43f5e" : "#10b981"}
            hint={`${(pnl?.grossMargin ?? 0).toFixed(1)}% margin`}
            value={<Money value={pnl?.grossProfit ?? 0} />}
          />
          <MetricCard
            icon={Percent}
            label="Net profit"
            accent={(pnl?.netProfit ?? 0) < 0 ? "#f43f5e" : "#10b981"}
            hint={`After ${
              pnl ? Math.round(pnl.operatingExpense) : 0
            } of running costs`}
            value={<Money value={pnl?.netProfit ?? 0} />}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-sm text-secondary-500">
          <span>
            {pnl?.invoiceCount ?? 0} invoice
            {pnl?.invoiceCount === 1 ? "" : "s"}
          </span>
          <span>
            Discounts given <Money value={pnl?.discountGiven ?? 0} />
          </span>
          <span>
            VAT collected <Money value={pnl?.vatCollected ?? 0} />
          </span>
          <Link to="/accounts/profit-loss" className="text-primary underline">
            Full profit &amp; loss
          </Link>
        </div>
      </SectionCard>

      {/* Cash */}
      <div className="mt-4">
        <SectionCard
          icon={Wallet}
          title="Cash"
          subtitle="What actually moved — a profitable month can still be a tight one"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard icon={ArrowDownLeft} label="Money in" accent="#10b981" hint="Total cash received" value={<Money value={cash?.inflow ?? 0} />} />
            <MetricCard icon={ArrowUpRight} label="Money out" accent="#64748b" hint="Total cash spent" value={<Money value={cash?.outflow ?? 0} />} />
            <MetricCard
              icon={Wallet}
              label="Net movement"
              accent={(cash?.net ?? 0) < 0 ? "#f43f5e" : "#10b981"}
              value={<Money value={cash?.net ?? 0} />}
            />
            <MetricCard
              icon={Landmark}
              label="Paid to vendors"
              accent="#64748b"
              hint="Stock bought in this period"
              value={<Money value={cash?.supplierPayments?.total ?? 0} />}
            />
          </div>
          <div className="mt-3">
            <Link to="/accounts/cash-flow" className="text-sm text-primary underline">
              Cash flow by method
            </Link>
          </div>
        </SectionCard>
      </div>

      {/* What is on the shelf */}
      <div className="mt-4">
        <SectionCard
          icon={Package}
          title="On the shelf"
          subtitle="What the stock cost, and what it would earn if it all sold today"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard icon={Package} label="Stock at cost" accent="#10b981" hint="Total paid for inventory" value={<Money value={stock?.stockCost ?? 0} />} />
            <MetricCard icon={Receipt} label="At today's prices" accent="#64748b" hint="Expected retail value" value={<Money value={stock?.stockRetail ?? 0} />} />
            <MetricCard
              icon={TrendingUp}
              label="Potential profit"
              accent="#10b981"
              hint="A forecast — none of it is sold yet"
              value={<Money value={stock?.potentialProfit ?? 0} />}
            />
            <MetricCard
              icon={Percent}
              label="Potential margin"
              accent="#10b981"
              value={`${(stock?.potentialMargin ?? 0).toFixed(1)}%`}
            />
          </div>
          <div className="mt-3">
            <Link
              to="/accounts/stock-valuation"
              className="text-sm text-primary underline"
            >
              Stock valuation, item by item
            </Link>
          </div>
        </SectionCard>
      </div>

      {/* The same figures as the cards above, drawn. Numbers first, because
          they are what gets written down; the shapes are for the second look. */}
      <div className="mt-4">
        <AccountsCharts pnl={pnl} cash={cash} stock={stock} />
      </div>

      {/* Owed both ways */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard
          icon={ArrowDownLeft}
          title="Customers owe us"
          subtitle="Sales left unpaid"
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-danger">
              <Money value={pnl?.outstanding ?? 0} />
            </span>
            <Link to="/sales/receivables" className="text-sm text-primary underline">
              Who owes what
            </Link>
          </div>
        </SectionCard>

        <SectionCard
          icon={ArrowUpRight}
          title="We owe vendors"
          subtitle="Bills not yet settled"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-danger">
                <Money value={payables?.totalDue ?? 0} />
              </span>
              <p className="m-0 text-xs text-secondary-500">
                across {payables?.billCount ?? 0} bill
                {payables?.billCount === 1 ? "" : "s"}
              </p>
            </div>
            <Link
              to="/purchases/payables"
              className="text-sm text-primary underline"
            >
              Open the payables list
            </Link>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default AccountsOverview;
