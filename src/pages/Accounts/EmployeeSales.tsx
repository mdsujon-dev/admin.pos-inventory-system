import { DatePicker, Tag } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { Percent, Receipt, TrendingUp, Users, Wallet } from "lucide-react";
import { useState } from "react";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import { MetricCard } from "../../components/Common/MetricCard";
import Money from "../../components/shared/Money";
import DataTable from "../../components/Table/DataTable";
import TableEmpty from "../../components/Table/TableEmpty";
import { useGetEmployeeSalesQuery } from "../../redux/features/crm/crmApi";
import { SectionCard } from "../Inventory/Products/ProductFormUI";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);

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
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const top = rows[0] as { name?: string; revenue?: number } | undefined;

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

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Staff selling"
          accent="#8b5cf6"
          hint={top?.name ? `${top.name} leads on revenue` : "Nobody sold yet"}
          value={rows.length}
          loading={isFetching}
        />
        <MetricCard
          icon={Receipt}
          label="Invoices"
          accent="#3b82f6"
          hint={`${invoices === 0 ? "No" : invoices} sale${
            invoices === 1 ? "" : "s"
          } rung up`}
          value={invoices}
          loading={isFetching}
        />
        <MetricCard
          icon={Wallet}
          label="Revenue"
          accent="#019532"
          hint="VAT excluded, as in the profit & loss"
          value={<Money value={revenue} />}
          loading={isFetching}
        />
        <MetricCard
          icon={profit < 0 ? Percent : TrendingUp}
          label="Profit"
          accent={profit < 0 ? "#f43f5e" : "#10b981"}
          hint={`${margin.toFixed(1)}% of revenue kept`}
          value={<Money value={profit} />}
          loading={isFetching}
        />
      </div>

      <SectionCard
        icon={Users}
        title="By employee"
        subtitle="Revenue first, with what it actually earned beside it"
      >
        {/* Said once, on the screen, rather than left to be inferred from the
            column headings — the whole page is only as useful as the reader's
            confidence in what each figure counts. */}
        <p className="mb-3 text-[12px] text-secondary-500">
          A sale counts for whoever was logged in when it was saved. Revenue
          excludes VAT; profit is revenue less the FIFO cost of the batches that
          left the shelf, so a discount comes straight off it.
        </p>

        <DataTable
          data={rows}
          rowKey={(row: any) => String(row._id ?? "unassigned")}
          loading={isFetching}
          total={rows.length}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          limit={limit}
          setLimit={setLimit}
          isPaginate={rows.length > limit}
          emptyText={
            <TableEmpty
              icon={Users}
              title="Nobody sold anything"
              hint="No invoice was saved in this date range."
            />
          }
          columns={[
            {
              title: "Employee",
              key: "name",
              render: (_: unknown, row: any, index: number) => (
                <div className="flex items-center gap-2">
                  {/* Rank, because the sort order is the point of the table
                      and a reader should not have to count rows to see it. */}
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-50 text-[11px] font-bold text-primary-700">
                    {index + 1}
                  </span>
                  <span className="font-medium text-secondary-800">
                    {row.name || "Not recorded"}
                  </span>
                </div>
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
              width: 140,
              render: (_: unknown, row: any) => (
                <div>
                  <span className="font-semibold text-secondary-800">
                    <Money value={row.revenue} />
                  </span>
                  {revenue > 0 && (
                    <p className="m-0 text-[11px] text-secondary-400">
                      {((row.revenue / revenue) * 100).toFixed(0)}% of the total
                    </p>
                  )}
                </div>
              ),
            },
            {
              title: "Profit",
              key: "profit",
              width: 140,
              render: (_: unknown, row: any) => (
                <div>
                  <span
                    className={
                      row.profit < 0
                        ? "font-semibold text-danger"
                        : "font-semibold text-primary-700"
                    }
                  >
                    <Money value={row.profit} />
                  </span>
                  <p className="m-0 text-[11px] text-secondary-400">
                    {(row.margin ?? 0).toFixed(1)}% margin
                  </p>
                </div>
              ),
            },
            {
              title: "Discount given",
              key: "discountGiven",
              width: 130,
              render: (_: unknown, row: any) =>
                row.discountGiven > 0 ? (
                  // The figure that explains a high seller with a thin margin.
                  <span className="text-secondary-700">
                    <Money value={row.discountGiven} />
                  </span>
                ) : (
                  <span className="text-secondary-400">—</span>
                ),
            },
            {
              title: "Average sale",
              key: "averageSale",
              width: 130,
              render: (_: unknown, row: any) => <Money value={row.averageSale} />,
            },
            {
              title: "Uncollected",
              key: "outstanding",
              width: 130,
              render: (_: unknown, row: any) =>
                row.outstanding > 0 ? (
                  <Tag className="!m-0 !border-[#f43f5e55] !bg-[#fff1f2] !text-[11px] !text-danger">
                    <Money value={row.outstanding} />
                  </Tag>
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
