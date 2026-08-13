import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { Package, Percent, Receipt, TrendingUp } from "lucide-react";
import { useState } from "react";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import Money from "../../components/shared/Money";
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
          title="The statement"
          subtitle="Each line takes from the one above it"
        >
          <div className="space-y-2 text-sm">
            {/* Revenue arrives already net of what came back. Shown as its
                own line anyway: "we sold 20,000 and 3,000 walked back in" is a
                different fact from "we sold 17,000", and only the first one
                tells anybody to go and look at why. */}
            {(pnl?.returnedRevenue ?? 0) > 0 && (
              <>
                <Row
                  label="Sales before returns"
                  value={(pnl?.revenue ?? 0) + (pnl?.returnedRevenue ?? 0)}
                />
                <Row
                  label={`Less returns (${pnl?.returnCount ?? 0})`}
                  value={-(pnl?.returnedRevenue ?? 0)}
                />
              </>
            )}
            <Row
              label="Revenue (VAT excluded)"
              value={pnl?.revenue ?? 0}
              bold
            />
            <Row
              label="Less cost of goods sold"
              value={-(pnl?.costOfGoods ?? 0)}
            />
            <Divider />
            <Row
              label="Gross profit"
              value={pnl?.grossProfit ?? 0}
              bold
              tone={(pnl?.grossProfit ?? 0) < 0 ? "danger" : "brand"}
            />
            {(pnl?.otherIncome ?? 0) > 0 && (
              <Row label="Plus other income" value={pnl?.otherIncome ?? 0} />
            )}
            <Row
              label="Less running costs"
              value={-(pnl?.operatingExpense ?? 0)}
            />
            <Divider />
            <Row
              label="Net profit"
              value={pnl?.netProfit ?? 0}
              bold
              tone={(pnl?.netProfit ?? 0) < 0 ? "danger" : "brand"}
            />
          </div>

          <div className="mt-4 space-y-1 border-t border-secondary-100 pt-3 text-xs text-secondary-500">
            <p className="m-0">
              {pnl?.invoiceCount ?? 0} invoice
              {pnl?.invoiceCount === 1 ? "" : "s"} · collected{" "}
              <Money value={pnl?.collected ?? 0} /> · still owed{" "}
              <Money value={pnl?.outstanding ?? 0} />
            </p>
            <p className="m-0">
              Stock bought in this period is not a cost here — it becomes one
              when it sells.
            </p>
            {(pnl?.returnedRevenue ?? 0) > 0 && (
              <p className="m-0">
                Returns are dated to the day the goods came back, not the day
                they were sold. Of them, <Money value={pnl?.refundedCash ?? 0} />{" "}
                was handed back in cash; the rest came off unpaid balances.
              </p>
            )}
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

const Row = ({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: number;
  bold?: boolean;
  tone?: "brand" | "danger";
}) => (
  <div className="flex items-center justify-between">
    <span
      className={
        bold ? "font-semibold text-secondary-800" : "text-secondary-600"
      }
    >
      {label}
    </span>
    <span
      className={
        tone === "danger"
          ? "font-bold text-danger"
          : tone === "brand"
            ? "font-bold text-primary-700"
            : bold
              ? "font-semibold text-secondary-800"
              : "text-secondary-600"
      }
    >
      <Money value={value} />
    </span>
  </div>
);

const Divider = () => <div className="border-t border-secondary-200" />;

export default ProfitLoss;
