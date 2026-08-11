import { Button, Input, Space, Tabs, Tooltip } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  Clock,
  Hash,
  Pencil,
  Plus,
  Scale,
  Search,
} from "lucide-react";
import React, { useState } from "react";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import PermissionGate from "../../components/Common/PermissionGate";
import TransactionModal from "../../components/modal/transaction/TransactionModal";
import CustomDatePicker from "../../components/shared/CustomDatePicker";
import DateTimeStacked from "../../components/shared/DateTimeStacked";
import { Money } from "../../components/shared/Money";
import DataTable from "../../components/Table/DataTable";
import {
  useGetTransactionsQuery,
  useGetTransactionStatsQuery,
  useLazyGetTransactionsQuery,
} from "../../redux/features/transaction/transactionApi";
import ExportMenu from "../../components/Common/ExportMenu";
import { makeSheet } from "../../utils/tableExport";

type IconType = React.ComponentType<{ className?: string }>;

const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  icon: IconType;
  accent: string;
}> = ({ label, value, icon: Icon, accent }) => (
  <div className="flex items-center gap-3 rounded-lg border border-secondary-100 bg-white px-4 py-3">
    <span
      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white"
      style={{ backgroundColor: accent }}
    >
      <Icon className="h-5 w-5" />
    </span>
    <div className="min-w-0">
      <p className="text-xs text-secondary-500">{label}</p>
      <p className="truncate text-lg font-bold text-secondary-900">{value}</p>
    </div>
  </div>
);

