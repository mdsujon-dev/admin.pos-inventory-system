import { DatePicker, Input, Tag } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { Boxes, Clock, Search, Undo2, Wallet } from "lucide-react";
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
import PickBillModal from "../../components/modal/purchasing/PickBillModal";
import PurchaseReturnModal from "../../components/modal/purchasing/PurchaseReturnModal";
import RefundReceiptModal from "../../components/modal/purchasing/RefundReceiptModal";
import ExportMenu from "../../components/Common/ExportMenu";
import { makeSheet } from "../../utils/tableExport";
import {
  IPurchaseReturn,
  useGetPurchaseReturnsQuery,
  useLazyGetPurchaseReturnsQuery,
} from "../../redux/features/purchasing/purchaseReturnApi";
import { PAYMENT_METHOD_LABELS } from "../../utils/money";

const { RangePicker } = DatePicker;

/**
 * What a return did to the money, in one line.
 *
 * Three outcomes rather than the two this page used to show: money still owed
 * by the supplier reads as neither cash nor credit, and folding it into either
 * is what let a promised refund pass for one that arrived.
 */
const settledLabel = (row: IPurchaseReturn) => {
  const owed = row.refundDue ?? 0;
  const back = row.refundAmount ?? 0;
  const method = PAYMENT_METHOD_LABELS[row.refundMethod ?? "cash"];

  if (owed > 0) {
    return back > 0
      ? `${owed.toLocaleString("en-BD")} still owed (${back.toLocaleString(
          "en-BD"
        )} received)`
      : `${owed.toLocaleString("en-BD")} owed by supplier`;
  }
  if (back > 0) return `Money back (${method})`;
  return "Off the bill";
};

/**
 * Goods sent back to a supplier.
 *
 * Its own screen rather than a note on the bill, because a return has its own
 * date: a delivery accepted in January and found faulty in March is March's
 * credit, and the bill has to keep saying what arrived in January.
 */
