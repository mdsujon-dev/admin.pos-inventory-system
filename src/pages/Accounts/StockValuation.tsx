import { Input, Table } from "antd";
import dayjs from "dayjs";
import { Layers, Package, Search, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import Money from "../../components/shared/Money";
import {
  useGetPotentialProfitQuery,
  useGetStockValuationQuery,
} from "../../redux/features/accounts/reportApi";
import { SectionCard, StatTile } from "../Inventory/Products/ProductFormUI";

/**
 * What the shelf is worth.
 *
 * Valued at what each batch actually cost, not at today's buying price —
 * multiplying the count by the latest price would value old stock at a figure
 * nobody ever paid for it, and every "why don't the books match" conversation
 * starts there.
 */
const StockValuation = () => {
  const [search, setSearch] = useState("");

  const { data, isFetching } = useGetStockValuationQuery(undefined);
  const { data: potentialData } = useGetPotentialProfitQuery(undefined);

  const valuation = data?.data;
  const potential = potentialData?.data;

  const rows = useMemo(() => {
    const items = valuation?.items ?? [];
    if (!search.trim()) return items;
    const needle = search.trim().toLowerCase();
    return items.filter(
      (row: any) =>
        row.name?.toLowerCase().includes(needle) ||
        row.sku?.toLowerCase().includes(needle) ||
        row.variantName?.toLowerCase().includes(needle)
    );
  }, [valuation, search]);

  return (
    <div>
      <PageMeta
        title="Stock Valuation - POS & Inventory"
        description="What the shelf is worth, at what each batch cost"
        noindex
      />
      <PageHeader
        title="Stock Valuation"
        subtitle="Money sitting on the shelf, batch by batch"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Accounts", path: "/accounts" },
          { title: "Stock Valuation" },
        ]}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Package} label="Units on hand" tone="muted">
          {valuation?.totalQuantity ?? 0}
        </StatTile>
        <StatTile icon={Wallet} label="Stock at cost" tone="brand">
          <Money value={valuation?.totalValue ?? 0} />
        </StatTile>
        <StatTile icon={Layers} label="At today's prices" tone="muted">
          <Money value={potential?.stockRetail ?? 0} />
        </StatTile>
        <StatTile
          icon={TrendingUp}
          label="If it all sold"
          tone="brand"
          note="A forecast, not earnings"
        >
          <Money value={potential?.potentialProfit ?? 0} />
        </StatTile>
      </div>

      <div className="mb-5">
        <Input
          placeholder="Search by name or SKU..."
          prefix={<Search className="h-4 w-4 text-secondary-400" />}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          allowClear
          className="max-w-md"
        />
      </div>

      <SectionCard
        icon={Wallet}
        title="By item"
        subtitle="Most valuable first — this is where the money is parked"
      >
        <Table
          dataSource={rows}
          rowKey={(row: any) => `${row.productId}-${row.variantId ?? "none"}`}
          loading={isFetching}
          size="small"
          locale={{
            emptyText: search
              ? `Nothing in stock matches "${search}"`
              : "Nothing in stock. Value appears here once a purchase puts something on the shelf.",
          }}
          pagination={{ pageSize: 25, showSizeChanger: true }}
          columns={[
            {
              title: "Item",
              key: "name",
              render: (_: unknown, row: any) => (
                <div className="min-w-0">
                  <p className="m-0 truncate text-sm text-secondary-800">
                    {row.name}
                    {row.variantName ? ` — ${row.variantName}` : ""}
                  </p>
                  <span className="font-mono text-[11px] text-secondary-400">
                    {row.sku}
                  </span>
                </div>
              ),
            },
            {
              title: "Qty",
              key: "quantity",
              width: 80,
              render: (_: unknown, row: any) => row.quantity,
            },
            {
              title: "Avg cost",
              key: "averageCost",
              width: 110,
              render: (_: unknown, row: any) => (
                <Money value={row.averageCost} />
              ),
            },
            {
              title: "Batches",
              key: "lotCount",
              width: 90,
              render: (_: unknown, row: any) => row.lotCount,
            },
            {
              title: "Oldest batch",
              key: "oldestReceivedAt",
              width: 130,
              render: (_: unknown, row: any) =>
                dayjs(row.oldestReceivedAt).format("DD MMM YYYY"),
            },
            {
              title: "Value",
              key: "value",
              width: 130,
              render: (_: unknown, row: any) => (
                <span className="font-semibold text-secondary-800">
                  <Money value={row.value} />
                </span>
              ),
            },
          ]}
        />
      </SectionCard>
    </div>
  );
};

export default StockValuation;
