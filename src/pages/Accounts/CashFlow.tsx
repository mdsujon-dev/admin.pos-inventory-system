import { DatePicker, Tabs } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { ArrowDownLeft, ArrowUpRight, Wallet, Landmark } from "lucide-react";
import { useMemo, useState } from "react";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import Money from "../../components/shared/Money";
import DataTable from "../../components/Table/DataTable";
import { useGetCashFlowQuery } from "../../redux/features/accounts/reportApi";
import { PAYMENT_METHOD_LABELS } from "../../utils/money";
import { MetricCard } from "../../components/Common/MetricCard";

const { RangePicker } = DatePicker;

interface MethodGroup {
  _id: string | null;
  amount: number;
  count: number;
}

interface FlowRow {
  key: string;
  source: string;
  method: string;
  count: number;
  amount: number;
}

/**
 * Flattens the report's separate buckets into one list.
 *
 * Sales and other income are two questions on the way in, suppliers and
 * running costs two on the way out — but they are all the same shape, and a
 * reader comparing them wants one table to scan, not two stacked ones with
 * their own headers.
 */
const toRows = (groups: { label: string; rows?: MethodGroup[] }[]): FlowRow[] =>
  groups.flatMap(({ label, rows }) =>
    (rows ?? []).map((row) => ({
      key: `${label}-${row._id ?? "unspecified"}`,
      source: label,
      method: row._id
        ? PAYMENT_METHOD_LABELS[row._id] ?? row._id
        : "Not recorded",
      count: row.count,
      amount: row.amount,
    }))
  );

const columns = [
  {
    title: "Source",
    key: "source",
    render: (_: unknown, row: FlowRow) => (
      <span className="font-medium text-secondary-800">{row.source}</span>
    ),
  },
  {
    title: "Method",
    key: "method",
    render: (_: unknown, row: FlowRow) => (
      <span className="text-secondary-600">{row.method}</span>
    ),
  },
  {
    title: "Entries",
    key: "count",
    width: 100,
    render: (_: unknown, row: FlowRow) => row.count,
  },
  {
    title: "Amount",
    key: "amount",
    width: 150,
    align: "right" as const,
    render: (_: unknown, row: FlowRow) => (
      <span className="font-semibold text-secondary-800">
        <Money value={row.amount} />
      </span>
    ),
  },
];

/** The tab label: what it is, and what it came to. */
const TabLabel = ({
  icon: Icon,
  title,
  total,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  total: number;
  accent: string;
}) => (
  <span className="flex items-center gap-2 px-1 py-0.5">
    <span
      className="grid h-7 w-7 place-items-center rounded-lg text-white"
      style={{ background: accent }}
    >
      <Icon className="h-[15px] w-[15px]" />
    </span>
    <span className="flex flex-col items-start leading-tight">
      <span className="text-[13px] font-semibold">{title}</span>
      <span className="text-[11px] font-normal text-secondary-400">
        <Money value={total} />
      </span>
    </span>
  </span>
);

/**
 * Money in and money out, by how it moved.
 *
 * Cash basis, which is the opposite of the profit and loss screen and just as
 * true: this one counts what was paid, that one counts what was earned. A shop
 * can be trading profitably and still be short at the end of the month, and
 * only this screen shows where it went.
 */
const CashFlow = () => {
  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs(),
  ]);

  const { data, isFetching } = useGetCashFlowQuery([
    { name: "from", value: range[0].toISOString() },
    { name: "to", value: range[1].toISOString() },
  ]);

  const cash = data?.data;

  const moneyIn = useMemo(
    () =>
      toRows([
        { label: "Sales", rows: cash?.salesReceipts?.byMethod },
        { label: "Other income", rows: cash?.otherIncome?.byMethod },
      ]),
    [cash]
  );

  const moneyOut = useMemo(
    () =>
      toRows([
        { label: "Suppliers", rows: cash?.supplierPayments?.byMethod },
        { label: "Running costs", rows: cash?.expensePayments?.byMethod },
      ]),
    [cash]
  );

  return (
    <div>
      <PageMeta
        title="Cash Flow - POS & Inventory"
        description="What came in and what went out, by method"
        noindex
      />
      <PageHeader
        title="Cash Flow"
        subtitle="What actually moved through the till, however it moved"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Accounts", path: "/accounts" },
          { title: "Cash Flow" },
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
          icon={ArrowDownLeft}
          label="Money in"
          accent="#10b981"
          hint="Total cash received"
          value={<Money value={cash?.inflow ?? 0} />}
          loading={isFetching}
        />
        <MetricCard
          icon={ArrowUpRight}
          label="Money out"
          accent="#f43f5e"
          hint="Total cash spent"
          value={<Money value={cash?.outflow ?? 0} />}
          loading={isFetching}
        />
        <MetricCard
          icon={Landmark}
          label="Paid to vendors"
          accent="#f59e0b"
          hint="Stock bought in this period"
          value={<Money value={cash?.supplierPayments?.total ?? 0} />}
          loading={isFetching}
        />
        <MetricCard
          icon={Wallet}
          label="Net movement"
          accent={(cash?.net ?? 0) < 0 ? "#f43f5e" : "#10b981"}
          hint={(cash?.net ?? 0) < 0 ? "More went out than came in" : "Positive cash flow"}
          value={<Money value={cash?.net ?? 0} />}
          loading={isFetching}
        />
      </div>

      <Tabs
        defaultActiveKey="in"
        items={[
          {
            key: "in",
            label: (
              <TabLabel
                icon={ArrowDownLeft}
                title="In"
                total={cash?.inflow ?? 0}
                accent="#10b981"
              />
            ),
            children: (
              <DataTable
                data={moneyIn}
                columns={columns}
                rowKey="key"
                loading={isFetching}
                emptyText="Nothing came in during this period"
              />
            ),
          },
          {
            key: "out",
            label: (
              <TabLabel
                icon={ArrowUpRight}
                title="Out"
                total={cash?.outflow ?? 0}
                accent="#f43f5e"
              />
            ),
            children: (
              <DataTable
                data={moneyOut}
                columns={columns}
                rowKey="key"
                loading={isFetching}
                emptyText="Nothing went out during this period"
              />
            ),
          },
        ]}
      />
    </div>
  );
};

export default CashFlow;
