import {
  Button,
  DatePicker,
  Empty,
  Input,
  InputNumber,
  Select,
  Table,
  Tag,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import {
  ClipboardList,
  Package,
  Plus,
  Trash2,
  Truck,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import QuickVendorModal from "../../components/modal/purchasing/QuickVendorModal";
import Money from "../../components/shared/Money";
import {
  IProduct,
  useGetProductsQuery,
} from "../../redux/features/inventory/productApi";
import { useCreatePurchaseMutation } from "../../redux/features/purchasing/purchaseApi";
import {
  IVendor,
  useGetVendorsQuery,
} from "../../redux/features/purchasing/vendorApi";
import { PAYMENT_METHOD_LABELS, round2 } from "../../utils/money";
import { SectionCard } from "../Inventory/Products/ProductFormUI";

interface DraftLine {
  key: string;
  product: string;
  variantId: string | null;
  name: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  expiryDate: Dayjs | null;
}

/**
 * One receivable thing in the picker.
 *
 * Declared rather than inferred: the list is built by flat-mapping two shapes
 * (a plain product and a variant), and TypeScript widens that to a union of
 * arrays instead of an array of a union.
 */
interface LineOption {
  value: string;
  label: string;
  product: string;
  variantId: string | null;
  name: string;
  variantName: string;
  sku: string;
  /** What it cost last time — the field is seeded with it. */
  lastCost: number;
}

/**
 * Receiving stock.
 *
 * Every unit the shop has comes through this form, which is why it asks for a
 * cost per line rather than reading one off the product: what a supplier
 * charged this week is the thing being recorded, and it is the only number
 * nobody but the person holding the bill can know.
 *
 * A product picker is right here, unlike at the till — goods arrive in a box
 * with a delivery note, not with a scannable label on every carton.
 */
const PurchaseForm = () => {
  const navigate = useNavigate();

  const [vendor, setVendor] = useState<string | undefined>();
  const [billNo, setBillNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState<Dayjs>(dayjs());
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [otherCost, setOtherCost] = useState(0);
  const [vatPercent, setVatPercent] = useState(0);
  const [paid, setPaid] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [addingVendor, setAddingVendor] = useState(false);

  const { data: vendorData } = useGetVendorsQuery([
    { name: "limit", value: 500 },
    { name: "isActive", value: true },
  ]);
  const { data: productData } = useGetProductsQuery([
    { name: "limit", value: 500 },
    { name: "isActive", value: true },
  ]);

  const vendors: IVendor[] = vendorData?.data?.data || [];
  // Memoised because the option list below depends on it; an inline `|| []`
  // fallback would be a new array each render and rebuild the whole picker.
  const products: IProduct[] = useMemo(
    () => productData?.data?.data || [],
    [productData]
  );
  const [createPurchase, { isLoading: saving }] = useCreatePurchaseMutation();

  /**
   * One option per sellable thing, not per product.
   *
   * A variable product cannot be received as itself — its stock lives on the
   * variants, and the server refuses a line that names the parent.
   */
  const options = useMemo<LineOption[]>(
    () =>
      products.flatMap<LineOption>((product) =>
        product.type === "variable"
          ? (product.variants ?? []).map((variant) => ({
              value: `${product._id}:${variant._id}`,
              label: `${product.name} — ${variant.name} (${variant.sku})`,
              product: product._id,
              variantId: String(variant._id),
              name: product.name,
              variantName: variant.name,
              sku: variant.sku,
              lastCost: (variant.purchasePrice ?? 0) + (variant.cost ?? 0),
            }))
          : [
              {
                value: `${product._id}:`,
                label: `${product.name} (${product.sku})`,
                product: product._id,
                variantId: null,
                name: product.name,
                variantName: "",
                sku: product.sku,
                lastCost: (product.purchasePrice ?? 0) + (product.cost ?? 0),
              },
            ]
      ),
    [products]
  );

  const addLine = (value: string) => {
    const option = options.find((row) => row.value === value);
    if (!option) return;
    if (lines.some((line) => line.key === value)) {
      toast.info("That item is already on this bill — change its quantity");
      return;
    }

    setLines((previous) => [
      ...previous,
      {
        key: value,
        product: option.product,
        variantId: option.variantId,
        name: option.name,
        variantName: option.variantName,
        sku: option.sku,
        quantity: 1,
        // Seeded from what it cost last time, because it usually still does.
        unitCost: option.lastCost || 0,
        expiryDate: null,
      },
    ]);
  };

  const patchLine = (key: string, patch: Partial<DraftLine>) =>
    setLines((previous) =>
      previous.map((line) => (line.key === key ? { ...line, ...patch } : line))
    );

  const totals = useMemo(() => {
    const subtotal = round2(
      lines.reduce((sum, line) => sum + line.unitCost * line.quantity, 0)
    );
    const cappedDiscount = Math.min(discount, subtotal);
    const taxable = round2(subtotal - cappedDiscount + shippingCost + otherCost);
    const vatAmount = round2((taxable * vatPercent) / 100);
    return {
      subtotal,
      discount: cappedDiscount,
      vatAmount,
      grandTotal: round2(taxable + vatAmount),
      units: lines.reduce((sum, line) => sum + line.quantity, 0),
    };
  }, [lines, discount, shippingCost, otherCost, vatPercent]);

  const settled = paid == null ? totals.grandTotal : Math.min(paid, totals.grandTotal);
  const due = round2(Math.max(0, totals.grandTotal - settled));

  const save = async () => {
    if (!vendor) {
      toast.error("Pick a vendor first");
      return;
    }
    if (lines.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    if (lines.some((line) => line.quantity < 1)) {
      toast.error("Every line needs a quantity of at least 1");
      return;
    }

    try {
      const result = await createPurchase({
        vendor,
        billNo,
        items: lines.map((line) => ({
          product: line.product,
          variantId: line.variantId,
          quantity: line.quantity,
          unitCost: line.unitCost,
          expiryDate: line.expiryDate ? line.expiryDate.toISOString() : null,
        })),
        discount,
        shippingCost,
        otherCost,
        vatPercent,
        paid: paid ?? totals.grandTotal,
        paymentMethod,
        purchaseDate: purchaseDate.toISOString(),
        note,
      }).unwrap();

      toast.success(`Saved as ${result.data.purchaseNo} — stock is on the shelf`);
      navigate(`/purchases/${result.data._id}`);
    } catch (error: any) {
      toast.error(error?.data?.message || "Could not save the purchase");
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-94px)] flex-col gap-4 sm:min-h-[calc(100dvh-102px)]">
      <PageMeta
        title="New Purchase - POS & Inventory"
        description="Receive stock against a supplier's bill"
        noindex
      />
      <PageHeader
        title="New Purchase"
        subtitle="Every unit of stock enters here, with what it cost and who supplied it"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Purchasing" },
          { title: "New Purchase" },
        ]}
      />

      <SectionCard
        icon={Truck}
        title="Supplier & Bill"
        subtitle="Whose bill this is, and when the goods arrived"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-[13px] font-medium text-secondary-700">
              Vendor <span className="text-danger">*</span>
            </label>
            <Select
              value={vendor}
              onChange={setVendor}
              showSearch
              optionFilterProp="label"
              placeholder="Select a vendor"
              className="w-full"
              options={vendors.map((row) => ({
                label: `${row.name}${row.company ? ` — ${row.company}` : ""}`,
                value: row._id,
              }))}
              popupRender={(menu) => (
                <>
                  {menu}
                  <div className="border-t border-secondary-100 p-1.5">
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setAddingVendor(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-[7px] border border-primary px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                    >
                      <Plus className="h-4 w-4" />
                      Add new vendor
                    </button>
                  </div>
                </>
              )}
            />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-medium text-secondary-700">
              Their bill number
            </label>
            <Input
              value={billNo}
              onChange={(event) => setBillNo(event.target.value)}
              placeholder="Whatever is printed on it"
            />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-medium text-secondary-700">
              Received on
            </label>
            <DatePicker
              value={purchaseDate}
              onChange={(value) => setPurchaseDate(value ?? dayjs())}
              className="w-full"
              allowClear={false}
            />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-medium text-secondary-700">
              Add item
            </label>
            <Select
              value={null}
              onChange={addLine}
              showSearch
              optionFilterProp="label"
              placeholder="Search a product or variant"
              className="w-full"
              options={options.map((row) => ({
                label: row.label,
                value: row.value,
              }))}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={Package}
        title="Items"
        subtitle={
          totals.units === 1
            ? "1 unit on this bill"
            : `${totals.units} units on this bill`
        }
      >
        {lines.length === 0 ? (
          <Empty description="Nothing added yet. Use the picker above." />
        ) : (
          <Table
            dataSource={lines}
            rowKey="key"
            pagination={false}
            size="small"
            columns={[
              {
                title: "Item",
                key: "name",
                render: (_: unknown, row: DraftLine) => (
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
                title: "Quantity",
                key: "quantity",
                width: 110,
                render: (_: unknown, row: DraftLine) => (
                  <InputNumber
                    min={1}
                    precision={0}
                    value={row.quantity}
                    onChange={(value) =>
                      patchLine(row.key, { quantity: Number(value) || 1 })
                    }
                    className="w-full"
                  />
                ),
              },
              {
                title: "Unit cost",
                key: "unitCost",
                width: 130,
                render: (_: unknown, row: DraftLine) => (
                  <InputNumber
                    min={0}
                    value={row.unitCost}
                    onChange={(value) =>
                      patchLine(row.key, { unitCost: Number(value) || 0 })
                    }
                    className="w-full"
                  />
                ),
              },
              {
                title: "Expiry",
                key: "expiryDate",
                width: 150,
                render: (_: unknown, row: DraftLine) => (
                  <DatePicker
                    value={row.expiryDate}
                    onChange={(value) => patchLine(row.key, { expiryDate: value })}
                    placeholder="Optional"
                    className="w-full"
                  />
                ),
              },
              {
                title: "Line total",
                key: "lineTotal",
                width: 110,
                render: (_: unknown, row: DraftLine) => (
                  <span className="font-semibold text-secondary-800">
                    <Money value={round2(row.unitCost * row.quantity)} />
                  </span>
                ),
              },
              {
                title: "",
                key: "remove",
                width: 50,
                render: (_: unknown, row: DraftLine) => (
                  <Button
                    danger
                    type="text"
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={() =>
                      setLines((previous) =>
                        previous.filter((line) => line.key !== row.key)
                      )
                    }
                  />
                ),
              },
            ]}
          />
        )}
      </SectionCard>

      <SectionCard
        icon={Wallet}
        title="Charges & Payment"
        subtitle="Freight is shared across the lines, so each batch carries what it truly cost"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Bill discount">
            <InputNumber
              min={0}
              value={discount || null}
              placeholder="0"
              onChange={(value) => setDiscount(Number(value) || 0)}
              className="w-full"
            />
          </Field>
          <Field label="Shipping / freight">
            <InputNumber
              min={0}
              value={shippingCost || null}
              placeholder="0"
              onChange={(value) => setShippingCost(Number(value) || 0)}
              className="w-full"
            />
          </Field>
          <Field label="Other charges">
            <InputNumber
              min={0}
              value={otherCost || null}
              placeholder="0"
              onChange={(value) => setOtherCost(Number(value) || 0)}
              className="w-full"
            />
          </Field>
          <Field label="VAT %">
            <InputNumber
              min={0}
              max={100}
              value={vatPercent || null}
              placeholder="0"
              onChange={(value) => setVatPercent(Number(value) || 0)}
              className="w-full"
            />
          </Field>
          <Field label="Payment method">
            <Select
              value={paymentMethod}
              onChange={setPaymentMethod}
              className="w-full"
              options={Object.entries(PAYMENT_METHOD_LABELS).map(
                ([value, label]) => ({ value, label })
              )}
            />
          </Field>
          <Field label="Paid now">
            <InputNumber
              min={0}
              value={paid}
              placeholder={String(totals.grandTotal)}
              onChange={(value) => setPaid(value == null ? null : Number(value))}
              className="w-full"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Note">
              <Input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional"
              />
            </Field>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-6 border-t border-primary/15 pt-4">
          <Summary label="Subtotal" value={totals.subtotal} />
          {totals.discount > 0 && (
            <Summary label="Discount" value={-totals.discount} />
          )}
          {shippingCost + otherCost > 0 && (
            <Summary label="Charges" value={shippingCost + otherCost} />
          )}
          {totals.vatAmount > 0 && (
            <Summary label="VAT" value={totals.vatAmount} />
          )}
          <div className="text-right">
            <p className="m-0 text-xs uppercase tracking-wide text-secondary-500">
              Grand total
            </p>
            <p className="m-0 text-2xl font-bold text-primary-700">
              <Money value={totals.grandTotal} />
            </p>
          </div>
          {due > 0 && (
            <div className="text-right">
              <p className="m-0 text-xs uppercase tracking-wide text-secondary-500">
                Owing
              </p>
              <p className="m-0 text-lg font-bold text-danger">
                <Money value={due} />
              </p>
            </div>
          )}
        </div>
      </SectionCard>

      <div className="sticky bottom-0 z-30 -mx-3 -mb-3 mt-auto flex h-[60px] items-center justify-end gap-3 border-t border-primary/20 bg-white/80 px-3 backdrop-blur-lg sm:-mx-4 sm:-mb-4 sm:px-6">
        <Button onClick={() => navigate("/purchases")} disabled={saving}>
          Cancel
        </Button>
        <Button
          type="primary"
          loading={saving}
          onClick={save}
          icon={<ClipboardList className="h-4 w-4" />}
          className="min-w-44 !border-0 !bg-gradient-to-r !from-primary-600 !to-primary-500 shadow-primary"
        >
          Receive Stock
        </Button>
      </div>

      {addingVendor && (
        <QuickVendorModal
          open
          setOpen={() => setAddingVendor(false)}
          onCreated={(created) => {
            setVendor(created._id);
            setAddingVendor(false);
          }}
        />
      )}
    </div>
  );
};

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="min-w-0">
    <label className="mb-1 block text-[13px] font-medium text-secondary-700">
      {label}
    </label>
    {children}
  </div>
);

const Summary = ({ label, value }: { label: string; value: number }) => (
  <div className="text-right">
    <p className="m-0 text-xs uppercase tracking-wide text-secondary-500">
      {label}
    </p>
    <p className="m-0 font-semibold text-secondary-800">
      <Money value={value} />
    </p>
  </div>
);

export default PurchaseForm;
