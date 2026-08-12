import { Button, Table, Tag } from "antd";
import dayjs from "dayjs";
import { ArrowDownLeft, ArrowUpRight, Phone, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import Money from "../../components/shared/Money";
import {
  useGetPayablesQuery,
  useGetReceivablesQuery,
} from "../../redux/features/accounts/reportApi";
import { SectionCard, StatTile } from "../Inventory/Products/ProductFormUI";

/** How overdue something is, in the words a person would use. */
const ageOf = (date: string) => {
  const days = dayjs().startOf("day").diff(dayjs(date).startOf("day"), "day");
  if (days <= 0) return "today";
  if (days === 1) return "1 day";
  if (days < 31) return `${days} days`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month" : `${months} months`;
};

/**
 * Money owed, in both directions.
 *
 * Grouped by person rather than by document, because collecting is a phone
 * call per customer and not per invoice — three unpaid bills from one buyer
 * is one conversation, and a list that shows them as three rows invites three.
 */
const Receivables = ({ mode }: { mode: "receivable" | "payable" }) => {
  const navigate = useNavigate();
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
          { title: isOwedToUs ? "Sales" : "Purchasing" },
          { title: isOwedToUs ? "Customer Dues" : "Vendor Dues" },
        ]}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatTile
          icon={isOwedToUs ? ArrowDownLeft : ArrowUpRight}
          label={isOwedToUs ? "Owed to us" : "We owe"}
          tone={(report?.totalDue ?? 0) > 0 ? "danger" : "brand"}
        >
          <Money value={report?.totalDue ?? 0} />
        </StatTile>
        <StatTile icon={Receipt} label="Open documents" tone="muted">
          {isOwedToUs ? report?.invoiceCount ?? 0 : report?.billCount ?? 0}
        </StatTile>
        <StatTile icon={Phone} label="People involved" tone="muted">
          {people.length}
        </StatTile>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          icon={Phone}
          title={isOwedToUs ? "By customer" : "By vendor"}
          subtitle="Largest balance first — this is the call list"
        >
          <Table
            dataSource={people}
            rowKey={(row: any) => String(row._id ?? row.phone ?? row.name)}
            loading={loading}
            size="small"
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
            columns={[
              {
                title: "Name",
                key: "name",
                render: (_: unknown, row: any) => (
                  <div className="min-w-0">
                    <p className="m-0 truncate text-sm text-secondary-800">
                      {row.name || "Walk-in customer"}
                    </p>
                    {row.phone && (
                      <span className="font-mono text-[11px] text-secondary-400">
                        {row.phone}
                      </span>
                    )}
                  </div>
                ),
              },
              {
                title: "Docs",
                key: "count",
                width: 70,
                render: (_: unknown, row: any) =>
                  row.invoiceCount ?? row.billCount,
              },
              {
                title: "Oldest",
                key: "oldest",
                width: 100,
                render: (_: unknown, row: any) => (
                  <span className="text-xs text-secondary-500">
                    {ageOf(row.oldest)}
                  </span>
                ),
              },
              {
                title: "Owed",
                key: "due",
                width: 120,
                render: (_: unknown, row: any) => (
                  <span className="font-semibold text-danger">
                    <Money value={row.due} />
                  </span>
                ),
              },
            ]}
          />
        </SectionCard>

        <SectionCard
          icon={Receipt}
          title={isOwedToUs ? "Unpaid invoices" : "Unsettled bills"}
          subtitle="Oldest first"
        >
          <Table
            dataSource={documents}
            rowKey="_id"
            loading={loading}
            size="small"
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
            columns={[
              {
                title: "Document",
                key: "no",
                render: (_: unknown, row: any) => (
                  <div>
                    <p className="m-0 font-mono text-xs font-semibold">
                      {row.invoiceNo ?? row.purchaseNo}
                    </p>
                    <span className="text-[11px] text-secondary-400">
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
                  <span className="text-sm text-secondary-700">
                    {row.customerName ?? row.vendorName}
                  </span>
                ),
              },
              {
                title: "Owed",
                key: "due",
                width: 110,
                render: (_: unknown, row: any) => (
                  <span className="font-semibold text-danger">
                    <Money value={row.due} />
                  </span>
                ),
              },
              {
                title: "",
                key: "open",
                width: 70,
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
        </SectionCard>
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
