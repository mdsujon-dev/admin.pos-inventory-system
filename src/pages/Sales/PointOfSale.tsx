import { Button, Empty, Input, InputNumber, Select, Tag, Tooltip } from "antd";
import {
  AlertTriangle,
  LayoutGrid,
  Loader2,
  Minus,
  PauseCircle,
  Plus,
  Receipt,
  ScanLine,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PageMeta from "../../components/Common/PageMeta";
import Money from "../../components/shared/Money";
import { config } from "../../config";
import { ICustomer } from "../../redux/features/sales/customerApi";
import {
  useCreateSaleMutation,
  useScanCodeMutation,
} from "../../redux/features/sales/saleApi";
import { PAYMENT_METHOD_LABELS, round2 } from "../../utils/money";
import CustomerPanel, { NewCustomerDraft } from "./CustomerPanel";
import ProductPicker from "./ProductPicker";
import { CartLine, useCart } from "./useCart";

/** A cart parked while another customer is served. */
interface HeldSale {
  id: string;
  label: string;
  lines: CartLine[];
  billDiscount: number;
  vatPercent: number;
  heldAt: number;
}

const imageUrl = (path?: string | null) =>
  !path ? null : path.startsWith("http") ? path : `${config.image_access_url}${path}`;

/**
 * The till.
 *
 * Built around one input. A hardware barcode scanner is a keyboard that types
 * very fast and presses Enter, so the scan box and the "type the code" box are
 * the same box — which is also why it takes focus back after every action:
 * a scanner fires wherever the caret happens to be, and a cashier will not
 * notice it landed in the discount field until the numbers are wrong.
 *
 * The picker beside it exists for the cases a scanner cannot cover: a peeled
 * label, loose goods, a customer changing their mind mid-queue. It does not
 * take a shortcut around the checks — it hands back a code and that code goes
 * through the same scan call, so expired, switched-off and out-of-stock items
 * are refused whichever way they were reached.
 */
const PointOfSale = () => {
  const navigate = useNavigate();
  const scanRef = useRef<HTMLInputElement>(null);

  const [code, setCode] = useState("");
  const [refusal, setRefusal] = useState<string | null>(null);
  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [draft, setDraft] = useState<NewCustomerDraft | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [tendered, setTendered] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [held, setHeld] = useState<HeldSale[]>([]);
  const [picking, setPicking] = useState(false);

  const cart = useCart();
  const [scanCode, { isLoading: scanning }] = useScanCodeMutation();
  const [createSale, { isLoading: saving }] = useCreateSaleMutation();

  const focusScanner = () => scanRef.current?.focus();
  useEffect(focusScanner, []);

  /**
   * One way in, whether the code was scanned or picked off a tile.
   *
   * Keeping a single path means there is one place where stock, expiry and
   * price are decided, and no chance of the picker quietly becoming the
   * lenient one.
   */
  const addByCode = async (value: string) => {
    if (!value) return;
    setRefusal(null);

    try {
      const result = await scanCode(value).unwrap();
      const outcome = cart.addHit(result.data);
      if (!outcome.ok) setRefusal(outcome.message ?? null);
    } catch (error: any) {
      // Shown in place rather than as a toast: the cashier is looking at the
      // scan box, and a message in the corner of the screen is a message that
      // gets scanned over.
      setRefusal(error?.data?.message || `Nothing matches "${value}"`);
    } finally {
      focusScanner();
    }
  };

  const handleScan = () => {
    const value = code.trim();
    if (!value) return;
    setCode("");
    addByCode(value);
  };

  const grand = cart.totals.grandTotal;
  const paid = tendered == null ? grand : Math.min(tendered, grand);
  const change = tendered == null ? 0 : round2(Math.max(0, tendered - grand));
  const due = round2(Math.max(0, grand - paid));

  const hold = () => {
    if (cart.lines.length === 0) return;
    setHeld((previous) => [
      {
        id: `${Date.now()}`,
        label: customer?.name || draft?.name || `Cart ${previous.length + 1}`,
        lines: cart.lines,
        billDiscount: cart.billDiscount,
        vatPercent: cart.vatPercent,
        heldAt: Date.now(),
      },
      ...previous,
    ]);
    resetSale();
    toast.info("Cart held — pick it back up from the strip above");
  };

  const resume = (sale: HeldSale) => {
    if (cart.lines.length > 0) {
      toast.error("Finish or hold the current cart first");
      return;
    }
    cart.restore(sale);
    setHeld((previous) => previous.filter((row) => row.id !== sale.id));
    focusScanner();
  };

  const resetSale = () => {
    cart.clear();
    setCustomer(null);
    setDraft(null);
    setTendered(null);
    setNote("");
    setRefusal(null);
    focusScanner();
  };

  const complete = async () => {
    if (cart.lines.length === 0) {
      toast.error("Scan something first");
      return;
    }
    if (due > 0 && !customer && !draft) {
      toast.error("An unpaid sale needs a customer — there is nobody to collect from");
      return;
    }

    try {
      const result = await createSale({
        items: cart.toPayloadItems(),
        ...(customer ? { customer: customer._id } : {}),
        ...(!customer && draft ? { newCustomer: draft } : {}),
        billDiscount: cart.totals.billDiscount,
        vatPercent: cart.vatPercent,
        paid: tendered ?? grand,
        paymentMethod,
        note,
      }).unwrap();

      toast.success(`Saved as ${result.data.invoiceNo}`);
      resetSale();
      navigate(`/sales/invoices/${result.data._id}?print=1`);
    } catch (error: any) {
      toast.error(error?.data?.message || "Could not complete the sale");
      focusScanner();
    }
  };

  // Enter is the scanner's own key, so the save shortcut is F9 — the one a
  // till keyboard has and a barcode never sends.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "F9") {
        event.preventDefault();
        complete();
      }
      if (event.key === "F2") {
        event.preventDefault();
        focusScanner();
      }
      if (event.key === "F4") {
        event.preventDefault();
        setPicking(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex min-h-[calc(100dvh-94px)] flex-col gap-3 sm:min-h-[calc(100dvh-102px)]">
      <PageMeta
        title="Point of Sale - POS & Inventory"
        description="Scan, price and complete a sale"
        noindex
      />

      {/* Scan bar. Full width and simple. */}
      <div className="rounded-2xl border border-secondary-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary">
            <ScanLine className="h-5 w-5" />
          </span>
          <div className="min-w-[240px] flex-1">
            <Input
              ref={scanRef as never}
              size="large"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              onPressEnter={handleScan}
              placeholder="Scan a barcode, or type the code and press Enter"
              suffix={
                scanning ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : null
              }
              className="!rounded-xl"
            />
          </div>

          <Button
            size="large"
            icon={<LayoutGrid className="h-4 w-4" />}
            onClick={() => setPicking(true)}
            className="!rounded-xl !border-primary-200 !text-primary-700"
          >
            Browse · F4
          </Button>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="m-0 text-[11px] uppercase tracking-wide text-secondary-500">
                Items
              </p>
              <p className="m-0 text-xl font-semibold leading-tight text-secondary-800">
                {cart.totals.unitCount}
              </p>
            </div>
            <div className="text-right">
              <p className="m-0 text-[11px] uppercase tracking-wide text-secondary-500">
                Total
              </p>
              <p className="m-0 text-xl font-semibold leading-tight text-primary">
                <Money value={grand} />
              </p>
            </div>
          </div>
        </div>

        {refusal && (
          <div className="relative mt-2 flex items-start gap-2 rounded-lg bg-white/95 px-3 py-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <p className="m-0 flex-1 text-sm text-danger">{refusal}</p>
            <button
              type="button"
              onClick={() => setRefusal(null)}
              className="text-secondary-400 hover:text-secondary-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {held.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-secondary-100 bg-white px-3 py-2">
          <span className="text-xs font-medium text-secondary-500">
            Held carts
          </span>
          {held.map((sale) => (
            <Button
              key={sale.id}
              size="small"
              icon={<PauseCircle className="h-3.5 w-3.5" />}
              onClick={() => resume(sale)}
            >
              {sale.label} · {sale.lines.length}
            </Button>
          ))}
        </div>
      )}

      <div className="grid flex-1 gap-3 xl:grid-cols-3">
        {/* Cart */}
        <div className="flex min-h-[300px] flex-col rounded-xl border border-secondary-100 bg-white xl:col-span-2">
          {cart.lines.length === 0 ? (
            <div className="grid flex-1 place-items-center p-8">
              <div className="text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-50 text-primary">
                  <ScanLine className="h-6 w-6" />
                </span>
                <p className="m-0 mt-3 text-[15px] font-semibold text-secondary-700">
                  Ready when you are
                </p>
                <p className="m-0 mt-1 text-[13px] text-secondary-500">
                  Scan an item, or press{" "}
                  <kbd className="rounded border border-secondary-200 bg-secondary-50 px-1.5 py-0.5 font-mono text-[11px]">
                    F4
                  </kbd>{" "}
                  to browse the shelf.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-secondary-100">
              {cart.lines.map((line) => {
                const src = imageUrl(line.image);
                const lineTotal = round2(
                  line.price * line.quantity - line.discount
                );
                return (
                  <div key={line.key} className="flex gap-3 p-3">
                    {src ? (
                      <img
                        src={src}
                        alt={line.name}
                        className="h-14 w-14 shrink-0 rounded-lg border border-secondary-200 object-cover"
                      />
                    ) : (
                      <div className="h-14 w-14 shrink-0 rounded-lg bg-secondary-100" />
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="m-0 truncate text-sm font-semibold text-secondary-800">
                        {line.name}
                        {line.variantName && (
                          <Tag className="!ml-2 !border-primary-200 !bg-primary-50 !text-[11px] !text-primary-700">
                            {line.variantName}
                          </Tag>
                        )}
                      </p>
                      <p className="m-0 font-mono text-[11px] text-secondary-400">
                        {line.sku}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-secondary-500">
                          <Money value={line.price} />
                          {line.unit ? ` / ${line.unit}` : ""}
                        </span>
                        {line.price < line.listPrice && (
                          <Tag className="!m-0 !border-primary-200 !bg-primary-50 !text-[10px] !text-primary-700">
                            Offer
                          </Tag>
                        )}
                        <InputNumber
                          type="number"
                          size="small"
                          min={0}
                          value={line.discount || null}
                          placeholder="Discount"
                          onChange={(value) =>
                            cart.setDiscount(line.key, Number(value) || 0)
                          }
                          className="!w-24"
                        />
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end justify-between">
                      <div className="flex items-center gap-1">
                        <Button
                          size="small"
                          icon={<Minus className="h-3 w-3" />}
                          onClick={() =>
                            cart.setQuantity(line.key, line.quantity - 1)
                          }
                          disabled={line.quantity <= 1}
                        />
                        <span className="w-8 text-center text-sm font-semibold">
                          {line.quantity}
                        </span>
                        <Tooltip
                          title={
                            line.quantity >= line.available
                              ? `Only ${line.available} in stock`
                              : ""
                          }
                        >
                          <Button
                            size="small"
                            icon={<Plus className="h-3 w-3" />}
                            onClick={() =>
                              cart.setQuantity(line.key, line.quantity + 1)
                            }
                            disabled={line.quantity >= line.available}
                          />
                        </Tooltip>
                        <Button
                          size="small"
                          danger
                          type="text"
                          icon={<Trash2 className="h-3.5 w-3.5" />}
                          onClick={() => cart.removeLine(line.key)}
                        />
                      </div>
                      <p className="m-0 text-sm font-semibold text-secondary-800">
                        <Money value={lineTotal} />
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Customer, money, and the button that ends it */}
        <div className="flex flex-col gap-3">
          <CustomerPanel
            customer={customer}
            onPick={setCustomer}
            draft={draft}
            onDraft={setDraft}
          />

          <div className="rounded-xl border border-secondary-100 bg-white p-3">
            <div className="space-y-1.5 text-sm">
              <Row label="Subtotal" value={cart.totals.subtotal} />
              {cart.totals.itemDiscountTotal > 0 && (
                <Row
                  label="Item discounts"
                  value={-cart.totals.itemDiscountTotal}
                  muted
                />
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="text-secondary-500">Bill discount</span>
                <InputNumber
                  type="number"
                  size="small"
                  min={0}
                  max={cart.totals.subtotal}
                  value={cart.billDiscount || null}
                  placeholder="0"
                  onChange={(value) => cart.setBillDiscount(Number(value) || 0)}
                  className="!w-28"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-secondary-500">VAT %</span>
                <InputNumber
                  type="number"
                  size="small"
                  min={0}
                  max={100}
                  value={cart.vatPercent || null}
                  placeholder="0"
                  onChange={(value) => cart.setVatPercent(Number(value) || 0)}
                  className="!w-28"
                />
              </div>
              {cart.totals.vatAmount > 0 && (
                <Row label="VAT" value={cart.totals.vatAmount} muted />
              )}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-primary/15 pt-3">
              <span className="text-sm font-semibold text-secondary-700">
                Grand total
              </span>
              <span className="text-2xl font-bold text-primary-700">
                <Money value={grand} />
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-secondary-100 bg-white p-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-secondary-600">
                  Method
                </label>
                <Select
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  className="w-full"
                  options={Object.entries(PAYMENT_METHOD_LABELS).map(
                    ([value, label]) => ({ value, label })
                  )}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-secondary-600">
                  Tendered
                </label>
                <InputNumber
                  type="number"
                  min={0}
                  value={tendered}
                  placeholder={String(grand)}
                  onChange={(value) =>
                    setTendered(value == null ? null : Number(value))
                  }
                  className="w-full"
                />
              </div>
            </div>

            {(change > 0 || due > 0) && (
              <div
                className={`mt-2 flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold ${
                  due > 0
                    ? "bg-danger/10 text-danger"
                    : "bg-primary-50 text-primary-700"
                }`}
              >
                <span>{due > 0 ? "Balance owing" : "Change to give"}</span>
                <Money value={due > 0 ? due : change} />
              </div>
            )}

            <Input
              className="!mt-2"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Note on this sale (optional)"
            />
          </div>

          <div className="mt-auto grid grid-cols-3 gap-2">
            <Button onClick={resetSale} disabled={cart.lines.length === 0}>
              Clear
            </Button>
            <Button
              onClick={hold}
              disabled={cart.lines.length === 0}
              icon={<PauseCircle className="h-4 w-4" />}
            >
              Hold
            </Button>
            <Button
              type="primary"
              size="large"
              loading={saving}
              onClick={complete}
              disabled={cart.lines.length === 0}
              icon={<Receipt className="h-4 w-4" />}
              className="!col-span-3 !h-12 !border-0 !bg-gradient-to-r !from-primary-600 !to-primary-500 !text-base !font-semibold shadow-primary hover:!from-primary-700 hover:!to-primary-600"
            >
              Complete Sale · F9
            </Button>
          </div>
        </div>
      </div>
      <ProductPicker
        open={picking}
        setOpen={(value) => {
          setPicking(value);
          if (!value) focusScanner();
        }}
        onPick={addByCode}
      />
    </div>
  );
};

const Row = ({
  label,
  value,
  muted,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) => (
  <div className="flex items-center justify-between">
    <span className="text-secondary-500">{label}</span>
    <span className={muted ? "text-secondary-500" : "font-medium text-secondary-800"}>
      <Money value={value} />
    </span>
  </div>
);

export default PointOfSale;
