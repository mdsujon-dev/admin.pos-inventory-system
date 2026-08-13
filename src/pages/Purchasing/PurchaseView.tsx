import { Button, Tag, Card } from "antd";
import dayjs from "dayjs";
import {
  ArrowLeft,
  Edit,
  Layers,
  Receipt,
  Truck,
  Undo2,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import PermissionGate from "../../components/Common/PermissionGate";
import VendorPaymentModal from "../../components/modal/purchasing/VendorPaymentModal";
import PurchaseReturnModal from "../../components/modal/purchasing/PurchaseReturnModal";
import { useGetReturnsOfPurchaseQuery } from "../../redux/features/purchasing/purchaseReturnApi";
import { Loading } from "../../components/shared/Loading";
import DataTable from "../../components/Table/DataTable";
import Money from "../../components/shared/Money";
import {
  IPurchase,
  IPurchaseItem,
  useGetPurchaseByIdQuery,
} from "../../redux/features/purchasing/purchaseApi";
import { PAYMENT_METHOD_LABELS } from "../../utils/money";
import { MetricCard } from "../../components/Common/MetricCard";

/**
 * One supplier bill, and the batches it put on the shelf.
 *
 * Editable only while none of its stock has been sold — rewriting a bill whose
 * goods are gone would change the cost of goods on invoices already printed.
 * Paying it down is always open, and uses the same payment form the vendor's
 * own page does, pre-pointed at this bill.
 */
const PurchaseView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);
  const [returning, setReturning] = useState(false);

  const { data: returnData } = useGetReturnsOfPurchaseQuery(id as string, {
    skip: !id,
  });
  const returns = returnData?.data ?? [];

  const { data, isFetching } = useGetPurchaseByIdQuery(id as string, {
    skip: !id,
  });

  if (isFetching) return <Loading />;

  const purchase: IPurchase | undefined = data?.data;
  if (!purchase) return null;

  const vendor =
    typeof purchase.vendor === "object" ? purchase.vendor : null;

  return (
    <div>
      <PageMeta
        title={`${purchase.purchaseNo} - POS & Inventory`}
        description="Purchase bill"
        noindex
      />
      <PageHeader
        title={purchase.purchaseNo}
        subtitle={`${purchase.vendorName}${
          purchase.billNo ? ` · their bill ${purchase.billNo}` : ""
        }`}
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Purchasing" },
          { title: "Purchase Bills", path: "/purchases" },
          { title: purchase.purchaseNo },
        ]}
        extra={
          <div className="flex gap-2">
            <Button
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate("/purchases")}
            >
              All bills
            </Button>
            <PermissionGate module="Purchases" action="Update">
              <Button
                icon={<Edit className="h-4 w-4" />}
                onClick={() => navigate(`/purchases/${purchase._id}/edit`)}
              >
                Edit
              </Button>
            </PermissionGate>
            {/* The natural door: somebody looking at a faulty delivery is
                already on the bill it came in on. */}
            <PermissionGate module="Purchase Returns" action="Create">
              <Button
                icon={<Undo2 className="h-4 w-4" />}
                onClick={() => setReturning(true)}
              >
                Send goods back
              </Button>
            </PermissionGate>
            {purchase.due > 0 && (
              <PermissionGate module="Purchases" action="Update">
                <Button
                  type="primary"
                  icon={<Wallet className="h-4 w-4" />}
                  onClick={() => setPaying(true)}
                  className="!border-0 !bg-gradient-to-r !from-primary-600 !to-primary-500 shadow-primary"
                >
                  Record Payment
                </Button>
              </PermissionGate>
            )}
          </div>
        }
      />

      {/* What has already gone back off this bill. On the sheet rather than a
          tab away: a bill showing its original total while half of it was
          returned is a bill that will be argued over. */}
      {returns.length > 0 && (
        <div className="mb-4 rounded-md border border-[#f59e0b55] bg-[#fffbeb] px-4 py-3">
          <p className="m-0 mb-1 text-[12px] font-semibold uppercase tracking-wide text-[#92400e]">
            Sent back to the supplier
          </p>
          {returns.map((row: any) => (
            <div
              key={row._id}
              className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f59e0b33] py-1.5 text-[13px] first:border-0"
            >
              <span className="font-mono font-semibold text-secondary-800">
                {row.returnNo}
              </span>
              <span className="text-secondary-500">
                {dayjs(row.returnedAt).format("DD MMM YYYY")} ·{" "}
                {row.totalQuantity} unit(s)
              </span>
              <span className="text-secondary-500">
                {row.refundAmount > 0 ? "Money back" : "Taken off the bill"}
              </span>
              <span className="font-bold text-[#92400e]">
                − <Money value={row.totalCost} />
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Receipt}
          label="Bill total"
          accent="#10b981"
          value={<Money value={purchase.grandTotal} />}
        />
        <MetricCard
          icon={Wallet}
          label="Paid"
          accent="#3b82f6"
          value={<Money value={purchase.paid} />}
        />
        <MetricCard
          icon={Truck}
          label="Owing"
          accent={purchase.due > 0 ? "#f43f5e" : "#10b981"}
          value={<Money value={purchase.due} />}
        />
        <MetricCard
          icon={Layers}
          label="Units received"
          accent="#8b5cf6"
          hint={dayjs(purchase.purchaseDate).format("DD MMM YYYY")}
          value={purchase.items.reduce((sum, item) => sum + item.quantity, 0)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card className="!rounded-xl !border-secondary-100 shadow-card" styles={{ body: { padding: '20px' } }}>
            <div className="mb-4">
              <h3 className="m-0 text-[16px] font-semibold text-secondary-800">Items received</h3>
              <p className="m-0 mt-1 text-xs text-secondary-500">Landed cost includes this line's share of the freight</p>
            </div>
            <DataTable
              data={purchase.items}
              rowKey={(row: IPurchaseItem) => row._id ?? row.sku}
              isPaginate={false}
              columns={[
                {
                  title: "Item",
                  key: "name",
                  render: (_: unknown, row: IPurchaseItem) => (
                    <div className="min-w-0">
                      <p className="m-0 truncate text-sm font-medium text-secondary-800">
                        {row.name}
                        {row.variantName && (
                          <Tag className="!ml-2 !border-primary-200 !bg-primary-50 !text-[11px] !text-primary-700">
                            {row.variantName}
                          </Tag>
                        )}
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
                  render: (_: unknown, row: IPurchaseItem) => row.quantity,
                },
                {
                  title: "Unit cost",
                  key: "unitCost",
                  width: 110,
                  render: (_: unknown, row: IPurchaseItem) => <Money value={row.unitCost} />,
                },
                {
                  title: "Landed",
                  key: "landed",
                  width: 120,
                  render: (_: unknown, row: IPurchaseItem) => (
                    <div>
                      <Money value={row.unitCost + row.landedExtra} />
                      {row.landedExtra > 0 && (
                        <p className="m-0 text-[11px] text-secondary-400">
                          +<Money value={row.landedExtra} /> freight
                        </p>
                      )}
                    </div>
                  ),
                },
                {
                  title: "Expiry",
                  key: "expiryDate",
                  width: 110,
                  render: (_: unknown, row: IPurchaseItem) =>
                    row.expiryDate ? (
                      dayjs(row.expiryDate).format("DD MMM YYYY")
                    ) : (
                      <span className="text-secondary-400">—</span>
                    ),
                },
                {
                  title: "Total",
                  key: "lineTotal",
                  width: 110,
                  render: (_: unknown, row: IPurchaseItem) => (
                    <span className="font-semibold">
                      <Money value={row.lineTotal} />
                    </span>
                  ),
                },
              ]}
            />
          </Card>
        </div>

        <Card className="!rounded-xl !border-secondary-100 shadow-card" styles={{ body: { padding: '20px' } }}>
          <div className="mb-4">
            <h3 className="m-0 text-[16px] font-semibold text-secondary-800">Bill</h3>
            <p className="m-0 mt-1 text-xs text-secondary-500">How the total was reached</p>
          </div>
          <div className="space-y-1.5 text-sm">
            <Row label="Subtotal" value={purchase.subtotal} />
            {purchase.discount > 0 && (
              <Row label="Discount" value={-purchase.discount} />
            )}
            {purchase.shippingCost > 0 && (
              <Row label="Shipping" value={purchase.shippingCost} />
            )}
            {purchase.otherCost > 0 && (
              <Row label="Other charges" value={purchase.otherCost} />
            )}
            {purchase.vatAmount > 0 && (
              <Row label={`VAT ${purchase.vatPercent}%`} value={purchase.vatAmount} />
            )}
            <div className="flex items-center justify-between border-t border-primary/20 pt-2 text-base font-bold text-primary-700">
              <span>Total</span>
              <Money value={purchase.grandTotal} />
            </div>
            <Row label="Paid" value={purchase.paid} />
            {purchase.due > 0 && (
              <div className="flex items-center justify-between font-semibold text-danger">
                <span>Owing</span>
                <Money value={purchase.due} />
              </div>
            )}
          </div>

          <div className="mt-4 space-y-1 border-t border-secondary-100 pt-3 text-xs text-secondary-500">
            <p className="m-0">
              Method:{" "}
              {PAYMENT_METHOD_LABELS[purchase.paymentMethod] ??
                purchase.paymentMethod}
            </p>
            {vendor?.phone && <p className="m-0">Vendor: {vendor.phone}</p>}
            {purchase.createdByName && (
              <p className="m-0">Entered by {purchase.createdByName}</p>
            )}
            {purchase.note && <p className="m-0 pt-1">{purchase.note}</p>}
          </div>
        </Card>
      </div>

      {/*
        The same payment screen the vendor's own page uses, pre-pointed at this
        bill. Paying from where the debt is written down is the natural place
        to do it, and using one form for both means a payment made here carries
        the method, date and reference a payment made there does.
      */}
      {paying && vendor && (
        <VendorPaymentModal
          open
          setOpen={() => setPaying(false)}
          vendor={{
            _id: vendor._id,
            name: vendor.name,
            totalDue: purchase.due,
          }}
          bills={[
            {
              _id: purchase._id,
              purchaseNo: purchase.purchaseNo,
              billNo: purchase.billNo,
              purchaseDate: purchase.purchaseDate,
              grandTotal: purchase.grandTotal,
              due: purchase.due,
            },
          ]}
        />
      )}

      {returning && id && (
        <PurchaseReturnModal
          purchaseId={id}
          open={returning}
          setOpen={setReturning}
        />
      )}
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center justify-between text-secondary-600">
    <span>{label}</span>
    <Money value={value} />
  </div>
);

export default PurchaseView;
