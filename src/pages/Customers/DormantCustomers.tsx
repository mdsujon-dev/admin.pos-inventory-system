import { Button, Select, Tag } from "antd";
import dayjs from "dayjs";
import { AlertCircle, Phone, UserRoundX, Wallet } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import Money from "../../components/shared/Money";
import { useGetDormantCustomersQuery } from "../../redux/features/crm/crmApi";
import DataTable from "../../components/Table/DataTable";
import { MetricCard } from "../../components/Common/MetricCard";
import { SectionCard } from "../Inventory/Products/ProductFormUI";

/**
 * Who has stopped coming.
 *
 * Sorted by what they used to spend rather than by how long they have been
 * gone, because the list exists to answer "who is worth a phone call" — and
 * somebody who spent 200 once is not the same loss as somebody who spent
 * 20,000 a month for a year.
 */
const DormantCustomers = () => {
  const navigate = useNavigate();
  const [days, setDays] = useState(60);

  const { data, isFetching } = useGetDormantCustomersQuery([
    { name: "days", value: days },
    { name: "limit", value: 200 },
  ]);

  const rows = data?.data?.items ?? [];
  const summary = data?.data?.summary ?? {
    count: 0,
    totalSpent: 0,
    totalDue: 0,
  };

  return (
    <div>
      <PageMeta
        title="Dormant Customers - POS & Inventory"
        description="Customers who used to buy and have stopped"
        noindex
      />
      <PageHeader
        title="Dormant Customers"
        subtitle="They bought before and have not been back — worth a call"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Sales" },
          { title: "Dormant Customers" },
        ]}
        extra={
          <Select
            value={days}
            onChange={setDays}
            className="min-w-[180px]"
            options={[
              { label: "Gone 30+ days", value: 30 },
              { label: "Gone 60+ days", value: 60 },
              { label: "Gone 90+ days", value: 90 },
              { label: "Gone 180+ days", value: 180 },
              { label: "Gone a year+", value: 365 },
            ]}
          />
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={UserRoundX}
          label="Gone quiet"
          accent="#64748b"
          value={summary.count}
          loading={isFetching}
        />
        <MetricCard
          icon={Wallet}
          label="They used to spend"
          accent="#10b981"
          hint="Across all their purchases"
          value={<Money value={summary.totalSpent} />}
          loading={isFetching}
        />
        <MetricCard
          icon={Phone}
          label="Cut-off"
          accent="#64748b"
          value={`${days} days`}
          loading={isFetching}
        />
        <MetricCard
          icon={AlertCircle}
          label="Still owed"
          accent="#ef4444"
          hint="Total unpaid balances"
          value={<Money value={summary.totalDue} />}
          loading={isFetching}
        />
      </div>

      <SectionCard
        icon={Phone}
        title="The call list"
        subtitle="Biggest former spenders first"
      >
        <DataTable
          data={rows}
          rowKey="_id"
          loading={isFetching}
          emptyText={`Nobody has been away ${days}+ days — everyone who buys is still coming back`}
          columns={[
            {
              title: "Customer",
              key: "name",
              render: (_: unknown, row: any) => (
                <div className="min-w-0">
                  <p className="m-0 truncate font-medium text-secondary-800">
                    {row.name}
                  </p>
                  <span className="font-mono text-[11px] text-secondary-400">
                    {row.phone}
                  </span>
                </div>
              ),
            },
            {
              title: "Last seen",
              key: "lastPurchaseAt",
              width: 150,
              render: (_: unknown, row: any) => (
                <div>
                  <p className="m-0 text-sm text-secondary-700">
                    {dayjs(row.lastPurchaseAt).format("DD MMM YYYY")}
                  </p>
                  <span className="text-[11px] text-danger">
                    {row.daysSinceLastPurchase} days ago
                  </span>
                </div>
              ),
            },
            {
              title: "Bought",
              key: "saleCount",
              width: 90,
              render: (_: unknown, row: any) => `${row.saleCount}×`,
            },
            {
              title: "Average sale",
              key: "averageSale",
              width: 130,
              render: (_: unknown, row: any) => (
                <Money value={row.averageSale} />
              ),
            },
            {
              title: "Spent in total",
              key: "totalSpent",
              width: 140,
              render: (_: unknown, row: any) => (
                <span className="font-semibold text-secondary-800">
                  <Money value={row.totalSpent} />
                </span>
              ),
            },
            {
              title: "Owes",
              key: "totalDue",
              width: 110,
              render: (_: unknown, row: any) =>
                row.totalDue > 0 ? (
                  <Tag className="!m-0 !border-danger/30 !bg-danger/10 !text-[11px] !text-danger">
                    <Money value={row.totalDue} />
                  </Tag>
                ) : (
                  <span className="text-secondary-400">—</span>
                ),
            },
            {
              title: "",
              key: "open",
              width: 80,
              render: (_: unknown, row: any) => (
                <Button
                  size="small"
                  onClick={() => navigate(`/customers/${row._id}`)}
                >
                  Open
                </Button>
              ),
            },
          ]}
        />
      </SectionCard>
    </div>
  );
};

export default DormantCustomers;
