import { Button, Tag } from "antd";
import { ArrowLeft, Printer, Receipt } from "lucide-react";
import { useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PageMeta from "../../components/Common/PageMeta";
import Barcode from "../../components/shared/Barcode";
import { Loading } from "../../components/shared/Loading";
import Money from "../../components/shared/Money";
import { ISale, useGetSaleByIdQuery } from "../../redux/features/sales/saleApi";
import { PAYMENT_METHOD_LABELS } from "../../utils/money";

const dateOf = (value?: string) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

/**
 * The receipt.
 *
 * Two audiences at once: a person reading it on screen, and a printer. The
 * screen version is coloured and roomy; the print rules below strip the panel
 * chrome and tighten the type, because a receipt that prints the sidebar is a
 * receipt that wastes a page.
 *
 * The invoice number is drawn as a barcode as well as text, so a customer
 * bringing it back can have it scanned rather than read out — the same reason
 * every shelf label carries one.
 */
const InvoiceView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const printed = useRef(false);

  const { data, isFetching } = useGetSaleByIdQuery(id as string, { skip: !id });
  const sale: ISale | undefined = data?.data;

  // Straight off the till, the receipt should already be printing.
  useEffect(() => {
    if (sale && params.get("print") === "1" && !printed.current) {
      printed.current = true;
      const timer = setTimeout(() => window.print(), 400);
      return () => clearTimeout(timer);
    }
  }, [sale, params]);

  if (isFetching) return <Loading />;
  if (!sale) return null;

  const customer =
    typeof sale.customer === "object" && sale.customer ? sale.customer : null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageMeta
        title={`${sale.invoiceNo} - POS & Inventory`}
        description="Sales invoice"
        noindex
      />

      {/* Screen-only controls. */}
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
        <Button
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate("/sales/invoices")}
        >
          Back to invoices
        </Button>
        <Button
          type="primary"
          icon={<Printer className="h-4 w-4" />}
          onClick={() => window.print()}
          className="!border-0 !bg-gradient-to-r !from-primary-600 !to-primary-500 shadow-primary"
        >
          Print
        </Button>
      </div>

      <div
        id="invoice-sheet"
        className="overflow-hidden rounded-2xl border border-secondary-100 bg-white shadow-card print:rounded-none print:border-0 print:shadow-none"
      >
        {/* Header band. Prints in colour when the printer allows it, and reads
            as a plain heading when it does not. */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 px-6 py-5 text-white">
          <span className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/10 print:hidden" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="m-0 flex items-center gap-2 text-lg font-bold">
                <Receipt className="h-5 w-5" />
                ZOOM POS
              </p>
              <p className="m-0 text-xs text-white/80">
                Smart POS · Smart Business
              </p>
            </div>
            <div className="text-right">
              <p className="m-0 font-mono text-base font-semibold">
                {sale.invoiceNo}
              </p>
              <p className="m-0 text-xs text-white/80">
                {dateOf(sale.saleDate)}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-secondary-400">
                Billed to
              </p>
              <p className="m-0 text-sm font-semibold text-secondary-800">
                {customer?.name || sale.customerName || "Walk-in customer"}
              </p>
              {(customer?.phone || sale.customerPhone) && (
                <p className="m-0 font-mono text-xs text-secondary-500">
                  {customer?.phone || sale.customerPhone}
                </p>
              )}
              {customer?.address && (
                <p className="m-0 max-w-xs text-xs text-secondary-500">
                  {customer.address}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-secondary-400">
                Payment
              </p>
              <p className="m-0 text-sm font-semibold text-secondary-800">
                {PAYMENT_METHOD_LABELS[sale.paymentMethod] ?? sale.paymentMethod}
              </p>
              <Tag
                className={`!mt-1 !text-[11px] ${
                  sale.status === "paid"
                    ? "!border-primary-200 !bg-primary-50 !text-primary-700"
                    : "!border-danger/30 !bg-danger/10 !text-danger"
                }`}
              >
                {sale.status === "paid"
                  ? "Paid in full"
                  : sale.status === "partial"
                  ? "Partly paid"
                  : "Unpaid"}
              </Tag>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-secondary-200 text-left text-[11px] uppercase tracking-wide text-secondary-500">
                <th className="py-2 font-semibold">Item</th>
                <th className="py-2 text-right font-semibold">Price</th>
                <th className="py-2 text-right font-semibold">Qty</th>
                <th className="py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, index) => (
                <tr
                  key={item._id ?? index}
                  className="border-b border-secondary-100 last:border-0"
                >
                  <td className="py-2 pr-2">
                    <p className="m-0 font-medium text-secondary-800">
                      {item.name}
                      {item.variantName ? ` — ${item.variantName}` : ""}
                    </p>
                    <p className="m-0 font-mono text-[11px] text-secondary-400">
                      {item.sku}
                    </p>
                    {item.discount > 0 && (
                      <p className="m-0 text-[11px] text-primary-600">
                        Discount <Money value={item.discount} />
                      </p>
                    )}
                  </td>
                  <td className="py-2 text-right text-secondary-600">
                    <Money value={item.unitPrice} />
                  </td>
                  <td className="py-2 text-right text-secondary-600">
                    {item.quantity}
                    {item.unit ? ` ${item.unit}` : ""}
                  </td>
                  <td className="py-2 text-right font-semibold text-secondary-800">
                    <Money value={item.lineTotal} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex justify-end">
            <div className="w-full max-w-xs space-y-1 text-sm">
              <Line label="Subtotal" value={sale.subtotal} />
              {sale.itemDiscountTotal > 0 && (
                <Line label="Item discounts" value={-sale.itemDiscountTotal} />
              )}
              {sale.billDiscount > 0 && (
                <Line label="Bill discount" value={-sale.billDiscount} />
              )}
              {sale.vatAmount > 0 && (
                <Line label={`VAT ${sale.vatPercent}%`} value={sale.vatAmount} />
              )}
              <div className="flex items-center justify-between border-t border-primary/20 pt-2 text-base font-bold text-primary-700">
                <span>Total</span>
                <Money value={sale.grandTotal} />
              </div>
              <Line label="Paid" value={sale.paid} />
              {sale.changeGiven > 0 && (
                <Line label="Change given" value={sale.changeGiven} />
              )}
              {sale.due > 0 && (
                <div className="flex items-center justify-between font-semibold text-danger">
                  <span>Balance owing</span>
                  <Money value={sale.due} />
                </div>
              )}
            </div>
          </div>

          {sale.note && (
            <p className="mt-4 rounded-lg bg-secondary-50 px-3 py-2 text-xs text-secondary-600">
              {sale.note}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-secondary-100 pt-4">
            <div>
              <Barcode value={sale.invoiceNo} moduleWidth={1.6} height={44} />
            </div>
            <div className="text-right text-xs text-secondary-500">
              {sale.soldByName && <p className="m-0">Served by {sale.soldByName}</p>}
              <p className="m-0">Thank you for your purchase</p>
            </div>
          </div>
        </div>
      </div>

      {/*
        Print rules. Everything outside the sheet is hidden rather than
        restyled: the sidebar, header and action bar have no business on a
        receipt, and hiding them is what makes the sheet start at the top of
        the page instead of a third of the way down.
      */}
      <style>{`
        @media print {
          @page { margin: 10mm; }
          body * { visibility: hidden; }
          #invoice-sheet, #invoice-sheet * { visibility: visible; }
          #invoice-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          /* Ask for the colour band; browsers strip backgrounds otherwise. */
          #invoice-sheet [class*="bg-gradient"] {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

const Line = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center justify-between text-secondary-600">
    <span>{label}</span>
    <Money value={value} />
  </div>
);

export default InvoiceView;