const TransactionList: React.FC<{ type: "income" | "expense" }> = ({ type }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([
    null,
    null,
  ]);
  const [editRecord, setEditRecord] = useState<any | null>(null);

  const filters = {
    type,
    search: searchText || undefined,
    startDate: dateRange[0] || undefined,
    endDate: dateRange[1] || undefined,
  };

  const { data, isFetching } = useGetTransactionsQuery({
    ...filters,
    page: currentPage,
    limit,
  });
  // Cards come from a dedicated stats endpoint — filtered by date + search.
  const { data: stats } = useGetTransactionStatsQuery(filters);
  const [fetchAllTransactions] = useLazyGetTransactionsQuery();

  const rows = data?.result || [];
  const meta = data?.meta || {};
  const isIncome = type === "income";

  const buildSheet = async () => {
    const all = await fetchAllTransactions({ ...filters, limit: 10000 }).unwrap();
    const period =
      dateRange[0] && dateRange[1]
        ? `${dateRange[0]} to ${dateRange[1]}`
        : undefined;

    return makeSheet({
      title: isIncome ? "Income" : "Expense",
      unit: "entry",
      filters: [period, searchText && `Search: "${searchText}"`],
      headers: ["Date", "Amount", "Reason", "Client", "Added by"],
      rows: all?.result || [],
      // A refund is a contra-entry, so the sign flips — the file has to agree
      // with the ledger on screen or the column will not add up.
      isLow: (t: any) => isIncome === !!t.isRefund,
      cells: (t: any) => {
        const positive = isIncome !== !!t.isRefund;
        return [
          dayjs(t.date || t.createdAt).format("DD MMM YYYY"),
          `${positive ? "+" : "−"} ${Number(t.amount || 0).toLocaleString(
            "en-BD"
          )}${t.isRefund ? " (refund)" : ""}`,
          t.reason || "—",
          t.client?.name || "—",
          t.createdBy?.name || "—",
        ];
      },
    });
  };

  const columns: ColumnsType<any> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 140,
      render: (d: string, r: any) => (
        <DateTimeStacked value={d || r.createdAt} />
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 140,
      render: (a: number, r: any) => {
        // Normal: income = +green, expense = −red. A refund is a contra-entry,
        // so it flips both — a client refund lowers Income (red −), an expense
        // refund lowers Expense (green + credit). ↩ marks it as a refund.
        const refund = !!r.isRefund;
        const positive = isIncome !== refund;
        return (
          <span
            className={`inline-flex items-center gap-1 font-semibold ${
              positive ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {refund ? "↩ " : ""}
            {positive ? "+" : "−"} <Money value={a} />
          </span>
        );
      },
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      render: (r: string) => (
        <span className="line-clamp-2 max-w-[420px] text-sm text-secondary-700">
          {r}
        </span>
      ),
    },
    {
      title: "Client",
      key: "client",
      width: 140,
      render: (_: any, r: any) => (
        <span className="text-sm font-medium text-secondary-800">
          {r.client?.name || "—"}
        </span>
      ),
    },
    {
      title: "Added by",
      key: "createdBy",
      width: 130,
      render: (_: any, r: any) => (
        <span className="text-sm">{r.createdBy?.name || "—"}</span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 90,
      render: (_: any, record: any) => (
        <Space>
          <PermissionGate module="Income & Expense" action="Update">
            <Tooltip title="Edit">
              <Button
                size="small"
                icon={<Pencil className="w-4 h-4" />}
                onClick={() => setEditRecord(record)}
              />
            </Tooltip>
          </PermissionGate>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Stat cards */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label={`Total ${isIncome ? "Income" : "Expense"}`}
          value={<Money value={stats?.totalAmount} />}
          icon={isIncome ? ArrowUpCircle : ArrowDownCircle}
          accent={isIncome ? "#10b981" : "#f43f5e"}
        />
        <StatCard
          label="Entries"
          value={stats?.count ?? 0}
          icon={Hash}
          accent="#6366f1"
        />
        <StatCard
          label="This Month"
          value={<Money value={stats?.monthTotal} />}
          icon={CalendarDays}
          accent="#0ea5e9"
        />
        <StatCard
          label="Today"
          value={<Money value={stats?.todayTotal} />}
          icon={Clock}
          accent="#f59e0b"
        />
        <StatCard
          label={(stats?.net ?? 0) >= 0 ? "Net Profit" : "Net Loss"}
          value={
            <span
              className={
                (stats?.net ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"
              }
            >
              <Money value={Math.abs(stats?.net ?? 0)} />
            </span>
          }
          icon={Scale}
          accent={(stats?.net ?? 0) >= 0 ? "#10b981" : "#f43f5e"}
        />
      </div>

      {/* Search (left) + date filter (right) */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search by reason..."
          prefix={<Search className="h-4 w-4 text-gray-400" />}
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setCurrentPage(1);
          }}
          className="max-w-md"
        />
        <div className="flex items-center gap-2">
          <CustomDatePicker
            onChange={(d) => {
              setDateRange(d);
              setCurrentPage(1);
            }}
          />
          {/* Per tab, not per page — an "Export" on the header could not say
              whether it meant income or expense. */}
          <ExportMenu sheet={buildSheet} disabled={(meta.total || 0) === 0} />
        </div>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        limit={limit}
        setLimit={setLimit}
        total={meta.total || 0}
        isPaginate={meta.totalPage > 1}
        loading={isFetching}
        rowKey="_id"
      />

      {editRecord && (
        <TransactionModal
          open={!!editRecord}
          setOpen={(v) => !v && setEditRecord(null)}
          type={type}
          record={editRecord}
        />
      )}
    </div>
  );
};

const IncomeExpense = () => {
  const [activeTab, setActiveTab] = useState<string>("income");
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div>
      <PageMeta
        title="Income & Expense - POS & Inventory Admin Panel"
        description="Daily income and expense entries"
        keywords="income, expense, accounts, POS & Inventory"
        canonicalUrl={`${window.location.origin}/income-expense`}
        noindex={true}
      />
      <PageHeader
        title="Daily Income & Expense"
        subtitle="Record daily income and expenses"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Income & Expense" },
        ]}
        extra={
          <PermissionGate module="Income & Expense" action="Create">
            <Button
              type="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setAddOpen(true)}
            >
              Add {activeTab === "expense" ? "Expense" : "Income"}
            </Button>
          </PermissionGate>
        }
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "income",
            label: "Income",
            children: <TransactionList type="income" />,
          },
          {
            key: "expense",
            label: "Expense",
            children: <TransactionList type="expense" />,
          },
        ]}
      />

      {addOpen && (
        <TransactionModal
          open={addOpen}
          setOpen={setAddOpen}
          type={activeTab === "expense" ? "expense" : "income"}
        />
      )}
    </div>
  );
};

export default IncomeExpense;
