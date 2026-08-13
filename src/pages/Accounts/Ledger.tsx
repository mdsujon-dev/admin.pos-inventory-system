import { DatePicker, Select, Tag } from "antd";
import dayjs, { Dayjs } from "dayjs";
import {
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  Scale,
} from "lucide-react";
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
import { useGetLedgerQuery } from "../../redux/features/accounts/reportApi";

const { RangePicker } = DatePicker;

/** What each kind of document is called, and the colour it wears. */
const KINDS: Record<string, { label: string; tone: string }> = {
  sale: { label: "Sale", tone: "#10b981" },
  "sale-return": { label: "Sales return", tone: "#f43f5e" },
  purchase: { label: "Purchase", tone: "#3b82f6" },
  "vendor-payment": { label: "Supplier paid", tone: "#8b5cf6" },
  expense: { label: "Expense", tone: "#f59e0b" },
  income: { label: "Other income", tone: "#06b6d4" },
  "write-off": { label: "Written off", tone: "#64748b" },
};

const FILTERS = [
  { value: "all", label: "Everything" },
  ...Object.entries(KINDS).map(([value, row]) => ({
    value,
    label: row.label,
  })),
];

interface LedgerRow {
  id: string;
  date: string;
  kind: string;
  label: string;
  reference: string;
  party: string;
  direction: "in" | "out";
  amount: number;
  onPaper: boolean;
  link?: string;
}

/**
 * Every money movement in the shop, in one list.
 *
 * Assembled from the documents themselves rather than copied into a table of
 * its own — an invoice, a bill, a return and a salary are already recorded
 * somewhere, and a second copy is a second thing to keep in step.
 *
 * "On paper" is the distinction that makes the page honest: a bill on terms
 * and a credit note against an unpaid invoice both belong in the books, and
 * neither of them moved a taka. Only the rest add up to the cash figures.
 */
