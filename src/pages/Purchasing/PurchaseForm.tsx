import {
  Alert,
  Button,
  DatePicker,
  Empty,
  Input,
  InputNumber,
  Segmented,
  Select,
  Tag,
  Tooltip,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import {
  ClipboardList,
  Info,
  Package,
  Plus,
  Trash2,
  Truck,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import { Loading } from "../../components/shared/Loading";
import QuickVendorModal from "../../components/modal/purchasing/QuickVendorModal";
import DataTable from "../../components/Table/DataTable";
import Money from "../../components/shared/Money";
import {
  IProduct,
  useGetProductsQuery,
} from "../../redux/features/inventory/productApi";
import {
  useCreatePurchaseMutation,
  useGetPurchaseByIdQuery,
  useGetPurchaseEditableScopeQuery,
  useUpdatePurchaseMutation,
} from "../../redux/features/purchasing/purchaseApi";
import {
  IVendor,
  useGetVendorsQuery,
} from "../../redux/features/purchasing/vendorApi";
import { PAYMENT_METHOD_LABELS, round2 } from "../../utils/money";
import { SectionCard } from "../Inventory/Products/ProductFormUI";

type PayMode = "now" | "credit";

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
  const { id } = useParams();
  const isEditing = Boolean(id);

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
  /** Paying at the counter, or taking the goods and settling later. */
  const [payMode, setPayMode] = useState<PayMode>("now");
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
  const [createPurchase, { isLoading: creating }] = useCreatePurchaseMutation();
  const [updatePurchase, { isLoading: updating }] = useUpdatePurchaseMutation();
  const saving = creating || updating;

  const { data: billData, isFetching: loadingBill } = useGetPurchaseByIdQuery(
    id as string,
    { skip: !isEditing }
  );
  const { data: scopeData } = useGetPurchaseEditableScopeQuery(id as string, {
    skip: !isEditing,
  });
  const bill = billData?.data;
  /**
   * Once any of a bill's stock has been sold, its goods are frozen — rewriting
   * them would change the cost of goods on invoices already in a customer's
   * hand. Only the bill number and note stay open.
   */
  const detailsOnly = scopeData?.data?.scope === "details";

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

  const handleItemsChange = (values: string[]) => {
    setLines((previous) => {
      const keptLines = previous.filter((line) => values.includes(line.key));
      const existingKeys = keptLines.map((line) => line.key);
      const newKeys = values.filter((v) => !existingKeys.includes(v));

      const newLines = newKeys.map((key) => {
        const option = options.find((row) => row.value === key);
        return {
          key,
          product: option!.product,
          variantId: option!.variantId,
          name: option!.name,
          variantName: option!.variantName,
          sku: option!.sku,
          quantity: 1,
          unitCost: option!.lastCost || 0,
          expiryDate: null,
        };
      });

      return [...keptLines, ...newLines];
    });
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

  /**
   * On credit nothing is handed over, so the whole bill is owing. Paying now
   * with the field left blank means paying it off in full.
   */
  const settled =
    payMode === "credit"
      ? 0
      : paid == null
      ? totals.grandTotal
      : Math.min(paid, totals.grandTotal);
  const due = round2(Math.max(0, totals.grandTotal - settled));

  const vendorName = vendors.find((row) => row._id === vendor)?.name ?? "";

  /**
   * Fills the form from the bill being edited.
   *
   * Keyed on the bill's id rather than run once: the read is async, so the
   * form is mounted and empty before the data lands.
   */
  useEffect(() => {
    if (!bill) return;
    setVendor(typeof bill.vendor === "string" ? bill.vendor : bill.vendor._id);
    setBillNo(bill.billNo ?? "");
    setPurchaseDate(dayjs(bill.purchaseDate));
    setDiscount(bill.discount ?? 0);
    setShippingCost(bill.shippingCost ?? 0);
    setOtherCost(bill.otherCost ?? 0);
    setVatPercent(bill.vatPercent ?? 0);
    setPaid(bill.paid ?? null);
    setPaymentMethod(bill.paymentMethod ?? "cash");
    // Nothing paid on a saved bill means it was taken on credit.
    setPayMode((bill.paid ?? 0) > 0 ? "now" : "credit");
    setNote(bill.note ?? "");
    setLines(
      (bill.items ?? []).map((item: any) => ({
        key: `${item.product}:${item.variantId ?? ""}`,
        product: item.product,
        variantId: item.variantId ?? null,
        name: item.name,
        variantName: item.variantName ?? "",
        sku: item.sku,
        quantity: item.quantity,
        // The bill's own price, without the freight share — that is
        // recalculated from the shipping figure on save.
        unitCost: item.unitCost,
        expiryDate: item.expiryDate ? dayjs(item.expiryDate) : null,
      }))
    );
  }, [bill]);

  const save = async () => {
    if (!vendor) {
      // On credit the vendor is the only record of who is owed, so the wording
      // says why rather than just refusing.
      toast.error(
        payMode === "credit"
          ? "Pick a vendor — a bill left owing needs somebody to owe it to"
          : "Pick a vendor first"
      );
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

    const payload = {
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
      paid: settled,
      paymentMethod,
      purchaseDate: purchaseDate.toISOString(),
      note,
    };

    try {
      if (isEditing) {
        const result = await updatePurchase({
          id: id as string,
          data: payload,
        }).unwrap();
        toast.success(`${result.data.purchaseNo} updated — batches rebuilt`);
        navigate(`/purchases/${id}`);
        return;
      }

      const result = await createPurchase(payload).unwrap();
      toast.success(`Saved as ${result.data.purchaseNo} — stock is on the shelf`);
      navigate(`/purchases/${result.data._id}`);
    } catch (error: any) {
      toast.error(error?.data?.message || "Could not save the purchase");
    }
  };

  if (isEditing && loadingBill) return <Loading />;

  return (
    <div className="flex min-h-[calc(100dvh-94px)] flex-col gap-4 sm:min-h-[calc(100dvh-102px)]">
      <PageMeta
        title={`${isEditing ? "Edit" : "New"} Purchase - POS & Inventory`}
        description="Receive stock against a supplier's bill"
        noindex
      />
      {detailsOnly && (
        <Alert
          type="warning"
          showIcon
          message="Some of this stock has already been sold"
          description="The goods and costs on this bill are frozen — changing them would rewrite the cost of goods on invoices that are already printed. The bill number and note can still be saved; correct anything else with a purchase return."
        />
      )}
      <PageHeader
        title={isEditing ? `Edit ${bill?.purchaseNo ?? "Purchase"}` : "New Purchase"}
        subtitle="Every unit of stock enters here, with what it cost and who supplied it"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Purchasing" },
          { title: "New Purchase" },
        ]}
      />

      <SectionCard
        icon={ClipboardList}
        title="Purchase Information"
        subtitle="Complete the purchase by filling in the details below"
      >
        {/* --- Section 1: Supplier & Bill --- */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b border-secondary-100">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-secondary-900 leading-tight">Supplier & Bill</h3>
              <p className="text-[13px] text-secondary-500 leading-tight mt-0.5">Whose bill this is, and when the goods arrived</p>
            </div>
          </div>
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
            <label className="mb-1 flex items-center gap-1.5 text-[13px] font-medium text-secondary-700">
              Their bill number
              <Tooltip title="The invoice or memo number provided by the supplier. Crucial for reconciliation and tracking.">
                <Info className="h-[14px] w-[14px] text-secondary-400" />
              </Tooltip>
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
              mode="multiple"
              value={lines.map((line) => line.key)}
              onChange={handleItemsChange}
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
        </div>

        {/* --- Section 2: Items --- */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b border-secondary-100">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-secondary-900 leading-tight">Items</h3>
              <p className="text-[13px] text-secondary-500 leading-tight mt-0.5">
                {totals.units === 1 ? "1 unit on this bill" : `${totals.units} units on this bill`}
              </p>
            </div>
          </div>
        {lines.length === 0 ? (
          <Empty description="Nothing added yet. Use the picker above." />
        ) : (
          <DataTable
            data={lines}
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
                    type="number"
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
                    type="number"
                    min={0}
                    value={row.unitCost || null}
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
        </div>

        {/* --- Section 3: Charges & Payment --- */}
        <div>
          <div className="flex items-center gap-3 mb-5 pb-3 border-b border-secondary-100">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-secondary-900 leading-tight">Charges & Payment</h3>
              <p className="text-[13px] text-secondary-500 leading-tight mt-0.5">Freight is shared across the lines, so each batch carries what it truly cost</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field
            label="Bill discount"
            tooltip="Flat discount applied to the entire bill by the vendor"
          >
            <InputNumber
              type="number"
              min={0}
              value={discount || null}
              placeholder="0"
              onChange={(value) => setDiscount(Number(value) || 0)}
              className="w-full"
            />
          </Field>
          <Field
            label="Shipping / freight"
            tooltip="Transportation or delivery cost to bring the products from the vendor"
          >
            <InputNumber
              type="number"
              min={0}
              value={shippingCost || null}
              placeholder="0"
              onChange={(value) => setShippingCost(Number(value) || 0)}
              className="w-full"
            />
          </Field>
          <Field label="Other charges">
            <InputNumber
              type="number"
              min={0}
              value={otherCost || null}
              placeholder="0"
              onChange={(value) => setOtherCost(Number(value) || 0)}
              className="w-full"
            />
          </Field>
          <Field label="VAT %">
            <InputNumber
              type="number"
              min={0}
              max={100}
              value={vatPercent || null}
              placeholder="0"
              onChange={(value) => setVatPercent(Number(value) || 0)}
              className="w-full"
            />
          </Field>
          {/*
            Paying now and buying on credit are two different acts, not one
            field with a zero in it. Choosing credit closes the payment fields
            rather than greying them, because there is nothing to say: no
            method was used and no money moved. The vendor becomes the only
            record of who is owed, which is why the bill cannot be saved
            without one.
          */}
          <Field label="How is this bill settled?">
            <Segmented
              block
              value={payMode}
              onChange={(value) => setPayMode(value as PayMode)}
              options={[
                { label: "Paying now", value: "now" },
                { label: "On credit", value: "credit" },
              ]}
            />
          </Field>

          {payMode === "now" ? (
            <>
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
              <Field
                label="Paid now"
                tooltip="Leave blank to pay the bill in full"
              >
                <InputNumber
                  type="number"
                  min={0}
                  max={totals.grandTotal}
                  value={paid}
                  placeholder={String(totals.grandTotal)}
                  onChange={(value) =>
                    setPaid(value == null ? null : Number(value))
                  }
                  className="w-full"
                />
              </Field>
            </>
          ) : (
            <div className="sm:col-span-2">
              {/* A blank label, so this lines up with the control beside it —
                  without one the message starts where the other fields' labels
                  are and sits a row too high. */}
              <label
                aria-hidden
                className="mb-1 block select-none text-[13px] font-medium text-transparent"
              >
                &nbsp;
              </label>
              <p className="m-0 flex min-h-[32px] items-center rounded-lg bg-danger/5 px-3 text-[13px] leading-snug text-danger">
                The whole bill stays owing to {vendorName || "this vendor"}. Pay
                it later from the bill or their page.
              </p>
            </div>
          )}

          <div className="sm:col-span-2">
            <Field label="Note">
              <Input.TextArea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional"
                className="w-full"
                autoSize={{ minRows: 2, maxRows: 5 }}
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

          {/*
            Paid and owing are always on show, not only once a balance exists.
            Buying on credit is the normal way a shop stocks up, and a figure
            that appears only when it is non-zero is one nobody looks for —
            which is how a bill gets saved as fully paid by accident.
          */}
          <div className="text-right">
            <p className="m-0 text-xs uppercase tracking-wide text-secondary-500">
              Paying now
            </p>
            <p className="m-0 text-lg font-semibold text-secondary-800">
              <Money value={settled} />
            </p>
          </div>
          <div className="text-right">
            <p className="m-0 text-xs uppercase tracking-wide text-secondary-500">
              Owing
            </p>
            <p
              className={`m-0 text-lg font-bold ${
                due > 0 ? "text-danger" : "text-secondary-400"
              }`}
            >
              <Money value={due} />
            </p>
          </div>
          <Tag
            className={`!m-0 ${
              due > 0
                ? "!border-danger/30 !bg-danger/10 !text-danger"
                : "!border-primary-200 !bg-primary-50 !text-primary-700"
            }`}
          >
            {due <= 0
              ? "Settled"
              : settled > 0
              ? "Partly paid"
              : "Fully on credit"}
          </Tag>
        </div>
        </div>
      </SectionCard>

      <div className="sticky bottom-0 z-30 -mx-3 -mb-3 mt-auto flex h-[70px] items-center justify-end gap-3 border-t border-primary/20 bg-white/80 px-3 backdrop-blur-lg sm:-mx-4 sm:-mb-4 sm:px-6">
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
          {isEditing ? "Save Changes" : "Receive Stock"}
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
  hint,
  tooltip,
  children,
}: {
  label: string;
  hint?: string;
  tooltip?: string;
  children: React.ReactNode;
}) => (
  <div className="min-w-0">
    <label className="mb-1 flex items-center gap-1.5 text-[13px] font-medium text-secondary-700">
      {label}
      {tooltip && (
        <Tooltip title={tooltip}>
          <Info className="h-3.5 w-3.5 text-secondary-400" />
        </Tooltip>
      )}
    </label>
    {children}
    {hint && (
      <p className="m-0 mt-1 text-[11px] leading-tight text-secondary-400">
        {hint}
      </p>
    )}
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
