import { Button, Empty, Table, Tag } from "antd";
import dayjs from "dayjs";
import {
  ArrowLeft,
  Banknote,
  Boxes,
  Edit,
  Package,
  Phone,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import PermissionGate from "../../components/Common/PermissionGate";
import VendorPaymentModal from "../../components/modal/purchasing/VendorPaymentModal";
import { Loading } from "../../components/shared/Loading";
import Money from "../../components/shared/Money";
import { useGetVendorLedgerQuery } from "../../redux/features/purchasing/purchaseApi";
import { PAYMENT_METHOD_LABELS } from "../../utils/money";
import { SectionCard, StatTile } from "../Inventory/Products/ProductFormUI";

/** Name off a reference that may be populated or a bare id. */
const nameOf = (row: unknown) =>
  row && typeof row === "object" ? (row as { name?: string }).name : null;

/**
 * One supplier's account, whole.
 *
 * Four questions in the order anyone asks them: what do we owe, what do they
 * supply, what have we bought, and when did we last pay. The last two are the
 * ones that take five minutes without a screen like this, because the answers
 * are spread across every bill they ever sent.
 */
const VendorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);

  const { data, isFetching } = useGetVendorLedgerQuery(
    { vendorId: id as string },
    { skip: !id }
  );

  if (isFetching) return <Loading />;

  const ledger = data?.data;
  if (!ledger) return null;

  const { vendor, purchases, payments, totals, byProduct } = ledger;
  const openBills = (purchases ?? []).filter((row: any) => row.due > 0);

  const supplies = [
    ...(vendor.categories ?? []).map((row: unknown) => ({
      label: nameOf(row),
      kind: "category" as const,
    })),
    ...(vendor.subCategories ?? []).map((row: unknown) => ({
      label: nameOf(row),
      kind: "sub" as const,
    })),
  ].filter((row) => row.label);

  /**
   * The terms line, then one card per method.
   *
   * Each method is shown with the fields that method actually has rather than
   * flattened into a single list of labels — a bank's branch and a cash
   * payment's "who signs for it" are not the same kind of fact, and reading
   * them off one column makes both harder to find.
   */
  const terms = (vendor.paymentTerms ?? []) as {
    side: "ours" | "vendor";
    text: string;
  }[];
  const ourTerms = terms.filter((row) => row.side === "ours");
  const theirTerms = terms.filter((row) => row.side === "vendor");

  const methodRows = (method: any): [string, string][] =>
    (
      [
        ["Bank", method.provider],
        ["Provider", method.methodType !== "Bank" ? method.provider : ""],
        ["Branch", method.branch],
        ["Account name", method.accountName],
        ["Account no", method.accountNumber],
        ["Routing", method.routingNumber],
        ["Account type", method.accountType],
        ["Handed to", method.receiverName],
        ["Voucher to", method.voucherReceiver],
        ["Confirmed by", method.confirmedBy],
      ] as [string, string][]
    ).filter(([, value]) => value);

  const methods = (vendor.paymentMethods ?? []) as any[];

  /**
   * The address back as one line, smallest unit first.
   *
   * Stored in parts so it can be searched and grouped; read out as a sentence
   * because that is how anyone actually uses it to find the place.
   */
  const address = (vendor.address ?? {}) as Record<string, string>;
  const addressLine = [
    address.road,
    address.area,
    address.upazila,
    address.district,
    address.postCode,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");

  return (
    <div>
      <PageMeta
        title={`${vendor.name} - Vendor - POS & Inventory`}
        description="Vendor ledger, purchase history and payments"
        noindex
      />
      <PageHeader
        title={vendor.name}
        subtitle={vendor.company || "Supplier account and history"}
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Purchasing" },
          { title: "Vendors", path: "/vendors" },
          { title: vendor.name },
        ]}
        extra={
          <div className="flex flex-wrap gap-2">
            <Button
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate("/vendors")}
            >
              All vendors
            </Button>
            <PermissionGate module="Vendors" action="Update">
              <Button
                icon={<Edit className="h-4 w-4" />}
                onClick={() => navigate(`/vendors/${id}/edit`)}
              >
                Edit
              </Button>
            </PermissionGate>
            <PermissionGate module="Vendor Payments" action="Create">
              <Button
                type="primary"
                icon={<Wallet className="h-4 w-4" />}
                onClick={() => setPaying(true)}
                className="!border-0 !bg-gradient-to-r !from-primary-600 !to-primary-500 shadow-primary"
              >
                Record Payment
              </Button>
            </PermissionGate>
          </div>
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

      {/* Who they are, and what they carry */}
      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <SectionCard
          icon={Boxes}
          title="What they supply"
          subtitle="The headings to reach for when something runs out"
        >
          {supplies.length === 0 ? (
            <p className="m-0 text-sm text-secondary-500">
              Nothing recorded yet — edit the vendor and tick what they carry.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {supplies.map((row, index) => (
                <Tag
                  key={`${row.label}-${index}`}
                  className={
                    row.kind === "category"
                      ? "!m-0 !border-primary-200 !bg-primary-50 !text-primary-700"
                      : "!m-0 !text-[12px]"
                  }
                >
                  {row.label}
                </Tag>
              ))}
            </div>
          )}

          <div className="mt-4 space-y-1 border-t border-secondary-100 pt-3 text-xs text-secondary-500">
            <p className="m-0">Phone: {vendor.phone}</p>
            {vendor.email && <p className="m-0">Email: {vendor.email}</p>}
            {addressLine && <p className="m-0">{addressLine}</p>}
            {address.landmark && (
              <p className="m-0 italic">Near {address.landmark}</p>
            )}
            {vendor.note && (
              <p className="m-0 pt-1 text-secondary-600">{vendor.note}</p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          icon={Banknote}
          title="How they get paid"
          subtitle="Written down once instead of asked for every time"
        >
          {terms.length === 0 && methods.length === 0 ? (
            <p className="m-0 text-sm text-secondary-500">
              No payment details saved yet — edit the vendor to add them.
            </p>
          ) : (
            <div className="space-y-3">
              {/* Two columns, because whose promise it was is the first thing
                  anyone needs to know when a term is being argued about. */}
              {terms.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <TermList title="Our terms" rows={ourTerms} tone="brand" />
                  <TermList title="Their terms" rows={theirTerms} />
                </div>
              )}

              {methods.map((method, index) => {
                const rows = methodRows(method);
                return (
                  <div
                    key={`${method.methodType}-${index}`}
                    className="rounded-xl border border-secondary-100 bg-secondary-50 p-3"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Tag className="!m-0 !border-primary-200 !bg-primary-50 !text-[11px] !text-primary-700">
                        {method.methodType}
                      </Tag>
                      {method.accountType && (
                        <Tag className="!m-0 !text-[11px]">
                          {method.accountType}
                        </Tag>
                      )}
                    </div>

                    {rows.length > 0 && (
                      <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                        {rows.map(([label, value]) => (
                          <div key={label}>
                            <p className="m-0 text-[11px] uppercase tracking-wide text-secondary-400">
                              {label}
                            </p>
                            <p className="m-0 text-sm font-medium text-secondary-800">
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {method.details && (
                      <p className="m-0 mt-2 border-t border-secondary-200 pt-2 text-xs text-secondary-600">
                        {method.details}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
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
            pagination={{ pageSize: 8, hideOnSinglePage: true }}
            locale={{ emptyText: "Nothing bought from them yet" }}
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
                width: 110,
                render: (_: unknown, row: any) => (
                  <Money value={row.grandTotal} />
                ),
              },
              {
                title: "Due",
                key: "due",
                width: 110,
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
          icon={Wallet}
          title="Payments"
          subtitle="Every taka handed over, and what it settled"
        >
          {(payments ?? []).length === 0 ? (
            <Empty description="No payments recorded yet" />
          ) : (
            <Table
              dataSource={payments}
              rowKey="_id"
              size="small"
              pagination={{ pageSize: 8, hideOnSinglePage: true }}
              columns={[
                {
                  title: "Payment",
                  key: "paymentNo",
                  render: (_: unknown, row: any) => (
                    <div>
                      <p className="m-0 font-mono text-xs font-semibold">
                        {row.paymentNo}
                      </p>
                      <span className="text-[11px] text-secondary-400">
                        {dayjs(row.paidAt).format("DD MMM YYYY")} ·{" "}
                        {PAYMENT_METHOD_LABELS[row.method] ?? row.method}
                      </span>
                    </div>
                  ),
                },
                {
                  title: "Settled",
                  key: "allocations",
                  render: (_: unknown, row: any) =>
                    row.allocations?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {row.allocations.slice(0, 2).map((a: any) => (
                          <Tag key={a.purchaseNo} className="!m-0 !text-[10px]">
                            {a.purchaseNo}
                          </Tag>
                        ))}
                        {row.allocations.length > 2 && (
                          <Tag className="!m-0 !text-[10px]">
                            +{row.allocations.length - 2}
                          </Tag>
                        )}
                      </div>
                    ) : (
                      <Tag className="!m-0 !text-[10px]">Advance</Tag>
                    ),
                },
                {
                  title: "Amount",
                  key: "amount",
                  width: 110,
                  render: (_: unknown, row: any) => (
                    <span className="font-semibold text-secondary-800">
                      <Money value={row.amount} />
                    </span>
                  ),
                },
              ]}
            />
          )}
        </SectionCard>
      </div>

      <div className="mt-4">
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
            locale={{ emptyText: "Nothing bought from them yet" }}
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
                title: "Last cost",
                key: "lastUnitCost",
                width: 130,
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
                width: 120,
                render: (_: unknown, row: any) => <Money value={row.spent} />,
              },
            ]}
          />
        </SectionCard>
      </div>

      {paying && (
        <VendorPaymentModal
          open
          setOpen={() => setPaying(false)}
          vendor={vendor}
          bills={openBills}
        />
      )}
    </div>
  );
};

/** One side's promises. Empty is stated rather than left blank. */
const TermList = ({
  title,
  rows,
  tone,
}: {
  title: string;
  rows: { text: string }[];
  tone?: "brand";
}) => (
  <div>
    <p
      className={`m-0 mb-1.5 text-[11px] font-semibold uppercase tracking-wide ${
        tone === "brand" ? "text-primary-700" : "text-secondary-400"
      }`}
    >
      {title}
    </p>
    {rows.length === 0 ? (
      <p className="m-0 text-xs text-secondary-400">None recorded</p>
    ) : (
      <ul className="m-0 list-disc space-y-1 pl-4">
        {rows.map((row, index) => (
          <li key={index} className="text-sm text-secondary-700">
            {row.text}
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default VendorProfile;
