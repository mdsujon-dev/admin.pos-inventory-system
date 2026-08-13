import { Button, Input, Space, Tabs, Tooltip } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowLeftRight,
  ArrowUpCircle,
  CalendarDays,
  Clock,
  Hash,
  Pencil,
  Plus,
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
import { MetricCard } from "../../components/Common/MetricCard";
import TableEmpty from "../../components/Table/TableEmpty";
import { Link } from "react-router-dom";
import { Select, Tag } from "antd";
import {
  IExpenseCategory,
  useGetExpenseCategoriesQuery,
} from "../../redux/features/accounts/reportApi";
import DataTable from "../../components/Table/DataTable";
import {
  useGetTransactionsQuery,
  useGetTransactionStatsQuery,
  useLazyGetTransactionsQuery,
  useUpdateTransactionMutation,
} from "../../redux/features/transaction/transactionApi";
import { toast } from "react-toastify";
import ExportMenu from "../../components/Common/ExportMenu";
import { PAYMENT_METHOD_LABELS } from "../../utils/money";
import { makeSheet } from "../../utils/tableExport";

const TransactionList: React.FC<{ type: "income" | "expense" }> = ({ type }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([
    null,
    null,
  ]);
  const [editRecord, setEditRecord] = useState<any | null>(null);
  /** Narrows the list to the entries that still have no heading. */
  const [onlyLoose, setOnlyLoose] = useState(false);

  const { data: categoryData } = useGetExpenseCategoriesQuery(undefined);
  const categories: IExpenseCategory[] = categoryData?.data ?? [];
  const [patchEntry] = useUpdateTransactionMutation();

  /**
   * Set one field on one row, from the row.
   *
   * Fixing a missing heading through the edit modal means opening it, finding
   * the field, saving, and repeating — for a clean-up of thirty rows that is
   * the reason the clean-up never happens.
   */
  const fixField = async (id: string, patch: Record<string, unknown>) => {
    try {
      await patchEntry({ id, data: patch }).unwrap();
      toast.success("Entry updated");
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not update that entry");
    }
  };

  const filters = {
    type,
    search: searchText || undefined,
    startDate: dateRange[0] || undefined,
    endDate: dateRange[1] || undefined,
    uncategorised: onlyLoose || undefined,
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
      headers: ["Date", "Amount", "Heading", "Method", "Reason", "Added by"],
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
          t.category?.name || "Uncategorised",
          t.method ? PAYMENT_METHOD_LABELS[t.method] ?? t.method : "Not recorded",
          t.reason || "—",
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
              positive ? "text-primary-600" : "text-primary-600"
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
      render: (r: string, row: any) => (
        <div className="min-w-0 max-w-[420px]">
          <span className="line-clamp-2 text-sm text-secondary-700">{r}</span>
          {/* A pass-through never touched stock, so both sides of the deal are
              shown — a margin on its own cannot be checked against anything. */}
          {row.kind === "passthrough" && (
            <span className="mt-0.5 block text-[11px] text-secondary-400">
              Pass-through: sold <Money value={row.dealValue} /> · cost{" "}
              <Money value={row.dealCost} />
              {row.party ? ` · ${row.party}` : ""}
            </span>
          )}
          {row.reference && (
            <span className="mt-0.5 block font-mono text-[11px] text-secondary-400">
              {row.reference}
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Heading",
      key: "category",
      width: 170,
      render: (_: any, r: any) =>
        r.category?.name ? (
          <Tag className="!m-0 !border-primary-200 !bg-primary-50 !text-[11px] !text-primary-700">
            {r.category.name}
          </Tag>
        ) : (
          <Select
            size="small"
            showSearch
            optionFilterProp="label"
            placeholder="Set heading"
            className="w-full"
            status="warning"
            options={categories.map((row) => ({
              label: row.name,
              value: row._id,
            }))}
            onChange={(value) => fixField(r._id, { category: value })}
          />
        ),
    },
    {
      title: "Method",
      key: "method",
      width: 140,
      render: (_: any, r: any) =>
        r.method ? (
          <span className="text-sm text-secondary-700">
            {PAYMENT_METHOD_LABELS[r.method] ?? r.method}
          </span>
        ) : (
          <Select
            size="small"
            placeholder="Set method"
            className="w-full"
            status="warning"
            options={Object.entries(PAYMENT_METHOD_LABELS).map(
              ([value, label]) => ({ value, label })
            )}
            onChange={(value) => fixField(r._id, { method: value })}
          />
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
      {/* What this ledger holds. Deliberately not called profit: the shop's
          profit lives in Accounts, where sales and cost of goods are counted
          too. A card here that said "Net Loss" was answering a different
          question from the one it appeared to answer. */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label={`Total ${isIncome ? "income" : "expense"}`}
          value={<Money value={stats?.totalAmount} />}
          hint={`${stats?.count ?? 0} ${
            (stats?.count ?? 0) === 1 ? "entry" : "entries"
          } in this view`}
          icon={isIncome ? ArrowUpCircle : ArrowDownCircle}
          accent={isIncome ? "#10b981" : "#f43f5e"}
        />
        <MetricCard
          label="This month"
          value={<Money value={stats?.monthTotal} />}
          hint={dayjs().format("MMMM YYYY")}
          icon={CalendarDays}
          accent="#3b82f6"
        />
        <MetricCard
          label="Today"
          value={<Money value={stats?.todayTotal} />}
          hint={dayjs().format("DD MMM YYYY")}
          icon={Clock}
          accent="#8b5cf6"
        />
        <MetricCard
          label="Ledger balance"
          value={
            <span
              className={
                (stats?.net ?? 0) >= 0 ? "text-primary-600" : "text-danger"
              }
            >
              <Money value={Math.abs(stats?.net ?? 0)} />
            </span>
          }
          hint={
            (stats?.net ?? 0) >= 0
              ? "Hand-entered income above expense"
              : "Hand-entered expense above income"
          }
          icon={Hash}
          accent={(stats?.net ?? 0) >= 0 ? "#019532" : "#f59e0b"}
        />
      </div>

      {/* Where these entries actually land, said once instead of guessed at. */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-[12px] text-primary-800">
        <ArrowLeftRight className="h-4 w-4 shrink-0" />
        <span>
          {isIncome
            ? "Every income entry is added to net profit as other income, on top of what the till took."
            : "Every expense entry is subtracted from gross profit as a running cost, under its heading."}
        </span>
        <Link
          to="/accounts/profit-loss"
          className="font-semibold underline underline-offset-2"
        >
          See it in the profit &amp; loss
        </Link>
      </div>

      {/* Money that left with no heading cannot be reported on. Said plainly,
          with a count, rather than left to be discovered in a report. */}
      {!isIncome && (stats?.uncategorisedCount ?? 0) > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-[#f59e0b55] bg-[#fffbeb] px-3 py-2 text-[12px] text-[#92400e]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {stats?.uncategorisedCount} entr
            {stats?.uncategorisedCount === 1 ? "y" : "ies"} worth{" "}
            <strong>
              <Money value={stats?.uncategorisedAmount} />
            </strong>{" "}
            have no heading, so they report as "Uncategorised". Pick one from the
            Heading column and it is fixed on the spot.
          </span>
          <button
            type="button"
            onClick={() => {
              setOnlyLoose((value) => !value);
              setCurrentPage(1);
            }}
            className="rounded border border-[#f59e0b88] bg-white px-2 py-0.5 font-semibold text-[#92400e] hover:bg-[#fff7e6]"
          >
            {onlyLoose ? "Show all entries" : "Show only these"}
          </button>
        </div>
      )}

      {/* Search (left) + date filter (right) */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search by reason..."
          prefix={<Search className="h-4 w-4 text-secondary-400" />}
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
        emptyText={
          <TableEmpty
            icon={isIncome ? ArrowUpCircle : ArrowDownCircle}
            accent={isIncome ? "#10b981" : "#f43f5e"}
            title={`No ${isIncome ? "income" : "expense"} entries`}
            hint={
              searchText || dateRange[0]
                ? "Nothing matches those filters."
                : "Anything recorded here is carried straight into the profit and loss."
            }
          />
        }
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
