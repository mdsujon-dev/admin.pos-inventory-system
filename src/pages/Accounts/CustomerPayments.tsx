import { DatePicker, Input, Select, Tag } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { ArrowDownLeft, Receipt, Search, Store, Wallet } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import { MetricCard } from "../../components/Common/MetricCard";
import Money from "../../components/shared/Money";
import DataTable from "../../components/Table/DataTable";
import TableEmpty from "../../components/Table/TableEmpty";
import ExportMenu from "../../components/Common/ExportMenu";
import { makeSheet } from "../../utils/tableExport";
import {
  ICustomerPayment,
  useGetCustomerPaymentsQuery,
  useLazyGetCustomerPaymentsQuery,
} from "../../redux/features/sales/customerPaymentApi";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from "../../utils/money";

const { RangePicker } = DatePicker;

/**
 * Every taka a customer handed over, dated to the day it arrived.
 *
 * The screen the cash reports are actually built from. An invoice says what
 * was sold and when; these say what was paid and when — and on a shop that
 * sells on credit those are different months often enough that one list
 * cannot answer both questions.
 *
 * Money taken at the till and money collected against an old debt both appear
 * here, told apart by a tag rather than split into two screens: they are the
 * same event to the drawer, and only the story behind them differs.
 */
const CustomerPayments = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [method, setMethod] = useState("all");
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const filters = [
    ...(searchText ? [{ name: "keyword", value: searchText }] : []),
    ...(method !== "all" ? [{ name: "method", value: method }] : []),
    ...(range?.[0] ? [{ name: "from", value: range[0].toISOString() }] : []),
    ...(range?.[1] ? [{ name: "to", value: range[1].toISOString() }] : []),
  ];

  const { data, isFetching } = useGetCustomerPaymentsQuery([
    { name: "page", value: currentPage },
    { name: "limit", value: limit },
    ...filters,
  ]);

  const rows: ICustomerPayment[] = data?.data?.data || [];
  const total: number = data?.data?.meta?.total || 0;

  const [fetchAll] = useLazyGetCustomerPaymentsQuery();

  const buildSheet = async () => {
    const all = await fetchAll([{ name: "limit", value: 5000 }, ...filters]).unwrap();

    return makeSheet({
      title: "Customer Payments",
      unit: "receipt",
      filters: [
        method !== "all" ? `Method: ${PAYMENT_METHOD_LABELS[method]}` : "",
        range?.[0] && range?.[1]
          ? `${range[0].format("DD MMM YYYY")} to ${range[1].format(
              "DD MMM YYYY"
            )}`
          : "",
        searchText ? `Search: "${searchText}"` : "",
      ],
      headers: ["Receipt", "Received", "Customer", "Method", "Against", "Amount"],
      rows: (all?.data?.data ?? []) as ICustomerPayment[],
      cells: (row: ICustomerPayment) => [
        row.receiptNo,
        dayjs(row.receivedAt).format("DD MMM YYYY"),
        row.customerName,
        PAYMENT_METHOD_LABELS[row.method] ?? row.method,
        row.allocations?.map((entry) => entry.invoiceNo).join(", ") ||
          "On account",
        row.amount.toLocaleString("en-BD"),
      ],
    });
  };

  const pageTotal = rows.reduce((sum, row) => sum + row.amount, 0);
  const atTill = rows
    .filter((row) => row.atTill)
    .reduce((sum, row) => sum + row.amount, 0);

  return (
    <div>
      <PageMeta
        title="Customer Payments - POS & Inventory"
        description="Money received from customers, dated to the day it arrived"
        noindex
      />
      <PageHeader
        title="Customer Payments"
        subtitle="Every taka received, on the day it was received"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Accounts", path: "/accounts" },
          { title: "Customer Payments" },
        ]}
        extra={<ExportMenu sheet={buildSheet} disabled={total === 0} />}
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Receipt}
          label="Receipts"
          accent="#8b5cf6"
          hint="Payments in this period"
          value={total}
          loading={isFetching}
        />
        <MetricCard
          icon={ArrowDownLeft}
          label="Taken on this page"
          accent="#10b981"
          hint="Cash, wallet and bank together"
          value={<Money value={pageTotal} />}
          loading={isFetching}
        />
        <MetricCard
          icon={Store}
          label="Paid at the till"
          accent="#3b82f6"
          hint="Settled as the sale was rung up"
          value={<Money value={atTill} />}
          loading={isFetching}
        />
        <MetricCard
          icon={Wallet}
          label="Collected later"
          accent="#f59e0b"
          hint="Debts paid off after the sale"
          value={<Money value={pageTotal - atTill} />}
          loading={isFetching}
        />
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <Input
          placeholder="Receipt no, customer or reference..."
          prefix={<Search className="h-4 w-4 text-secondary-400" />}
          value={searchText}
          onChange={(event) => {
            setSearchText(event.target.value);
            setCurrentPage(1);
          }}
          allowClear
          className="max-w-md"
        />
        <Select
          value={method}
          onChange={(value) => {
            setMethod(value);
            setCurrentPage(1);
          }}
          className="min-w-[150px]"
          options={[
            { value: "all", label: "All methods" },
            ...PAYMENT_METHODS.map((value) => ({
              value,
              label: PAYMENT_METHOD_LABELS[value],
            })),
          ]}
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
        isShowSizeChanger
        emptyText={
          <TableEmpty
            icon={Receipt}
            accent="#10b981"
            title="No payments recorded"
            hint={
              searchText || method !== "all" || range
                ? "No receipt matches those filters."
                : "Every sale rung up at the till writes one of these, and so does every debt collected afterwards."
            }
          />
        }
        columns={[
          {
            title: "Receipt",
            key: "receiptNo",
            width: 180,
            render: (_: unknown, row: ICustomerPayment) => (
              <div>
                <p className="m-0 font-mono text-[13px] font-semibold text-secondary-800">
                  {row.receiptNo}
                </p>
                <span className="text-[11px] text-secondary-400">
                  {dayjs(row.receivedAt).format("DD MMM YYYY")}
                </span>
              </div>
            ),
          },
          {
            title: "Customer",
            key: "customerName",
            render: (_: unknown, row: ICustomerPayment) => (
              <span className="text-[13px] text-secondary-700">
                {row.customerName || "Walk-in customer"}
              </span>
            ),
          },
          {
            title: "How",
            key: "method",
            width: 150,
            render: (_: unknown, row: ICustomerPayment) => (
              <div className="min-w-0">
                <span className="text-[12px] text-secondary-700">
                  {PAYMENT_METHOD_LABELS[row.method] ?? row.method}
                </span>
                {row.reference && (
                  <p className="m-0 truncate font-mono text-[11px] text-secondary-400">
                    {row.reference}
                  </p>
                )}
              </div>
            ),
          },
          {
            title: "Against",
            key: "allocations",
            render: (_: unknown, row: ICustomerPayment) =>
              row.allocations?.length ? (
                <div className="flex flex-wrap items-center gap-1">
                  {row.allocations.slice(0, 2).map((entry) => (
                    <button
                      key={entry.invoiceNo}
                      type="button"
                      onClick={() => navigate(`/sales/invoices/${entry.sale}`)}
                      className="rounded border border-secondary-200 px-1.5 py-0.5 font-mono text-[10px] text-secondary-600 hover:border-primary-300 hover:text-primary-700"
                    >
                      {entry.invoiceNo}
                    </button>
                  ))}
                  {row.allocations.length > 2 && (
                    <Tag className="!m-0 !text-[10px]">
                      +{row.allocations.length - 2}
                    </Tag>
                  )}
                </div>
              ) : (
                <Tag className="!m-0 !text-[10px]">On account</Tag>
              ),
          },
          {
            // The distinction the cash reports do not need but a person
            // reading this list does: was this the sale, or the chase?
            title: "When",
            key: "atTill",
            width: 120,
            render: (_: unknown, row: ICustomerPayment) =>
              row.atTill ? (
                <Tag className="!m-0 !text-[10px]">At the till</Tag>
              ) : (
                <Tag className="!m-0 !border-[#f59e0b55] !bg-[#fffbeb] !text-[10px] !text-[#92400e]">
                  Collected later
                </Tag>
              ),
          },
          {
            title: "Amount",
            key: "amount",
            width: 130,
            align: "right" as const,
            render: (_: unknown, row: ICustomerPayment) => (
              <span className="font-semibold text-primary-700">
                <Money value={row.amount} />
              </span>
            ),
          },
        ]}
      />
    </div>
  );
};

export default CustomerPayments;