const Ledger = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf("month"),
    dayjs(),
  ]);
  const [kind, setKind] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const { data, isFetching } = useGetLedgerQuery([
    { name: "from", value: range[0].toISOString() },
    { name: "to", value: range[1].toISOString() },
    ...(kind !== "all" ? [{ name: "kind", value: kind }] : []),
  ]);

  const entries: LedgerRow[] = data?.data?.entries ?? [];
  const totals = data?.data?.totals ?? { count: 0, cashIn: 0, cashOut: 0, net: 0 };

  // Paged in the browser: the list is one period's documents, not a table that
  // grows without bound, and holding it lets the totals stay honest.
  const paged = entries.slice((currentPage - 1) * limit, currentPage * limit);

  /**
   * The whole period, not the page on screen.
   *
   * A file that only holds page one is a file that will be trusted and be
   * wrong, so the export walks every entry the filters matched.
   */
  const buildSheet = () =>
    makeSheet({
      title: "Ledger",
      unit: "entry",
      filters: [
        `${range[0].format("DD MMM YYYY")} to ${range[1].format("DD MMM YYYY")}`,
        kind !== "all" ? `Kind: ${KINDS[kind]?.label ?? kind}` : "",
      ],
      headers: ["Date", "Kind", "Reference", "Who / what", "In", "Out", "Cash"],
      rows: entries,
      // Money leaving is the row a reader scans for, so it is the one the
      // export marks — the same convention the other lists use.
      isLow: (row: LedgerRow) => row.direction === "out",
      cells: (row: LedgerRow) => [
        dayjs(row.date).format("DD MMM YYYY"),
        row.label,
        row.reference || "—",
        row.party,
        row.direction === "in" ? row.amount.toLocaleString("en-BD") : "",
        row.direction === "out" ? row.amount.toLocaleString("en-BD") : "",
        row.onPaper ? "On paper" : "Cash moved",
      ],
      note: `Cash in ${totals.cashIn.toLocaleString(
        "en-BD"
      )} · Cash out ${totals.cashOut.toLocaleString(
        "en-BD"
      )} · Net ${totals.net.toLocaleString("en-BD")}`,
    });

  return (
    <div>
      <PageMeta
        title="Ledger - POS & Inventory"
        description="Every money movement, in one list"
        noindex
      />
      <PageHeader
        title="Ledger"
        subtitle="Everything that moved money, whichever screen it was entered on"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Accounts", path: "/accounts" },
          { title: "Ledger" },
        ]}
        extra={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={kind}
              onChange={(value) => {
                setKind(value);
                setCurrentPage(1);
              }}
              options={FILTERS}
              className="min-w-[170px]"
            />
            <RangePicker
              value={range}
              onChange={(value) => {
                if (value?.[0] && value?.[1]) setRange([value[0], value[1]]);
                setCurrentPage(1);
              }}
              allowClear={false}
            />
            <ExportMenu sheet={buildSheet} disabled={entries.length === 0} />
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={FileText}
          label="Entries"
          accent="#8b5cf6"
          hint="Documents in this period"
          value={totals.count}
          loading={isFetching}
        />
        <MetricCard
          icon={ArrowDownLeft}
          label="Cash in"
          accent="#10b981"
          hint="Money actually received"
          value={<Money value={totals.cashIn} />}
          loading={isFetching}
        />
        <MetricCard
          icon={ArrowUpRight}
          label="Cash out"
          accent="#f43f5e"
          hint="Money actually paid"
          value={<Money value={totals.cashOut} />}
          loading={isFetching}
        />
        <MetricCard
          icon={Scale}
          label="Net movement"
          accent={totals.net < 0 ? "#f59e0b" : "#019532"}
          hint={
            totals.net < 0 ? "More went out than came in" : "More in than out"
          }
          value={<Money value={totals.net} />}
          loading={isFetching}
        />
      </div>

      <DataTable
        data={paged}
        rowKey="id"
        loading={isFetching}
        total={entries.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        limit={limit}
        setLimit={setLimit}
        isPaginate={entries.length > limit}
        // The rows-per-page picker: a ledger is read at 25 and audited at 100.
        isShowSizeChanger
        onRow={(row: LedgerRow) => ({
          onClick: () => row.link && navigate(row.link),
          className: row.link ? "cursor-pointer" : "",
        })}
        emptyText={
          <TableEmpty
            icon={FileText}
            title="Nothing moved in this period"
            hint="Change the dates, or pick a different kind of entry."
          />
        }
        columns={[
          {
            title: "Date",
            key: "date",
            width: 120,
            render: (_: unknown, row: LedgerRow) => (
              <span className="text-[13px] text-secondary-700">
                {dayjs(row.date).format("DD MMM YYYY")}
              </span>
            ),
          },
          {
            title: "Kind",
            key: "kind",
            width: 150,
            render: (_: unknown, row: LedgerRow) => {
              const tone = KINDS[row.kind]?.tone ?? "#64748b";
              return (
                <span
                  className="inline-block rounded px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: `${tone}18`, color: tone }}
                >
                  {row.label}
                </span>
              );
            },
          },
          {
            title: "Reference",
            key: "reference",
            width: 170,
            render: (_: unknown, row: LedgerRow) =>
              row.reference ? (
                <span className="font-mono text-[12px] text-secondary-700">
                  {row.reference}
                </span>
              ) : (
                <span className="text-secondary-400">—</span>
              ),
          },
          {
            title: "Who / what",
            key: "party",
            render: (_: unknown, row: LedgerRow) => (
              <span className="line-clamp-2 text-[13px] text-secondary-700">
                {row.party}
              </span>
            ),
          },
          {
            title: "In",
            key: "in",
            width: 130,
            align: "right" as const,
            render: (_: unknown, row: LedgerRow) =>
              row.direction === "in" ? (
                <span className="font-semibold text-primary-700">
                  <Money value={row.amount} />
                </span>
              ) : (
                <span className="text-secondary-300">—</span>
              ),
          },
          {
            title: "Out",
            key: "out",
            width: 130,
            align: "right" as const,
            render: (_: unknown, row: LedgerRow) =>
              row.direction === "out" ? (
                <span className="font-semibold text-danger">
                  <Money value={row.amount} />
                </span>
              ) : (
                <span className="text-secondary-300">—</span>
              ),
          },
          {
            title: "Cash",
            key: "onPaper",
            width: 110,
            render: (_: unknown, row: LedgerRow) =>
              row.onPaper ? (
                // The row belongs in the books but no money changed hands —
                // a bill on terms, a credit against an unpaid invoice.
                <Tag className="!m-0 !text-[10px]">On paper</Tag>
              ) : (
                <Tag className="!m-0 !border-primary-200 !bg-primary-50 !text-[10px] !text-primary-700">
                  Cash moved
                </Tag>
              ),
          },
        ]}
      />
    </div>
  );
};

export default Ledger;
