import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { Package, Percent, Receipt, TrendingUp } from "lucide-react";
import { useState } from "react";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import Money from "../../components/shared/Money";
import { Link } from "react-router-dom";
import DataTable from "../../components/Table/DataTable";
import TableEmpty from "../../components/Table/TableEmpty";
import { useGetProfitAndLossQuery } from "../../redux/features/accounts/reportApi";
import { SectionCard } from "../Inventory/Products/ProductFormUI";
import { MetricCard } from "../../components/Common/MetricCard";

const { RangePicker } = DatePicker;

/**
 * Profit and loss, laid out the way it is read: down the page, each line
 * subtracting from the one above, so the final figure is arrived at rather
 * than announced.
 */
const ProfitLoss = () => {
  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs(),
  ]);

  const { data, isFetching } = useGetProfitAndLossQuery([
    { name: "from", value: range[0].toISOString() },
    { name: "to", value: range[1].toISOString() },
  ]);

  const pnl = data?.data;

  /**
   * The headings, with the total as its own last row.
   *
   * AntD's summary row does not exist on the shared table, and a total that
   * lives outside the table can drift from what is above it — as a row it is
   * built from the same list the reader is looking at.
   */
  const expenseRows = (() => {
    const rows = (pnl?.expenseByCategory ?? []).map((row: any) => ({
      ...row,
      key: row.categoryId ?? row.name,
      isTotal: false,
    }));
    if (rows.length === 0) return rows;
    return [
      ...rows,
      {
        key: "__total",
        name: "Total",
        amount: pnl?.operatingExpense ?? 0,
        entryCount: 0,
        isTotal: true,
      },
    ];
  })();

  return (
    <div>
      <PageMeta
        title="Profit & Loss - POS & Inventory"
        description="Revenue, cost of goods and running costs for any period"
        noindex
      />
      <PageHeader
        title="Profit & Loss"
        subtitle="Trading revenue less what the goods cost, less what the shop costs"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Accounts", path: "/accounts" },
          { title: "Profit & Loss" },
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

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Receipt}
          label="Revenue"
          accent="#10b981"
          hint="Total income from sales"
          value={<Money value={pnl?.revenue ?? 0} />}
          loading={isFetching}
        />
        <MetricCard
          icon={Package}
          label="Cost of goods"
          accent="#64748b"
          hint="Direct costs for items sold"
          value={<Money value={pnl?.costOfGoods ?? 0} />}
          loading={isFetching}
        />
        <MetricCard
          icon={TrendingUp}
          label="Gross profit"
          accent={(pnl?.grossProfit ?? 0) < 0 ? "#f43f5e" : "#10b981"}
          hint={`${(pnl?.grossMargin ?? 0).toFixed(1)}% margin`}
          value={<Money value={pnl?.grossProfit ?? 0} />}
          loading={isFetching}
        />
        <MetricCard
          icon={Percent}
          label="Net profit"
          accent={(pnl?.netProfit ?? 0) < 0 ? "#f43f5e" : "#10b981"}
          hint={`${(pnl?.netMargin ?? 0).toFixed(1)}% of revenue`}
          value={<Money value={pnl?.netProfit ?? 0} />}
          loading={isFetching}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Where the money went"
          subtitle="Read it top to bottom — each step takes from the one above"
        >
          {/* Written as a story rather than an accountant's statement. The
              terms of art (revenue, COGS, gross profit) are kept as the small
              grey line under each step, so the page teaches them instead of
              assuming them. */}
          <div className="space-y-2.5">
            <Step
              order={1}
              title="What customers paid us"
              hint="Revenue — VAT excluded, returns already taken off"
              value={pnl?.revenue ?? 0}
              tone="in"
            />

            {(pnl?.returnedRevenue ?? 0) > 0 && (
              <p className="m-0 -mt-1 pl-11 text-[11px] text-secondary-400">
                Sold <Money value={(pnl?.revenue ?? 0) + (pnl?.returnedRevenue ?? 0)} />,
                of which <Money value={pnl?.returnedRevenue ?? 0} /> came back on{" "}
                {pnl?.returnCount ?? 0} return
                {pnl?.returnCount === 1 ? "" : "s"}.
              </p>
            )}

            <Step
              order={2}
              title="What those goods cost us"
              hint="Cost of goods sold — what we paid the supplier for exactly the items that sold"
              value={-(pnl?.costOfGoods ?? 0)}
              tone="out"
            />

            <Result
              label="Profit on the goods"
              hint={`${(pnl?.grossMargin ?? 0).toFixed(1)}% of what customers paid`}
              value={pnl?.grossProfit ?? 0}
            />

            {(pnl?.otherIncome ?? 0) > 0 && (
              <Step
                order={3}
                title="Money in from anything else"
                hint="Rebates, scrap sales, pass-through deals"
                value={pnl?.otherIncome ?? 0}
                tone="in"
              />
            )}

            <Step
              order={(pnl?.otherIncome ?? 0) > 0 ? 4 : 3}
              title="What it costs to run the shop"
              hint="Salary, rent, electricity, stock written off — everything in the list beside this"
              value={-(pnl?.operatingExpense ?? 0)}
              tone="out"
            />

            <Result
              label={(pnl?.netProfit ?? 0) < 0 ? "Loss for the period" : "Profit kept"}
              hint={
                (pnl?.netProfit ?? 0) < 0
                  ? "The shop spent more than it earned"
                  : `${(pnl?.netMargin ?? 0).toFixed(1)}% of what customers paid`
              }
              value={pnl?.netProfit ?? 0}
              final
            />
          </div>

          <div className="mt-4 space-y-1.5 border-t border-secondary-100 pt-3 text-[12px] text-secondary-500">
            <p className="m-0">
              <strong className="text-secondary-700">
                {pnl?.invoiceCount ?? 0} invoice
                {pnl?.invoiceCount === 1 ? "" : "s"}
              </strong>{" "}
              · <Money value={pnl?.collected ?? 0} /> collected ·{" "}
              <Money value={pnl?.outstanding ?? 0} /> still owed
            </p>
            <p className="m-0">
              <strong className="text-secondary-700">
                Buying stock is not a cost here.
              </strong>{" "}
              Money spent on stock this month becomes a cost on the day that
              stock sells — until then it is goods on the shelf, not an expense.
            </p>
            <p className="m-0">
              <strong className="text-secondary-700">
                Profit is not cash.
              </strong>{" "}
              A sale on credit counts as profit before the money arrives. What
              actually moved is on the{" "}
              <Link to="/accounts/cash-flow" className="text-primary underline">
                cash flow
              </Link>
              .
            </p>
          </div>
        </SectionCard>

        <SectionCard
          title="Running costs"
          subtitle="By heading, largest first"
        >
          <DataTable
            data={expenseRows}
            rowKey="key"
            loading={isFetching}
            emptyText={
              <TableEmpty
                icon={Package}
                title="No running costs recorded"
                hint="Rent, salary and electricity are entered under Income & Expense, and land here under their heading."
              />
            }
            columns={[
              {
                title: "Heading",
                key: "name",
                render: (_: unknown, row: any) =>
                  row.isTotal ? (
                    <span className="font-bold text-secondary-800">Total</span>
                  ) : (
                    <span
                      className={
                        row.categoryId
                          ? "text-secondary-700"
                          : "text-[#92400e]"
                      }
                    >
                      {row.name}
                    </span>
                  ),
              },
              {
                title: "Entries",
                key: "entryCount",
                width: 90,
                render: (_: unknown, row: any) =>
                  row.isTotal ? "" : row.entryCount,
              },
              {
                title: "Amount",
                key: "amount",
                width: 140,
                align: "right" as const,
                render: (_: unknown, row: any) => (
                  <span
                    className={
                      row.isTotal
                        ? "text-[15px] font-bold text-primary-700"
                        : "font-semibold text-secondary-800"
                    }
                  >
                    <Money value={row.amount} />
                  </span>
                ),
              },
            ]}
          />
        </SectionCard>
      </div>
    </div>
  );
};

