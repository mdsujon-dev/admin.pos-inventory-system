import { DatePicker, Table } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { Receipt, TrendingUp, Users, Wallet } from "lucide-react";
import { useState } from "react";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import Money from "../../components/shared/Money";
import { useGetEmployeeSalesQuery } from "../../redux/features/crm/crmApi";
import { SectionCard, StatTile } from "../Inventory/Products/ProductFormUI";

const { RangePicker } = DatePicker;

/**
 * Who sold what.
 *
 * Ranked by revenue with profit beside it, because the two disagree more often
 * than anyone expects — the biggest seller is sometimes the biggest
 * discounter, and only the second column shows it.
 */
const EmployeeSales = () => {
  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs(),
  ]);

  const { data, isFetching } = useGetEmployeeSalesQuery([
    { name: "from", value: range[0].toISOString() },
    { name: "to", value: range[1].toISOString() },
  ]);

  const rows = data?.data ?? [];
  const revenue = rows.reduce((sum: number, row: any) => sum + row.revenue, 0);
  const profit = rows.reduce((sum: number, row: any) => sum + row.profit, 0);
  const invoices = rows.reduce(
    (sum: number, row: any) => sum + row.invoiceCount,
    0
  );

  return (
    <div>
      <PageMeta
        title="Staff Performance - POS & Inventory"
        description="Sales by employee for any period"
        noindex
      />
      <PageHeader
        title="Staff Performance"
        subtitle="Who rang up what, and what it earned"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Accounts" },
          { title: "Staff Performance" },
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
        <StatTile icon={Users} label="Staff selling" tone="muted">
          {rows.length}
        </StatTile>
        <StatTile icon={Receipt} label="Invoices" tone="muted">
          {invoices}
        </StatTile>
        <StatTile icon={Wallet} label="Revenue" tone="brand">
          <Money value={revenue} />
        </StatTile>
        <StatTile
          icon={TrendingUp}
          label="Profit"
          tone={profit < 0 ? "danger" : "brand"}
        >
          <Money value={profit} />
        </StatTile>
      </div>

      <SectionCard
        icon={Users}
        title="By employee"
        subtitle="Revenue first, with what it actually earned beside it"
      >
        <Table
          dataSource={rows}
          rowKey={(row: any) => String(row._id ?? "unassigned")}
          loading={isFetching}
          size="small"
          pagination={{ pageSize: 20, hideOnSinglePage: true }}
          columns={[
            {
              title: "Employee",
              key: "name",
              render: (_: unknown, row: any) => (
                <span className="font-medium text-secondary-800">
                  {row.name || "Not recorded"}
                </span>
              ),
            },
            {
              title: "Invoices",
              key: "invoiceCount",
              width: 100,
              render: (_: unknown, row: any) => row.invoiceCount,
            },
            {
              title: "Items",
              key: "itemsSold",
              width: 90,
              render: (_: unknown, row: any) => row.itemsSold,
            },
            {
              title: "Revenue",
              key: "revenue",
              width: 130,
              render: (_: unknown, row: any) => (
                <span className="font-semibold text-secondary-800">
                  <Money value={row.revenue} />
                </span>
              ),
            },
            {
              title: "Profit",
              key: "profit",
              width: 130,
              render: (_: unknown, row: any) => (
                <span
                  className={
                    row.profit < 0
                      ? "font-semibold text-danger"
                      : "font-semibold text-primary-700"
                  }
                >
                  <Money value={row.profit} />
                </span>
              ),
            },
            {
              title: "Average sale",
              key: "averageSale",
              width: 130,
              render: (_: unknown, row: any) => (
                <Money value={row.averageSale} />
              ),
            },
            {
              title: "Uncollected",
              key: "outstanding",
              width: 130,
              render: (_: unknown, row: any) =>
                row.outstanding > 0 ? (
                  <span className="font-medium text-danger">
                    <Money value={row.outstanding} />
                  </span>
                ) : (
                  <span className="text-secondary-400">—</span>
                ),
            },
            {
              title: "Last sale",
              key: "lastSaleAt",
              width: 130,
              render: (_: unknown, row: any) =>
                row.lastSaleAt
                  ? dayjs(row.lastSaleAt).format("DD MMM YYYY")
                  : "—",
            },
          ]}
        />
      </SectionCard>
    </div>
  );
};

export default EmployeeSales;
