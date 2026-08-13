import { Button, Tag } from "antd";
import { useState } from "react";
import dayjs from "dayjs";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  Phone,
  Receipt,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import Money from "../../components/shared/Money";
import DataTable from "../../components/Table/DataTable";
import {
  useGetPayablesQuery,
  useGetReceivablesQuery,
} from "../../redux/features/accounts/reportApi";
import { MetricCard } from "../../components/Common/MetricCard";

/**
 * Money owed, in both directions.
 * Shows unsettled bills in a unified table.
 */
const Receivables = ({ mode }: { mode: "receivable" | "payable" }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const isOwedToUs = mode === "receivable";

  const { data: receivableData, isFetching: loadingIn } = useGetReceivablesQuery(
    undefined,
    { skip: !isOwedToUs }
  );
  const { data: payableData, isFetching: loadingOut } = useGetPayablesQuery(
    undefined,
    { skip: isOwedToUs }
  );

  const report = isOwedToUs ? receivableData?.data : payableData?.data;
  const loading = isOwedToUs ? loadingIn : loadingOut;
  const people = isOwedToUs ? report?.byCustomer ?? [] : report?.byVendor ?? [];
  const documents = isOwedToUs ? report?.invoices ?? [] : report?.bills ?? [];

  const totalDue = report?.totalDue ?? 0;
  const docCount = isOwedToUs
    ? report?.invoiceCount ?? 0
    : report?.billCount ?? 0;

  /**
   * Who owes the most, and how long the oldest debt has been sitting.
   *
   * Both come off the report the page already has rather than a second
   * request — the grouped list is sorted by amount, and every row carries the
   * date of its oldest document.
   */
  const biggest = people[0] as { name?: string; due?: number } | undefined;
  const oldest = people.reduce(
    (earliest: string | null, row: { oldest?: string }) =>
      row.oldest && (!earliest || dayjs(row.oldest).isBefore(earliest))
        ? row.oldest
        : earliest,
    null as string | null
  );

  const oldestAge = (() => {
    if (!oldest) return "—";
    const days = dayjs().startOf("day").diff(dayjs(oldest).startOf("day"), "day");
    if (days <= 0) return "Today";
    if (days === 1) return "1 day";
    if (days < 31) return `${days} days`;
    const months = Math.floor(days / 30);
    return months === 1 ? "1 month" : `${months} months`;
  })();

  return (
    <div>
      <PageMeta
        title={`${isOwedToUs ? "Customer Dues" : "Vendor Dues"} - POS & Inventory`}
        description="Outstanding balances, oldest first"
        noindex
      />
      <PageHeader
        title={isOwedToUs ? "Customer Dues" : "Vendor Dues"}
        subtitle={
          isOwedToUs
            ? "Sales left unpaid, and who to call about them"
            : "Supplier bills not yet settled"
        }
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Accounts", path: "/accounts" },
          { title: isOwedToUs ? "Customer Dues" : "Vendor Dues" },
        ]}
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label={isOwedToUs ? "Owed to us" : "We owe"}
          value={<Money value={totalDue} />}
          hint={
            isOwedToUs
              ? "Sales still to be collected"
              : "Supplier bills still to settle"
          }
          icon={isOwedToUs ? ArrowDownLeft : ArrowUpRight}
          accent="#e91e63"
          loading={loading}
        />
        <MetricCard
          label="Open documents"
          value={docCount}
          hint={`${people.length} ${
            isOwedToUs ? "customer" : "vendor"
          }${people.length === 1 ? "" : "s"} involved`}
          icon={Receipt}
          accent="#3b82f6"
          loading={loading}
        />
        <MetricCard
          label="Largest balance"
          value={<Money value={biggest?.due ?? 0} />}
          hint={biggest?.name || "Nobody owes anything"}
          icon={Phone}
          accent="#f59e0b"
          loading={loading}
        />
        <MetricCard
          label="Oldest debt"
          value={oldestAge}
          hint={
            oldest
              ? `Since ${dayjs(oldest).format("DD MMM YYYY")}`
              : "Nothing outstanding"
          }
          icon={CalendarClock}
          accent="#8b5cf6"
          loading={loading}
        />
      </div>

      <div className="">
        <DataTable
          data={documents}
          rowKey="_id"
          loading={loading}
          isPaginate={documents.length > limit}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          limit={limit}
          setLimit={setLimit}
          total={documents.length}
          emptyText={`No unsettled ${isOwedToUs ? 'invoices' : 'bills'} found`}
          columns={[
            {
              title: "Document",
              key: "no",
              render: (_: unknown, row: any) => (
                <div>
                  <p className="m-0 font-mono text-[13px] font-semibold text-secondary-800">
                    {row.invoiceNo ?? row.purchaseNo}
                  </p>
                  <span className="text-[12px] text-secondary-500">
                    {dayjs(row.saleDate ?? row.purchaseDate).format(
                      "DD MMM YYYY"
                    )}
                  </span>
                </div>
              ),
            },
            {
              title: "Who",
              key: "who",
              render: (_: unknown, row: any) => (
                <span className="text-[13px] font-medium text-secondary-700">
                  {row.customerName ?? row.vendorName}
                </span>
              ),
            },
            {
              title: "Owed",
              key: "due",
              width: 150,
              render: (_: unknown, row: any) => (
                <span className="text-[15px] font-bold text-danger">
                  <Money value={row.due} />
                </span>
              ),
            },
            {
              title: "",
              key: "open",
              width: 90,
              render: (_: unknown, row: any) => (
                <Button
                  size="small"
                  onClick={() =>
                    navigate(
                      isOwedToUs
                        ? `/sales/invoices/${row._id}`
                        : `/purchases/${row._id}`
                    )
                  }
                >
                  Open
                </Button>
              ),
            },
          ]}
        />
      </div>

      {(report?.totalDue ?? 0) === 0 && !loading && (
        <Tag className="!mt-4 !border-primary-200 !bg-primary-50 !text-primary-700">
          Nothing outstanding — everything is settled
        </Tag>
      )}
    </div>
  );
};

export default Receivables;
