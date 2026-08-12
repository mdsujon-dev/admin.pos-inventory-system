import { Button, Table, Tag } from "antd";
import dayjs from "dayjs";
import { ArrowLeft, Edit, Layers, Receipt, Truck, Wallet } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import PermissionGate from "../../components/Common/PermissionGate";
import VendorPaymentModal from "../../components/modal/purchasing/VendorPaymentModal";
import { Loading } from "../../components/shared/Loading";
import Money from "../../components/shared/Money";
import {
  IPurchase,
  useGetPurchaseByIdQuery,
} from "../../redux/features/purchasing/purchaseApi";
import { PAYMENT_METHOD_LABELS } from "../../utils/money";
import { SectionCard, StatTile } from "../Inventory/Products/ProductFormUI";

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

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Receipt} label="Bill total" tone="brand">
          <Money value={purchase.grandTotal} />
        </StatTile>
        <StatTile icon={Wallet} label="Paid" tone="brand">
          <Money value={purchase.paid} />
        </StatTile>
        <StatTile
          icon={Truck}
          label="Owing"
          tone={purchase.due > 0 ? "danger" : "muted"}
        >
          <Money value={purchase.due} />
        </StatTile>
        <StatTile
          icon={Layers}
          label="Units received"
          tone="muted"
          note={dayjs(purchase.purchaseDate).format("DD MMM YYYY")}
        >
          {purchase.items.reduce((sum, item) => sum + item.quantity, 0)}
        </StatTile>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionCard
            icon={Layers}
            title="Items received"
            subtitle="Landed cost includes this line's share of the freight"
          >
            <Table
              dataSource={purchase.items}
              rowKey={(row) => row._id ?? row.sku}
              pagination={false}
              size="small"
              columns={[
                {
                  title: "Item",
                  key: "name",
                  render: (_: unknown, row) => (
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
                  render: (_: unknown, row) => row.quantity,
                },
                {
                  title: "Unit cost",
                  key: "unitCost",
                  width: 110,
                  render: (_: unknown, row) => <Money value={row.unitCost} />,
                },
                {
                  title: "Landed",
                  key: "landed",
                  width: 120,
                  render: (_: unknown, row) => (
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
                  render: (_: unknown, row) =>
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
                  render: (_: unknown, row) => (
                    <span className="font-semibold">
                      <Money value={row.lineTotal} />
                    </span>
                  ),
                },
              ]}
            />
          </SectionCard>
        </div>

        <SectionCard icon={Wallet} title="Bill" subtitle="How the total was reached">
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
        </SectionCard>
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
