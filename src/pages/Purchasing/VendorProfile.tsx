import { Button, Tag } from "antd";
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
import DataTable from "../../components/Table/DataTable";
import TableEmpty from "../../components/Table/TableEmpty";
import Money from "../../components/shared/Money";
import { MetricCard } from "../../components/Common/MetricCard";
import { useGetVendorLedgerQuery } from "../../redux/features/purchasing/purchaseApi";
import { PAYMENT_METHOD_LABELS } from "../../utils/money";
import { SectionCard } from "../Inventory/Products/ProductFormUI";

/**
 * A table on this page, with its own page number.
 *
 * Four lists share one screen here, so paging has to be per-table: turning to
 * the second page of payments must not move the bills alongside it.
 */
const ProfileTable = ({
  data,
  columns,
  rowKey,
  empty,
  pageSize = 8,
}: {
  data: unknown[];
  columns: unknown[];
  rowKey: string | ((row: any) => string);
  empty: React.ReactNode;
  pageSize?: number;
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(pageSize);
  const rows = data ?? [];

  return (
    <DataTable
      data={rows}
      columns={columns}
      rowKey={rowKey}
      total={rows.length}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      limit={limit}
      setLimit={setLimit}
      isPaginate={rows.length > limit}
      emptyText={empty}
    />
  );
};

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
        <MetricCard 
          icon={Receipt} 
          label="Bills" 
          accent="#8b5cf6" 
          hint="Total invoices received"
          value={totals.billCount} 
        />
        <MetricCard 
          icon={Wallet} 
          label="Purchased" 
          accent="#3b82f6" 
          hint="Total value of goods"
          value={<Money value={totals.purchased} />} 
        />
        <MetricCard 
          icon={TrendingUp} 
          label="Paid" 
          accent="#10b981" 
          hint="Total amount settled"
          value={<Money value={totals.paid} />} 
        />
        <MetricCard
          icon={Phone}
          label="Still owed"
          accent={totals.due > 0 ? "#f43f5e" : "#f59e0b"}
          hint={totals.due > 0 ? "Call them before they call you" : "No outstanding balance"}
          value={<Money value={totals.due} />}
        />
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

              {methods.length > 0 && (
                <ProfileTable
                  data={methods}
                  pageSize={5}
                  rowKey={(row: any) =>
                    `${row.methodType}-${row.accountNumber ?? row.provider ?? ""}`
                  }
                  empty={
                    <TableEmpty
                      icon={Banknote}
                      title="No payment method saved"
                      hint="Edit the vendor to record how they take money."
                    />
                  }
                  columns={[
                    {
                      title: "Method",
                      key: "methodType",
                      width: 150,
                      render: (_: unknown, row: any) => (
                        <div className="flex flex-col items-start gap-1">
                          <Tag className="!m-0 !border-primary-200 !bg-primary-50 !text-[11px] !text-primary-700">
                            {row.methodType}
                          </Tag>
                          {row.accountType && (
                            <span className="text-[11px] text-secondary-400">
                              {row.accountType}
                            </span>
                          )}
                        </div>
                      ),
                    },
                    {
                      title: "Details",
                      key: "details",
                      render: (_: unknown, row: any) => {
                        // Only the fields this method actually has: a bank's
                        // branch and a cash payment's "who signs for it" are
                        // not the same kind of fact, and a fixed set of
                        // columns would leave most of them blank.
                        const pairs = methodRows(row);
                        if (pairs.length === 0) {
                          return <span className="text-secondary-400">—</span>;
                        }
                        return (
                          <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                            {pairs.map(([label, value]) => (
                              <div key={label} className="min-w-0">
                                <p className="m-0 text-[10px] uppercase tracking-wide text-secondary-400">
                                  {label}
                                </p>
                                <p className="m-0 truncate text-[13px] font-medium text-secondary-800">
                                  {value}
                                </p>
                              </div>
                            ))}
                          </div>
                        );
                      },
                    },
                    {
                      title: "Note",
                      key: "note",
                      width: 200,
                      render: (_: unknown, row: any) =>
                        row.details ? (
                          <span className="text-[12px] text-secondary-600">
                            {row.details}
                          </span>
                        ) : (
                          <span className="text-secondary-400">—</span>
                        ),
                    },
                  ]}
                />
              )}
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
          <ProfileTable
            data={purchases}
            rowKey="_id"
            empty={
              <TableEmpty
                icon={Receipt}
                title="No bills yet"
                hint="Nothing has been bought from this supplier."
              />
            }
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
          <ProfileTable
            data={payments}
            rowKey="_id"
            empty={
              <TableEmpty
                icon={Wallet}
                title="No payments recorded"
                hint="Nothing has been handed to this supplier yet."
              />
            }
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
                  title: "Proof",
                  key: "reference",
                  render: (_: unknown, row: any) => {
                    // Whatever the method recorded, in one line — the trx id
                    // and the number it came from, the cheque and its bank.
                    const extras = Object.values(row.details ?? {})
                      .filter(
                        (value) =>
                          typeof value === "string" && value.trim() !== ""
                      )
                      .join(" · ");
                    if (!row.reference && !extras) {
                      return <span className="text-secondary-400">—</span>;
                    }
                    return (
                      <div className="min-w-0">
                        {row.reference && (
                          <p className="m-0 truncate font-mono text-[11px] text-secondary-700">
                            {row.reference}
                          </p>
                        )}
                        {extras && (
                          <span className="text-[11px] text-secondary-400">
                            {extras}
                          </span>
                        )}
                      </div>
                    );
                  },
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
        </SectionCard>
      </div>

      <div className="mt-4">
        <SectionCard
          icon={Package}
          title="What we buy from them"
          subtitle="With the last price paid — no need to open five bills"
        >
          <ProfileTable
            data={byProduct}
            pageSize={10}
            rowKey={(row: any) =>
              `${row._id.product}-${row._id.variantId ?? "none"}`
            }
            empty={
              <TableEmpty
                icon={Package}
                title="Nothing bought yet"
                hint="Items appear here once a bill from this supplier is saved."
              />
            }
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
