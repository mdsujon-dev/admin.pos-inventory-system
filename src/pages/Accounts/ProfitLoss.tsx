import { DatePicker, Table } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { Package, Percent, Receipt, TrendingUp } from "lucide-react";
import { useState } from "react";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import Money from "../../components/shared/Money";
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
          value={<Money value={pnl?.revenue ?? 0} />} 
          loading={isFetching}
        />
        <MetricCard 
          icon={Package} 
          label="Cost of goods" 
          accent="#64748b" 
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
          icon={TrendingUp}
          title="The statement"
          subtitle="Each line takes from the one above it"
        >
          <div className="space-y-2 text-sm">
            <Row label="Revenue (VAT excluded)" value={pnl?.revenue ?? 0} bold />
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
          </div>
        </SectionCard>

        <SectionCard
          icon={Package}
          title="Running costs"
          subtitle="By heading, largest first"
        >
          <Table
            dataSource={pnl?.expenseByCategory ?? []}
            rowKey={(row) => row.categoryId ?? row.name}
            loading={isFetching}
            size="small"
            pagination={false}
            columns={[
              {
                title: "Heading",
                key: "name",
                render: (_: unknown, row) => row.name,
              },
              {
                title: "Entries",
                key: "entryCount",
                width: 90,
                render: (_: unknown, row) => row.entryCount,
              },
              {
                title: "Amount",
                key: "amount",
                width: 130,
                render: (_: unknown, row) => (
                  <span className="font-semibold text-secondary-800">
                    <Money value={row.amount} />
                  </span>
                ),
              },
            ]}
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <span className="font-semibold">Total</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} />
                <Table.Summary.Cell index={2}>
                  <span className="font-bold text-primary-700">
                    <Money value={pnl?.operatingExpense ?? 0} />
                  </span>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
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
    <span className={bold ? "font-semibold text-secondary-800" : "text-secondary-600"}>
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