/**
 * One step in the story, with the accounting term underneath it.
 *
 * The plain sentence is the heading and the jargon is the footnote, not the
 * other way round: somebody reading this wants to know what happened, and the
 * word "COGS" only helps once they already do.
 */
const Step = ({
  order,
  title,
  hint,
  value,
  tone,
}: {
  order: number;
  title: string;
  hint: string;
  value: number;
  tone: "in" | "out";
}) => (
  <div className="flex items-start gap-3">
    <span
      className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded text-[12px] font-bold ${
        tone === "in"
          ? "bg-primary-50 text-primary-700"
          : "bg-danger/10 text-danger"
      }`}
    >
      {order}
    </span>
    <div className="min-w-0 flex-1">
      <p className="m-0 text-[14px] font-semibold text-secondary-800">
        {title}
      </p>
      <p className="m-0 text-[11px] leading-snug text-secondary-400">{hint}</p>
    </div>
    <span
      className={`shrink-0 text-[15px] font-bold ${
        tone === "in" ? "text-secondary-800" : "text-danger"
      }`}
    >
      {tone === "out" ? "− " : ""}
      <Money value={Math.abs(value)} />
    </span>
  </div>
);

/** A subtotal, set apart so the eye can find the two figures that matter. */
const Result = ({
  label,
  hint,
  value,
  final,
}: {
  label: string;
  hint: string;
  value: number;
  final?: boolean;
}) => {
  const negative = value < 0;
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-md px-3 py-2.5 ${
        final
          ? negative
            ? "bg-danger/10"
            : "bg-gradient-to-r from-primary-600 to-primary-500"
          : "bg-secondary-50"
      }`}
    >
      <div className="min-w-0">
        <p
          className={`m-0 text-[14px] font-bold ${
            final && !negative ? "text-white" : "text-secondary-800"
          }`}
        >
          {label}
        </p>
        <p
          className={`m-0 text-[11px] ${
            final && !negative ? "text-white/75" : "text-secondary-400"
          }`}
        >
          {hint}
        </p>
      </div>
      <span
        className={`shrink-0 text-[20px] font-bold ${
          final && !negative
            ? "text-white"
            : negative
              ? "text-danger"
              : "text-primary-700"
        }`}
      >
        <Money value={value} />
      </span>
    </div>
  );
};

export default ProfitLoss;
