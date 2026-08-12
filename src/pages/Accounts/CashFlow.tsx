import { DatePicker, Table } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { useState } from "react";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import Money from "../../components/shared/Money";
import { useGetCashFlowQuery } from "../../redux/features/accounts/reportApi";
import { PAYMENT_METHOD_LABELS } from "../../utils/money";
import { SectionCard, StatTile } from "../Inventory/Products/ProductFormUI";

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

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatTile icon={ArrowDownLeft} label="Money in" tone="brand">
          <Money value={cash?.inflow ?? 0} />
        </StatTile>
        <StatTile icon={ArrowUpRight} label="Money out" tone="muted">
          <Money value={cash?.outflow ?? 0} />
        </StatTile>
        <StatTile
          icon={Wallet}
          label="Net movement"
          tone={(cash?.net ?? 0) < 0 ? "danger" : "brand"}
          note={(cash?.net ?? 0) < 0 ? "More went out than came in" : undefined}
        >
          <Money value={cash?.net ?? 0} />
        </StatTile>
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
