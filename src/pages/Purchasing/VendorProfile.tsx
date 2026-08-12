import { Button, Table, Tag } from "antd";
import dayjs from "dayjs";
import {
  ArrowLeft,
  Package,
  Phone,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import { Loading } from "../../components/shared/Loading";
import Money from "../../components/shared/Money";
import { useGetVendorLedgerQuery } from "../../redux/features/purchasing/purchaseApi";
import { SectionCard, StatTile } from "../Inventory/Products/ProductFormUI";

/**
 * One supplier's account.
 *
 * Three questions, answered in the order anyone asks them: what do we owe,
 * what have we bought, and what did each thing cost last time. The third is
 * the one that takes five minutes without a screen like this, because the
 * answer is spread across every bill they ever sent.
 */
const VendorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isFetching } = useGetVendorLedgerQuery(
    { vendorId: id as string },
    { skip: !id }
  );

  if (isFetching) return <Loading />;

  const ledger = data?.data;
  if (!ledger) return null;

  const { vendor, purchases, totals, byProduct } = ledger;

  return (
    <div>
      <PageMeta
        title={`${vendor.name} - Vendor - POS & Inventory`}
        description="Vendor ledger and purchase history"
        noindex
      />
      <PageHeader
        title={vendor.name}
        subtitle={vendor.company || "Supplier account and purchase history"}
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Purchasing" },
          { title: "Vendors", path: "/vendors" },
          { title: vendor.name },
        ]}
        extra={
          <Button
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate("/vendors")}
          >
            All vendors
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Receipt} label="Bills" tone="muted">
          {totals.billCount}
        </StatTile>
        <StatTile icon={Wallet} label="Purchased" tone="brand">
          <Money value={totals.purchased} />
        </StatTile>
        <StatTile icon={TrendingUp} label="Paid" tone="brand">
          <Money value={totals.paid} />
        </StatTile>
        <StatTile
          icon={Phone}
          label="Still owed"
          tone={totals.due > 0 ? "danger" : "muted"}
          note={totals.due > 0 ? "Call them before they call you" : undefined}
        >
          <Money value={totals.due} />
        </StatTile>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard
          icon={Receipt}
          title="Bills"
          subtitle="Newest first, with what is still owed on each"
        >
          <Table
            dataSource={purchases}
            rowKey="_id"
            size="small"
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
            columns={[
              {
                title: "Bill",
                key: "purchaseNo",
                render: (_: unknown, row: any) => (
                  <div>
                    <p className="m-0 font-mono text-xs font-semibold">
                      {row.purchaseNo}
                    </p>
                    <span className="text-[11px] text-secondary-400">
                      {dayjs(row.purchaseDate).format("DD MMM YYYY")}
                      {row.billNo ? ` · ${row.billNo}` : ""}
                    </span>
                  </div>
                ),
              },
              {
                title: "Total",
                key: "grandTotal",
                render: (_: unknown, row: any) => (
                  <Money value={row.grandTotal} />
                ),
              },
              {
                title: "Due",
                key: "due",
                render: (_: unknown, row: any) =>
                  row.due > 0 ? (
                    <span className="font-medium text-danger">
                      <Money value={row.due} />
                    </span>
                  ) : (
                    <Tag className="!m-0 !border-primary-200 !bg-primary-50 !text-[11px] !text-primary-700">
                      Settled
                    </Tag>
                  ),
              },
              {
                title: "",
                key: "actions",
                width: 60,
                render: (_: unknown, row: any) => (
                  <Button
                    size="small"
                    onClick={() => navigate(`/purchases/${row._id}`)}
                  >
                    Open
                  </Button>
                ),
              },
            ]}
          />
        </SectionCard>

        <SectionCard
          icon={Package}
          title="What we buy from them"
          subtitle="With the last price paid — no need to open five bills"
        >
          <Table
            dataSource={byProduct}
            rowKey={(row: any) =>
              `${row._id.product}-${row._id.variantId ?? "none"}`
            }
            size="small"
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
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
                width: 70,
                render: (_: unknown, row: any) => row.quantity,
              },
              {
                title: "Last cost",
                key: "lastUnitCost",
                width: 110,
                render: (_: unknown, row: any) => (
                  <div>
                    <Money value={row.lastUnitCost} />
                    <p className="m-0 text-[11px] text-secondary-400">
                      {dayjs(row.lastBoughtAt).format("DD MMM YY")}
                    </p>
                  </div>
                ),
              },
              {
                title: "Spent",
                key: "spent",
                width: 110,
                render: (_: unknown, row: any) => <Money value={row.spent} />,
              },
            ]}
          />
        </SectionCard>
      </div>
    </div>
  );
};

export default VendorProfile;
