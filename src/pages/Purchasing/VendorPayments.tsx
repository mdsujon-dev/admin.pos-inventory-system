import { Button, DatePicker, Input, Select, Tag, Tooltip } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import { Search, Wallet } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import Money from "../../components/shared/Money";
import DataTable from "../../components/Table/DataTable";
import {
  IVendor,
  useGetVendorsQuery,
} from "../../redux/features/purchasing/vendorApi";
import {
  IVendorPayment,
  useGetVendorPaymentsQuery,
} from "../../redux/features/purchasing/vendorPaymentApi";
import { PAYMENT_METHOD_LABELS } from "../../utils/money";
import { StatTile } from "../Inventory/Products/ProductFormUI";

const { RangePicker } = DatePicker;

/**
 * Every taka handed to a supplier, as its own dated document.
 *
 * Separate from the bills because paying is separate from buying: a January
 * bill settled in March is March's money, and a screen that reads it off the
 * bill would file it in the wrong month.
 */
const VendorPayments = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [vendor, setVendor] = useState<string | undefined>();
  const [method, setMethod] = useState<string | undefined>();
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const { data: vendorData } = useGetVendorsQuery([
    { name: "limit", value: 500 },
  ]);
  const vendors: IVendor[] = vendorData?.data?.data || [];

  const { data, isFetching } = useGetVendorPaymentsQuery([
    { name: "page", value: currentPage },
    { name: "limit", value: limit },
    ...(searchText ? [{ name: "keyword", value: searchText }] : []),
    ...(vendor ? [{ name: "vendor", value: vendor }] : []),
    ...(method ? [{ name: "method", value: method }] : []),
    ...(range?.[0] ? [{ name: "from", value: range[0].toISOString() }] : []),
    ...(range?.[1] ? [{ name: "to", value: range[1].toISOString() }] : []),
  ]);

  const payments: IVendorPayment[] = data?.data?.data || [];
  const total: number = data?.data?.meta?.total || 0;
  const pageTotal = payments.reduce((sum, row) => sum + row.amount, 0);

  const columns: ColumnsType<IVendorPayment> = [
    {
      title: "Payment",
      key: "paymentNo",
      width: 170,
      render: (_, record) => (
        <div>
          <p className="m-0 font-mono text-sm font-semibold text-secondary-800">
            {record.paymentNo}
          </p>
          <span className="text-xs text-secondary-400">
            {dayjs(record.paidAt).format("DD MMM YYYY")}
          </span>
        </div>
      ),
    },
    {
      title: "Vendor",
      key: "vendor",
      width: 200,
      render: (_, record) => (
        <span className="text-secondary-800">{record.vendorName}</span>
      ),
    },
    {
      title: "Settled",
      key: "allocations",
      width: 220,
      render: (_, record) =>
        record.allocations?.length ? (
          <div className="flex flex-wrap items-center gap-1">
            {record.allocations.slice(0, 2).map((row) => (
              <Tag key={row.purchaseNo} className="!m-0 !text-[11px]">
                {row.purchaseNo}
              </Tag>
            ))}
            {record.allocations.length > 2 && (
              <Tooltip
                title={record.allocations
                  .slice(2)
                  .map((row) => row.purchaseNo)
                  .join(", ")}
              >
                <Tag className="!m-0 !text-[11px]">
                  +{record.allocations.length - 2}
                </Tag>
              </Tooltip>
            )}
            {record.unallocated > 0 && (
              <Tag className="!m-0 !border-primary-200 !bg-primary-50 !text-[11px] !text-primary-700">
                <Money value={record.unallocated} /> credit
              </Tag>
            )}
          </div>
        ) : (
          <Tag className="!m-0 !border-primary-200 !bg-primary-50 !text-[11px] !text-primary-700">
            Advance
          </Tag>
        ),
    },
    {
      title: "Method",
      key: "method",
      width: 110,
      render: (_, record) => PAYMENT_METHOD_LABELS[record.method] ?? record.method,
    },
    {
      title: "Reference",
      key: "reference",
      width: 150,
      render: (_, record) =>
        record.reference || <span className="text-secondary-400">—</span>,
    },
    {
      title: "Amount",
      key: "amount",
      width: 130,
      render: (_, record) => (
        <span className="font-semibold text-secondary-800">
          <Money value={record.amount} />
        </span>
      ),
    },
    {
      title: "",
      key: "actions",
      fixed: "right",
      width: 90,
      render: (_, record) => (
        <Button
          size="small"
          onClick={() =>
            navigate(
              `/vendors/${
                typeof record.vendor === "string"
                  ? record.vendor
                  : record.vendor._id
              }`
            )
          }
        >
          Vendor
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageMeta
        title="Vendor Payments - POS & Inventory"
        description="Every payment handed to a supplier"
        noindex
      />
      <PageHeader
        title="Vendor Payments"
        subtitle="Every taka handed to a supplier, and what it settled"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Purchasing" },
          { title: "Vendor Payments" },
        ]}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile icon={Wallet} label="Payments" tone="muted">
          {total}
        </StatTile>
        <StatTile icon={Wallet} label="On this page" tone="brand">
          <Money value={pageTotal} />
        </StatTile>
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <Input
          placeholder="Payment no, vendor or reference..."
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
          placeholder="Vendor"
          value={vendor}
          onChange={(value) => {
            setVendor(value);
            setCurrentPage(1);
          }}
          allowClear
          showSearch
          optionFilterProp="label"
          className="min-w-[200px]"
          options={vendors.map((row) => ({ label: row.name, value: row._id }))}
        />
        <RangePicker
          value={range as never}
          onChange={(value) => {
            setRange(value as never);
            setCurrentPage(1);
          }}
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
        data={payments}
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
          searchText || vendor || method || range
            ? "No payments match those filters"
            : "Nothing paid yet. Payments are recorded from a vendor's profile or against a bill."
        }
      />
    </div>
  );
};

export default VendorPayments;
