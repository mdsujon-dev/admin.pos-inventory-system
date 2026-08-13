import { Button, DatePicker, Input, Select, Space, Tag, Tooltip } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import { Eye, Printer, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import Money from "../../components/shared/Money";
import DataTable from "../../components/Table/DataTable";
import { MetricCard } from "../../components/Common/MetricCard";
import {
  ISale,
  useGetSalesQuery,
  useGetSalesSummaryQuery,
} from "../../redux/features/sales/saleApi";
import { PAYMENT_METHOD_LABELS } from "../../utils/money";
import { Receipt, TrendingUp, Wallet, Percent } from "lucide-react";

const { RangePicker } = DatePicker;

const STATUS_STYLE: Record<string, string> = {
  paid: "!border-primary-200 !bg-primary-50 !text-primary-700",
  partial: "!border-danger/30 !bg-danger/10 !text-danger",
  due: "!border-danger/30 !bg-danger/10 !text-danger",
};

/** Every invoice, filterable, with the period's totals across the top. */
const SalesList = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [status, setStatus] = useState<string | undefined>();
  const [method, setMethod] = useState<string | undefined>();
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const filters = [
    ...(searchText ? [{ name: "keyword", value: searchText }] : []),
    ...(status ? [{ name: "status", value: status }] : []),
    ...(method ? [{ name: "paymentMethod", value: method }] : []),
    ...(range?.[0] ? [{ name: "from", value: range[0].toISOString() }] : []),
    ...(range?.[1] ? [{ name: "to", value: range[1].toISOString() }] : []),
  ];

  const { data, isFetching } = useGetSalesQuery([
    { name: "page", value: currentPage },
    { name: "limit", value: limit },
    ...filters,
  ]);

  // The same filters, so the tiles describe the rows on screen rather than
  // the whole ledger — a summary that ignores the date picker is a lie.
  const { data: summaryData } = useGetSalesSummaryQuery(
    filters.filter((row) => row.name === "from" || row.name === "to")
  );

  const sales: ISale[] = data?.data?.data || [];
  const total: number = data?.data?.meta?.total || 0;
  const summary = summaryData?.data;

  const columns: ColumnsType<ISale> = [
    {
      title: "Invoice",
      key: "invoiceNo",
      width: 170,
      render: (_, record) => (
        <div>
          <p className="m-0 font-mono text-sm font-semibold text-secondary-800">
            {record.invoiceNo}
          </p>
          <span className="text-xs text-secondary-400">
            {dayjs(record.saleDate).format("DD MMM YYYY, h:mm A")}
          </span>
        </div>
      ),
    },
    {
      title: "Customer",
      key: "customer",
      width: 180,
      render: (_, record) => (
        <div className="min-w-0">
          <p className="m-0 truncate text-secondary-800">
            {record.customerName || "Walk-in customer"}
          </p>
          {record.customerPhone && (
            <span className="font-mono text-xs text-secondary-400">
              {record.customerPhone}
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Items",
      key: "items",
      width: 80,
      render: (_, record) =>
        record.items.reduce((sum, item) => sum + item.quantity, 0),
    },
    {
      title: "Total",
      key: "grandTotal",
      width: 120,
      render: (_, record) => (
        <span className="font-semibold text-secondary-800">
          <Money value={record.grandTotal} />
        </span>
      ),
    },
    {
      title: "Paid / Due",
      key: "paid",
      width: 150,
      render: (_, record) => (
        <div>
          <p className="m-0 text-secondary-700">
            <Money value={record.paid} />
          </p>
          {record.due > 0 && (
            <span className="text-xs font-medium text-danger">
              <Money value={record.due} /> owing
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Method",
      key: "paymentMethod",
      width: 100,
      render: (_, record) =>
        PAYMENT_METHOD_LABELS[record.paymentMethod] ?? record.paymentMethod,
    },
    {
      title: "Status",
      key: "status",
      width: 110,
      render: (_, record) => (
        <Tag className={`!m-0 ${STATUS_STYLE[record.status] ?? ""}`}>
          {record.status === "paid"
            ? "Paid"
            : record.status === "partial"
            ? "Partial"
            : "Unpaid"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 110,
      render: (_, record) => (
        <Space>
          <Tooltip title="View invoice">
            <Button
              icon={<Eye className="h-4 w-4" />}
              onClick={() => navigate(`/sales/invoices/${record._id}`)}
            />
          </Tooltip>
          <Tooltip title="Print">
            <Button
              icon={<Printer className="h-4 w-4" />}
              onClick={() =>
                navigate(`/sales/invoices/${record._id}?print=1`)
              }
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageMeta
        title="Invoices - POS & Inventory"
        description="Every sale, filterable by date, status and payment method"
        noindex
      />
      <PageHeader
        title="Invoices"
        subtitle="Every sale the till has rung up"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Sales" },
          { title: "Invoices" },
        ]}
      />

      {summary && (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={Receipt}
            label="Invoices"
            accent="#64748b"
            value={summary.saleCount}
            loading={isFetching}
          />
          <MetricCard
            icon={Wallet}
            label="Revenue"
            accent="#10b981"
            value={<Money value={summary.revenue} />}
            loading={isFetching}
          />
          <MetricCard
            icon={TrendingUp}
            label="Profit"
            accent={summary.profit < 0 ? "#ef4444" : "#10b981"}
            value={<Money value={summary.profit} />}
            loading={isFetching}
          />
          <MetricCard
            icon={Percent}
            label="Outstanding"
            accent={summary.outstanding > 0 ? "#ef4444" : "#64748b"}
            hint={summary.outstanding > 0 ? "Still to collect" : undefined}
            value={<Money value={summary.outstanding} />}
            loading={isFetching}
          />
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <Input
          placeholder="Invoice no, customer, phone or item..."
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
        <Select
          placeholder="Status"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setCurrentPage(1);
          }}
          allowClear
          className="min-w-[140px]"
          options={[
            { label: "Paid", value: "paid" },
            { label: "Partial", value: "partial" },
            { label: "Unpaid", value: "due" },
          ]}
        />
        <Select
          placeholder="Method"
          value={method}
          onChange={(value) => {
            setMethod(value);
            setCurrentPage(1);
          }}
          allowClear
          className="min-w-[140px]"
          options={Object.entries(PAYMENT_METHOD_LABELS).map(
            ([value, label]) => ({ value, label })
          )}
        />
      </div>

      <DataTable
        data={sales}
        columns={columns}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        limit={limit}
        setLimit={setLimit}
        total={total}
        isPaginate={total > limit}
        loading={isFetching}
        rowKey="_id"
        emptyText={
          searchText || status || method || range
            ? "No invoices match those filters"
            : "Nothing sold yet. Invoices appear here as the till rings them up."
        }
      />
    </div>
  );
};

export default SalesList;