const PurchaseReturns = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [returning, setReturning] = useState<string | null>(null);
  const [collecting, setCollecting] = useState<IPurchaseReturn | null>(null);

  const { data, isFetching } = useGetPurchaseReturnsQuery([
    { name: "page", value: currentPage },
    { name: "limit", value: limit },
    ...(searchText ? [{ name: "keyword", value: searchText }] : []),
    ...(range?.[0] ? [{ name: "from", value: range[0].toISOString() }] : []),
    ...(range?.[1] ? [{ name: "to", value: range[1].toISOString() }] : []),
  ]);

  const rows: IPurchaseReturn[] = data?.data?.data || [];
  const total: number = data?.data?.meta?.total || 0;

  const [fetchAll] = useLazyGetPurchaseReturnsQuery();

  const buildSheet = async () => {
    const all = await fetchAll([
      { name: "limit", value: 5000 },
      ...(searchText ? [{ name: "keyword", value: searchText }] : []),
      ...(range?.[0] ? [{ name: "from", value: range[0].toISOString() }] : []),
      ...(range?.[1] ? [{ name: "to", value: range[1].toISOString() }] : []),
    ]).unwrap();

    return makeSheet({
      title: "Purchase Returns",
      unit: "return",
      filters: [
        range?.[0] && range?.[1]
          ? `${range[0].format("DD MMM YYYY")} to ${range[1].format("DD MMM YYYY")}`
          : "",
        searchText ? `Search: "${searchText}"` : "",
      ],
      headers: ["Return", "Date", "Bill", "Supplier", "Units", "Settled", "Value"],
      rows: (all?.data?.data ?? []) as IPurchaseReturn[],
      // A return still waiting on its money is the row the reader is looking
      // for, so it is the one the export marks.
      isLow: (row: IPurchaseReturn) => (row.refundDue ?? 0) > 0,
      cells: (row: IPurchaseReturn) => [
        row.returnNo,
        dayjs(row.returnedAt).format("DD MMM YYYY"),
        row.purchaseNo,
        row.vendorName,
        row.totalQuantity,
        settledLabel(row),
        row.totalCost.toLocaleString("en-BD"),
      ],
    });
  };

  const pageValue = rows.reduce((sum, row) => sum + row.totalCost, 0);
  const pageCash = rows.reduce((sum, row) => sum + row.refundAmount, 0);
  const pageOwed = rows.reduce((sum, row) => sum + (row.refundDue ?? 0), 0);
  const pageUnits = rows.reduce((sum, row) => sum + row.totalQuantity, 0);

  return (
    <div>
      <PageMeta
        title="Purchase Returns - POS & Inventory"
        description="Goods sent back to suppliers"
        noindex
      />
      <PageHeader
        title="Purchase Returns"
        subtitle="What went back to the supplier, and what it settled"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Purchasing" },
          { title: "Returns" },
        ]}
        extra={
          <div className="flex flex-wrap items-center gap-2">
          <ExportMenu sheet={buildSheet} disabled={total === 0} />
          <PermissionGate module="Purchase Returns" action="Create">
            <Button variant="primary" onClick={() => setChoosing(true)}>
              <Undo2 className="h-4 w-4" />
              Send goods back
            </Button>
          </PermissionGate>
          </div>
        }
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
          hint="At landed cost"
          value={<Money value={pageValue} />}
          loading={isFetching}
        />
        <MetricCard
          icon={Wallet}
          label="Money back"
          accent="#10b981"
          hint="The rest came off what we owe"
          value={<Money value={pageCash} />}
          loading={isFetching}
        />
        <MetricCard
          icon={Wallet}
          label="Off supplier bills"
          accent="#3b82f6"
          hint="Credited rather than refunded"
          value={<Money value={pageValue - pageCash} />}
          loading={isFetching}
        />
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <Input
          placeholder="Return no, bill no or supplier..."
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
        isShowSizeChanger
        onRow={(row: IPurchaseReturn) => ({
          onClick: () => navigate(`/purchases/${row.purchase}`),
          className: "cursor-pointer",
        })}
        emptyText={
          <TableEmpty
            icon={Undo2}
            accent="#8b5cf6"
            title="Nothing sent back"
            hint={
              searchText || range
                ? "No return matches those filters."
                : "Faulty or wrong stock goes back from here — use “Send goods back”."
            }
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
            title: "Against",
            key: "purchaseNo",
            width: 170,
            render: (_: unknown, row: IPurchaseReturn) => (
              <div>
                <p className="m-0 font-mono text-[12px] text-secondary-700">
                  {row.purchaseNo}
                </p>
                <span className="text-[11px] text-secondary-400">
                  {row.vendorName}
                </span>
              </div>
            ),
          },
          {
            title: "Items",
            key: "items",
            render: (_: unknown, row: IPurchaseReturn) => (
              <span className="line-clamp-2 text-[13px] text-secondary-700">
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
            ),
          },
          {
            title: "Settled",
            key: "mode",
            width: 180,
            render: (_: unknown, row: IPurchaseReturn) =>
              row.refundAmount > 0 ? (
                <span className="text-[12px] text-secondary-600">
                  <Money value={row.refundAmount} /> back in{" "}
                  {PAYMENT_METHOD_LABELS[row.refundMethod ?? "cash"]}
                </span>
              ) : (
                <Tag className="!m-0 !border-primary-200 !bg-primary-50 !text-[11px] !text-primary-700">
                  Off the bill
                </Tag>
              ),
          },
          {
            title: "Value",
            key: "totalCost",
            width: 130,
            align: "right" as const,
            render: (_: unknown, row: IPurchaseReturn) => (
              <span className="font-semibold text-secondary-800">
                <Money value={row.totalCost} />
              </span>
            ),
          },
        ]}
      />

      <PickBillModal
        open={choosing}
        setOpen={setChoosing}
        onPick={setReturning}
      />

      {returning && (
        <PurchaseReturnModal
          purchaseId={returning}
          open={!!returning}
          setOpen={(value) => !value && setReturning(null)}
        />
      )}
    </div>
  );
};

export default PurchaseReturns;
