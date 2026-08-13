import { Tag } from "antd";
import dayjs from "dayjs";
import { CalendarClock, Clock, HandCoins, Undo2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import PermissionGate from "../../components/Common/PermissionGate";
import { MetricCard } from "../../components/Common/MetricCard";
import Button from "../../components/ui/Button";
import Money from "../../components/shared/Money";
import DataTable from "../../components/Table/DataTable";
import TableEmpty from "../../components/Table/TableEmpty";
import RefundReceiptModal from "../../components/modal/purchasing/RefundReceiptModal";
import ExportMenu from "../../components/Common/ExportMenu";
import { makeSheet } from "../../utils/tableExport";
import {
  IPurchaseReturn,
  useGetOutstandingRefundsQuery,
} from "../../redux/features/purchasing/purchaseReturnApi";

/** "3 days" / "2 months" — how long a supplier has been sitting on our money. */
const ageOf = (date?: string) => {
  if (!date) return "—";
  const days = dayjs().startOf("day").diff(dayjs(date).startOf("day"), "day");
  if (days <= 0) return "Today";
  if (days === 1) return "1 day";
  if (days < 31) return `${days} days`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month" : `${months} months`;
};

/**
 * Refunds a supplier has promised and not yet sent.
 *
 * The chase list, and the reason the "they'll pay later" option is safe to
 * use: an amount that leaves the cash figures has to turn up somewhere a
 * person will look, or it stops being money anyone remembers to ask for.
 *
 * Deliberately unfiltered and unpaged by date. Every other purchasing screen
 * answers "what happened in this period"; this one answers "what is still
 * outstanding", and a date range would only ever hide part of the answer.
 * Oldest first, because that is the order these get chased in.
 */
const SupplierRefunds = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [collecting, setCollecting] = useState<IPurchaseReturn | null>(null);

  const { data, isFetching } = useGetOutstandingRefundsQuery(undefined);
  const rows: IPurchaseReturn[] = data?.data ?? [];

  const totalOwed = rows.reduce((sum, row) => sum + (row.refundDue ?? 0), 0);
  const received = rows.reduce((sum, row) => sum + (row.refundAmount ?? 0), 0);

  // The two figures that decide who gets called first.
  const biggest = rows.reduce(
    (worst: IPurchaseReturn | null, row) =>
      !worst || (row.refundDue ?? 0) > (worst.refundDue ?? 0) ? row : worst,
    null
  );
  const oldest = rows.reduce(
    (earliest: string | null, row) =>
      !earliest || dayjs(row.returnedAt).isBefore(earliest)
        ? row.returnedAt
        : earliest,
    null as string | null
  );

  // The whole list, not the page: this one already holds everything.
  const buildSheet = () =>
    makeSheet({
      title: "Refunds owed by suppliers",
      unit: "return",
      filters: [],
      headers: [
        "Return",
        "Sent back",
        "Bill",
        "Supplier",
        "Value",
        "Received",
        "Still owed",
        "Waiting",
      ],
      rows,
      // Every row here is money we do not have yet.
      isLow: () => true,
      cells: (row: IPurchaseReturn) => [
        row.returnNo,
        dayjs(row.returnedAt).format("DD MMM YYYY"),
        row.purchaseNo,
        row.vendorName,
        row.totalCost.toLocaleString("en-BD"),
        (row.refundAmount ?? 0).toLocaleString("en-BD"),
        (row.refundDue ?? 0).toLocaleString("en-BD"),
        ageOf(row.returnedAt),
      ],
      note: `Owed in total ${totalOwed.toLocaleString("en-BD")}`,
    });

  return (
    <div>
      <PageMeta
        title="Supplier Refunds - POS & Inventory"
        description="Refunds suppliers have promised but not yet sent"
        noindex
      />
      <PageHeader
        title="Supplier Refunds"
        subtitle="Goods went back, the money has not come — yet"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Purchasing" },
          { title: "Supplier Refunds" },
        ]}
        extra={
          <ExportMenu sheet={buildSheet} disabled={rows.length === 0} />
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Clock}
          label="Owed to us"
          accent="#f59e0b"
          hint="Promised, not yet received"
          value={<Money value={totalOwed} />}
          loading={isFetching}
        />
        <MetricCard
          icon={Undo2}
          label="Open returns"
          accent="#8b5cf6"
          hint={
            received > 0
              ? `${received.toLocaleString("en-BD")} already part-paid`
              : "Nothing part-paid yet"
          }
          value={rows.length}
          loading={isFetching}
        />
        <MetricCard
          icon={HandCoins}
          label="Largest"
          accent="#e91e63"
          hint={biggest?.vendorName || "Nobody owes anything"}
          value={<Money value={biggest?.refundDue ?? 0} />}
          loading={isFetching}
        />
        <MetricCard
          icon={CalendarClock}
          label="Waiting longest"
          accent="#3b82f6"
          hint={
            oldest
              ? `Sent back ${dayjs(oldest).format("DD MMM YYYY")}`
              : "Nothing outstanding"
          }
          value={ageOf(oldest ?? undefined)}
          loading={isFetching}
        />
      </div>

      <DataTable
        data={rows}
        rowKey="_id"
        loading={isFetching}
        total={rows.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        limit={limit}
        setLimit={setLimit}
        isPaginate={rows.length > limit}
        isShowSizeChanger
        onRow={(row: IPurchaseReturn) => ({
          onClick: () => navigate(`/purchases/${row.purchase}`),
          className: "cursor-pointer",
        })}
        emptyText={
          <TableEmpty
            icon={HandCoins}
            accent="#10b981"
            title="Every refund has come in"
            hint="When a supplier takes goods back but says they will send the money on, the return lands here until it arrives."
          />
        }
        columns={[
          {
            title: "Return",
            key: "returnNo",
            width: 170,
            render: (_: unknown, row: IPurchaseReturn) => (
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
            title: "Supplier",
            key: "vendorName",
            render: (_: unknown, row: IPurchaseReturn) => (
              <div className="min-w-0">
                <p className="m-0 text-[13px] font-medium text-secondary-800">
                  {row.vendorName}
                </p>
                <span className="font-mono text-[11px] text-secondary-400">
                  {row.purchaseNo}
                </span>
              </div>
            ),
          },
          {
            title: "Waiting",
            key: "age",
            width: 110,
            render: (_: unknown, row: IPurchaseReturn) => (
              <span className="text-[12px] text-secondary-600">
                {ageOf(row.returnedAt)}
              </span>
            ),
          },
          {
            // Both figures, because "500,000 owed" reads very differently next
            // to a return that was worth 500,000 and one worth 900,000.
            title: "Received",
            key: "refundAmount",
            width: 140,
            align: "right" as const,
            render: (_: unknown, row: IPurchaseReturn) => (
              <span className="text-[12px] text-secondary-500">
                {(row.refundAmount ?? 0) > 0 ? (
                  <>
                    <Money value={row.refundAmount} /> of{" "}
                    <Money value={row.totalCost} />
                  </>
                ) : (
                  <>
                    — of <Money value={row.totalCost} />
                  </>
                )}
              </span>
            ),
          },
          {
            title: "Still owed",
            key: "refundDue",
            width: 130,
            align: "right" as const,
            render: (_: unknown, row: IPurchaseReturn) => (
              <span className="font-semibold text-[#92400e]">
                <Money value={row.refundDue} />
              </span>
            ),
          },
          {
            title: "",
            key: "collect",
            width: 130,
            render: (_: unknown, row: IPurchaseReturn) => (
              <PermissionGate module="Purchase Returns" action="Create">
                <Button
                  size="sm"
                  variant="primary"
                  className="whitespace-nowrap"
                  // The row opens the bill; this must not.
                  onClick={(event) => {
                    event.stopPropagation();
                    setCollecting(row);
                  }}
                >
                  Record refund
                </Button>
              </PermissionGate>
            ),
          },
        ]}
      />

      {rows.length > 0 && (
        <Tag className="!mt-4 !border-[#f59e0b55] !bg-[#fffbeb] !text-[#92400e]">
          None of this counts as cash until it is recorded as received
        </Tag>
      )}

      {collecting && (
        <RefundReceiptModal
          row={collecting}
          open={!!collecting}
          setOpen={(value) => !value && setCollecting(null)}
        />
      )}
    </div>
  );
};

export default SupplierRefunds;
