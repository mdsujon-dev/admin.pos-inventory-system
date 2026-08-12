import { DatePicker, Table } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { ArrowDownLeft, ArrowUpRight, Wallet, Landmark } from "lucide-react";
import { useState } from "react";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import Money from "../../components/shared/Money";
import { useGetCashFlowQuery } from "../../redux/features/accounts/reportApi";
import { PAYMENT_METHOD_LABELS } from "../../utils/money";
import { SectionCard } from "../Inventory/Products/ProductFormUI";
import { MetricCard } from "../../components/Common/MetricCard";

const { RangePicker } = DatePicker;

const MethodTable = ({
  rows,
  loading,
}: {
  rows: { _id: string | null; amount: number; count: number }[];
  loading?: boolean;
}) => (
  <Table
    dataSource={rows}
    rowKey={(row) => String(row._id ?? "unspecified")}
    loading={loading}
    size="small"
    pagination={false}
    columns={[
      {
        title: "Method",
        key: "method",
        render: (_: unknown, row) =>
          row._id
            ? PAYMENT_METHOD_LABELS[row._id] ?? row._id
            : "Not recorded",
      },
      {
        title: "Entries",
        key: "count",
        width: 90,
        render: (_: unknown, row) => row.count,
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
  />
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

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          icon={ArrowDownLeft}
          title="In"
          subtitle="Sales receipts and anything typed into the ledger as income"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary-500">
            Sales · <Money value={cash?.salesReceipts?.total ?? 0} />
          </p>
          <MethodTable
            rows={cash?.salesReceipts?.byMethod ?? []}
            loading={isFetching}
          />
          {(cash?.otherIncome?.total ?? 0) > 0 && (
            <>
              <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-secondary-500">
                Other income · <Money value={cash?.otherIncome?.total ?? 0} />
              </p>
              <MethodTable rows={cash?.otherIncome?.byMethod ?? []} />
            </>
          )}
        </SectionCard>

        <SectionCard
          icon={ArrowUpRight}
          title="Out"
          subtitle="Paid to suppliers, and the running costs of the shop"
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary-500">
            Suppliers · <Money value={cash?.supplierPayments?.total ?? 0} />
          </p>
          <MethodTable
            rows={cash?.supplierPayments?.byMethod ?? []}
            loading={isFetching}
          />
          <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-secondary-500">
            Running costs · <Money value={cash?.expensePayments?.total ?? 0} />
          </p>
          <MethodTable rows={cash?.expensePayments?.byMethod ?? []} />
        </SectionCard>
      </div>
    </div>
  );
};

export default CashFlow;
