import { DatePicker, Input, Select, Tag } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { Boxes, CalendarClock, PackageX, Search, TrendingDown } from "lucide-react";
import { useState } from "react";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import PermissionGate from "../../components/Common/PermissionGate";
import { MetricCard } from "../../components/Common/MetricCard";
import Button from "../../components/ui/Button";
import Money from "../../components/shared/Money";
import DataTable from "../../components/Table/DataTable";
import TableEmpty from "../../components/Table/TableEmpty";
import WriteOffModal from "../../components/modal/inventory/WriteOffModal";
import {
  IWriteOff,
  useGetWriteOffsQuery,
  WRITE_OFF_REASONS,
} from "../../redux/features/inventory/writeOffApi";

const { RangePicker } = DatePicker;

const REASON_LABEL: Record<string, string> = Object.fromEntries(
  WRITE_OFF_REASONS.map((row) => [row.value, row.label])
);

/**
 * Stock that left without being sold.
 *
 * Its own screen because it is a cost like any other, and one nobody sees
 * until it is written down: goods quietly binned at the back of the shop show
 * up months later as a stocktake nobody can explain.
 */
const WriteOffs = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [reason, setReason] = useState<string>("all");
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [writing, setWriting] = useState(false);

  const { data, isFetching } = useGetWriteOffsQuery([
    { name: "page", value: currentPage },
    { name: "limit", value: limit },
    ...(searchText ? [{ name: "keyword", value: searchText }] : []),
    ...(reason !== "all" ? [{ name: "reason", value: reason }] : []),
    ...(range?.[0] ? [{ name: "from", value: range[0].toISOString() }] : []),
    ...(range?.[1] ? [{ name: "to", value: range[1].toISOString() }] : []),
  ]);

  const rows: IWriteOff[] = data?.data?.data || [];
  const total: number = data?.data?.meta?.total || 0;

  // Off the page, and labelled as such — an honest total for a filtered set
  // needs its own aggregate, and this list is short enough to read.
  const pageCost = rows.reduce((sum, row) => sum + row.totalCost, 0);
  const pageUnits = rows.reduce((sum, row) => sum + row.totalQuantity, 0);
  const expired = rows
    .filter((row) => row.reason === "expired")
    .reduce((sum, row) => sum + row.totalCost, 0);

  return (
    <div>
      <PageMeta
        title="Stock Write-offs - POS & Inventory"
        description="Goods removed from the shelf without a sale"
        noindex
      />
      <PageHeader
        title="Stock Write-offs"
        subtitle="Expired, damaged or missing goods — and what they cost"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Inventory" },
          { title: "Write-offs" },
        ]}
        extra={
          <PermissionGate module="Stock Write-offs" action="Create">
            <Button variant="primary" onClick={() => setWriting(true)}>
              <PackageX className="h-4 w-4" />
              Write off stock
            </Button>
          </PermissionGate>
        }
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={PackageX}
          label="Write-offs"
          accent="#8b5cf6"
          hint={`${pageUnits} unit${pageUnits === 1 ? "" : "s"} on this page`}
          value={total}
          loading={isFetching}
        />
        <MetricCard
          icon={TrendingDown}
          label="Cost on this page"
          accent="#f43f5e"
          hint="Charged to running costs"
          value={<Money value={pageCost} />}
          loading={isFetching}
        />
        <MetricCard
          icon={CalendarClock}
          label="Expired"
          accent="#f59e0b"
          hint={
            expired > 0
              ? "Bought too much, or too early"
              : "Nothing lost to dates"
          }
          value={<Money value={expired} />}
          loading={isFetching}
        />
        <MetricCard
          icon={Boxes}
          label="Other causes"
          accent="#64748b"
          hint="Damaged, lost, samples"
          value={<Money value={pageCost - expired} />}
          loading={isFetching}
        />
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <Input
          placeholder="Write-off number or note..."
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
          value={reason}
          onChange={(value) => {
            setReason(value);
            setCurrentPage(1);
          }}
          className="min-w-[170px]"
          options={[
            { value: "all", label: "All reasons" },
            ...WRITE_OFF_REASONS.map((row) => ({ ...row })),
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
        emptyText={
          <TableEmpty
            icon={PackageX}
            accent="#8b5cf6"
            title="Nothing written off"
            hint={
              searchText || reason !== "all" || range
                ? "No write-off matches those filters."
                : "When stock expires or breaks, record it here so the loss is counted."
            }
          />
        }
        columns={[
          {
            title: "Write-off",
            key: "writeOffNo",
            width: 170,
            render: (_: unknown, row: IWriteOff) => (
              <div>
                <p className="m-0 font-mono text-[13px] font-semibold text-secondary-800">
                  {row.writeOffNo}
                </p>
                <span className="text-[11px] text-secondary-400">
                  {dayjs(row.writtenOffAt).format("DD MMM YYYY")}
                </span>
              </div>
            ),
          },
          {
            title: "Reason",
            key: "reason",
            width: 140,
            render: (_: unknown, row: IWriteOff) => (
              <Tag
                className={`!m-0 !text-[11px] ${
                  row.reason === "expired"
                    ? "!border-[#f59e0b55] !bg-[#fffbeb] !text-[#92400e]"
                    : ""
                }`}
              >
                {REASON_LABEL[row.reason] ?? row.reason}
              </Tag>
            ),
          },
          {
            title: "Items",
            key: "items",
            render: (_: unknown, row: IWriteOff) => (
              <div className="min-w-0">
                <span className="text-[13px] text-secondary-700">
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
                {row.note && (
                  <p className="m-0 truncate text-[11px] text-secondary-400">
                    {row.note}
                  </p>
                )}
              </div>
            ),
          },
          {
            title: "Units",
            key: "totalQuantity",
            width: 90,
            render: (_: unknown, row: IWriteOff) => row.totalQuantity,
          },
          {
            title: "Loss",
            key: "totalCost",
            width: 130,
            align: "right" as const,
            render: (_: unknown, row: IWriteOff) => (
              <span className="font-semibold text-danger">
                <Money value={row.totalCost} />
              </span>
            ),
          },
          {
            title: "By",
            key: "createdByName",
            width: 130,
            render: (_: unknown, row: IWriteOff) =>
              row.createdByName || <span className="text-secondary-400">—</span>,
          },
        ]}
      />

      <WriteOffModal open={writing} setOpen={setWriting} />
    </div>
  );
};

export default WriteOffs;
