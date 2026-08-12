import { Button, DatePicker, Input, Select, Tag, Tooltip } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import { Eye, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import PermissionGate from "../../components/Common/PermissionGate";
import Money from "../../components/shared/Money";
import DataTable from "../../components/Table/DataTable";
import {
  IPurchase,
  useGetPurchasesQuery,
} from "../../redux/features/purchasing/purchaseApi";
import { PAYMENT_METHOD_LABELS } from "../../utils/money";

const { RangePicker } = DatePicker;

/** Every supplier bill, and what is still owed on it. */
const Purchases = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [status, setStatus] = useState<string | undefined>();
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const { data, isFetching } = useGetPurchasesQuery([
    { name: "page", value: currentPage },
    { name: "limit", value: limit },
    ...(searchText ? [{ name: "keyword", value: searchText }] : []),
    ...(status ? [{ name: "status", value: status }] : []),
    ...(range?.[0] ? [{ name: "from", value: range[0].toISOString() }] : []),
    ...(range?.[1] ? [{ name: "to", value: range[1].toISOString() }] : []),
  ]);

  const purchases: IPurchase[] = data?.data?.data || [];
  const total: number = data?.data?.meta?.total || 0;

  const columns: ColumnsType<IPurchase> = [
    {
      title: "Bill",
      key: "purchaseNo",
      width: 180,
      render: (_, record) => (
        <div>
          <p className="m-0 font-mono text-sm font-semibold text-secondary-800">
            {record.purchaseNo}
          </p>
          <span className="text-xs text-secondary-400">
            {dayjs(record.purchaseDate).format("DD MMM YYYY")}
            {record.billNo ? ` · ${record.billNo}` : ""}
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
        <Tag
          className={`!m-0 ${
            record.status === "paid"
              ? "!border-primary-200 !bg-primary-50 !text-primary-700"
              : "!border-danger/30 !bg-danger/10 !text-danger"
          }`}
        >
          {record.status === "paid"
            ? "Settled"
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
      width: 80,
      render: (_, record) => (
        <Tooltip title="Open bill">
          <Button
            icon={<Eye className="h-4 w-4" />}
            onClick={() => navigate(`/purchases/${record._id}`)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div>
      <PageMeta
        title="Purchase Bills - POS & Inventory"
        description="Supplier bills and what is owed on them"
        noindex
      />
      <PageHeader
        title="Purchase Bills"
        subtitle="Where every unit of stock came from"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Purchasing" },
          { title: "Purchase Bills" },
        ]}
        extra={
          <PermissionGate module="Purchases" action="Create">
            <Button
              type="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => navigate("/purchases/new")}
              className="!border-0 !bg-gradient-to-r !from-primary-600 !to-primary-500 shadow-primary"
            >
              New Purchase
            </Button>
          </PermissionGate>
        }
      />

      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <Input
          placeholder="Bill no, vendor or item..."
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
          className="min-w-[150px]"
          options={[
            { label: "Settled", value: "paid" },
            { label: "Partial", value: "partial" },
            { label: "Unpaid", value: "due" },
          ]}
        />
      </div>

      <DataTable
        data={purchases}
        columns={columns}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        limit={limit}
        setLimit={setLimit}
        total={total}
        isPaginate={total > limit}
        loading={isFetching}
        rowKey="_id"
      />
    </div>
  );
};

export default Purchases;
