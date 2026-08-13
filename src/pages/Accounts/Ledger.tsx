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
  // Cash from a customer, on the day it arrived. Its own kind, because a
  // January invoice collected in March is two events and one of them is March's.
  "customer-payment": { label: "Payment received", tone: "#059669" },
  "sale-return": { label: "Sales return", tone: "#f43f5e" },
  purchase: { label: "Purchase", tone: "#3b82f6" },
  "purchase-return": { label: "Purchase return", tone: "#14b8a6" },
  "vendor-payment": { label: "Supplier paid", tone: "#8b5cf6" },
  // Cash arriving against a credit note written earlier — its own kind, or
  // the day the money turned up would be invisible next to the day the goods
  // went back.
  "vendor-refund": { label: "Refund received", tone: "#10b981" },
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
  /** What the document was worth. */
  amount: number;
  /** How much of it actually changed hands. */
  cashAmount: number;
  onPaper: boolean;
  link?: string;
}

/**
 * The three things a row can be, rather than the two it used to be.
 *
 * "Part cash" is the state that was missing and the one that did the damage:
 * an invoice with a deposit against it was counted as though the whole bill
 * had been paid, and the day's takings came out higher than the drawer.
 */
const cashState = (row: LedgerRow) => {
  const cash = row.cashAmount ?? 0;
  if (cash <= 0) return "none" as const;
  if (cash >= row.amount) return "full" as const;
  return "part" as const;
};

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
  const totals = data?.data?.totals ?? {
    count: 0,
    cashIn: 0,
    cashOut: 0,
    net: 0,
    billedIn: 0,
    billedOut: 0,
  };

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
      headers: [
        "Date",
        "Kind",
        "Reference",
        "Who / what",
        "In",
        "Out",
        "Cash",
        "Cash amount",
      ],
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
        // Its own column beside the label, so a spreadsheet can add up the
        // cash without anyone re-deriving which rows counted.
        { none: "On paper", part: "Part cash", full: "Cash moved" }[
          cashState(row)
        ],
        (row.cashAmount ?? 0).toLocaleString("en-BD"),
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
        {/*
          Both tiles name what they are a fraction of. "Cash in 40,000" alone
          reads as a slow month; "of 90,000 invoiced" reads as a collection
          problem, which is the thing worth acting on.
        */}
        <MetricCard
          icon={ArrowDownLeft}
          label="Cash in"
          accent="#10b981"
          hint={`Received, of ${totals.billedIn.toLocaleString(
            "en-BD"
          )} invoiced`}
          value={<Money value={totals.cashIn} />}
          loading={isFetching}
        />
        <MetricCard
          icon={ArrowUpRight}
          label="Cash out"
          accent="#f43f5e"
          hint={`Paid, of ${totals.billedOut.toLocaleString("en-BD")} billed`}
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
            key: "cashAmount",
            width: 130,
            render: (_: unknown, row: LedgerRow) => {
              const state = cashState(row);

              // The row belongs in the books but no money changed hands —
              // a bill on terms, a credit against an unpaid invoice.
              if (state === "none") {
                return <Tag className="!m-0 !text-[10px]">On paper</Tag>;
              }

              // Some of it did. The figure is shown because "part" without an
              // amount only replaces one wrong impression with another.
              if (state === "part") {
                return (
                  <div className="flex flex-col items-start gap-0.5">
                    <Tag className="!m-0 !border-[#f59e0b55] !bg-[#fffbeb] !text-[10px] !text-[#92400e]">
                      Part cash
                    </Tag>
                    <span className="text-[10px] text-secondary-400">
                      <Money value={row.cashAmount} /> of{" "}
                      <Money value={row.amount} />
                    </span>
                  </div>
                );
              }

              return (
                <Tag className="!m-0 !border-primary-200 !bg-primary-50 !text-[10px] !text-primary-700">
                  Cash moved
                </Tag>
              );
            },
          },
        ]}
      />
    </div>
  );
};

export default Ledger;
