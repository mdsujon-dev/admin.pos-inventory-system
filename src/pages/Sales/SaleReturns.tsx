import { DatePicker, Input, Tag } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { Boxes, PackageX, Search, Undo2, Wallet } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import { MetricCard } from "../../components/Common/MetricCard";
import Money from "../../components/shared/Money";
import DataTable from "../../components/Table/DataTable";
import TableEmpty from "../../components/Table/TableEmpty";
import {
  ISaleReturn,
  useGetSaleReturnsQuery,
} from "../../redux/features/sales/saleReturnApi";
import { PAYMENT_METHOD_LABELS } from "../../utils/money";

const { RangePicker } = DatePicker;

/**
 * Everything that came back.
 *
 * Its own screen rather than a filter on the invoice list, because a return is
 * its own document with its own date — the month a sale was made and the month
 * it was reversed are rarely the same one, and only one of them is the answer
 * to "what did we lose to returns".
 */
const SaleReturns = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const { data, isFetching } = useGetSaleReturnsQuery([
    { name: "page", value: currentPage },
    { name: "limit", value: limit },
    ...(searchText ? [{ name: "keyword", value: searchText }] : []),
    ...(range?.[0] ? [{ name: "from", value: range[0].toISOString() }] : []),
    ...(range?.[1] ? [{ name: "to", value: range[1].toISOString() }] : []),
  ]);

  const rows: ISaleReturn[] = data?.data?.data || [];
  const total: number = data?.data?.meta?.total || 0;

  // Off the page, and labelled as such — the honest total for a filtered set
  // needs its own aggregate, and this list is short enough to read.
  const pageValue = rows.reduce((sum, row) => sum + row.grandTotal, 0);
  const pageRefunded = rows.reduce((sum, row) => sum + row.refundAmount, 0);
  const pageUnits = rows.reduce(
    (sum, row) => sum + row.items.reduce((n, i) => n + i.quantity, 0),
    0
  );
  const scrapped = rows.reduce(
    (sum, row) =>
      sum +
      row.items.filter((i) => !i.restock).reduce((n, i) => n + i.quantity, 0),
    0
  );

  return (
    <div>
      <PageMeta
        title="Sales Returns - POS & Inventory"
        description="Goods sent back, and what was refunded"
        noindex
      />
      <PageHeader
        title="Sales Returns"
        subtitle="What came back, what it was worth, and where it went"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Sales" },
          { title: "Returns" },
        ]}
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Undo2}
          label="Returns"
          accent="#8b5cf6"
          hint={`${pageUnits} unit${pageUnits === 1 ? "" : "s"} on this page`}
          value={total}
          loading={isFetching}
        />
        <MetricCard
          icon={Boxes}
          label="Value on this page"
          accent="#f59e0b"
          hint="Credited or refunded"
          value={<Money value={pageValue} />}
          loading={isFetching}
        />
        <MetricCard
          icon={Wallet}
          label="Cash handed back"
          accent="#f43f5e"
          hint="The rest came off unpaid balances"
          value={<Money value={pageRefunded} />}
          loading={isFetching}
        />
        <MetricCard
          icon={PackageX}
          label="Not resellable"
          accent="#64748b"
          hint="Refunded but never went back on the shelf"
          value={scrapped}
          loading={isFetching}
        />
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <Input
          placeholder="Return no, invoice no or customer..."
          prefix={<Search className="h-4 w-4 text-secondary-400" />}
          value={searchText}
          onChange={(event) => {
            setSearchText(event.target.value);
            setCurrentPage(1);
          }}
          allowClear
          className="max-w-md"
        />
        <RangePicker
          value={range as never}
          onChange={(value) => {
            setRange(value as never);
            setCurrentPage(1);
          }}
        />
      </div>

      <DataTable
        data={rows}
        rowKey="_id"
        loading={isFetching}
        total={total}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        limit={limit}
        setLimit={setLimit}
        isPaginate={total > limit}
        onRow={(row: ISaleReturn) => ({
          onClick: () => navigate(`/sales/invoices/${row.sale}`),
          className: "cursor-pointer",
        })}
        emptyText={
          <TableEmpty
            icon={Undo2}
            accent="#8b5cf6"
            title="Nothing has come back"
            hint={
              searchText || range
                ? "No return matches those filters."
                : "Returns are taken from an invoice — open one and use “Take a return”."
            }
          />
        }
        columns={[
          {
            title: "Return",
            key: "returnNo",
            width: 170,
            render: (_: unknown, row: ISaleReturn) => (
              <div>
                <p className="m-0 font-mono text-[13px] font-semibold text-secondary-800">
                  {row.returnNo}
                </p>
                <span className="text-[11px] text-secondary-400">
                  {dayjs(row.returnedAt).format("DD MMM YYYY")}
                </span>
              </div>
            ),
          },
          {
            title: "Against",
            key: "invoiceNo",
            width: 160,
            render: (_: unknown, row: ISaleReturn) => (
              <div>
                <p className="m-0 font-mono text-[12px] text-secondary-700">
                  {row.invoiceNo}
                </p>
                <span className="text-[11px] text-secondary-400">
                  {row.customerName || "Walk-in"}
                </span>
              </div>
            ),
          },
          {
            title: "Items",
            key: "items",
            render: (_: unknown, row: ISaleReturn) => (
              <div className="min-w-0">
                <span className="text-[13px] text-secondary-700">
                  {row.items
                    .slice(0, 2)
                    .map(
                      (item) =>
                        `${item.quantity} × ${item.name}${
                          item.variantName ? ` (${item.variantName})` : ""
                        }`
                    )
                    .join(", ")}
                  {row.items.length > 2 ? ` +${row.items.length - 2} more` : ""}
                </span>
                {row.items.some((item) => !item.restock) && (
                  <Tag className="!ml-1 !m-0 !text-[10px]">Some scrapped</Tag>
                )}
              </div>
            ),
          },
          {
            title: "Settled",
            key: "mode",
            width: 170,
            render: (_: unknown, row: ISaleReturn) =>
              row.refundAmount > 0 ? (
                <span className="text-[12px] text-secondary-600">
                  <Money value={row.refundAmount} /> back in{" "}
                  {PAYMENT_METHOD_LABELS[row.refundMethod ?? "cash"]}
                </span>
              ) : (
                <Tag className="!m-0 !border-primary-200 !bg-primary-50 !text-[11px] !text-primary-700">
                  Off their balance
                </Tag>
              ),
          },
          {
            title: "Value",
            key: "grandTotal",
            width: 130,
            align: "right" as const,
            render: (_: unknown, row: ISaleReturn) => (
              <span className="font-semibold text-secondary-800">
                <Money value={row.grandTotal} />
              </span>
            ),
          },
        ]}
      />
    </div>
  );
};

export default SaleReturns;
