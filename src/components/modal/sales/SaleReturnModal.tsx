import { Alert, Checkbox, InputNumber, Modal, Segmented, Select, Input } from "antd";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Money from "../../shared/Money";
import { Loading } from "../../shared/Loading";
import {
  IReturnableLine,
  useCreateSaleReturnMutation,
  useGetReturnableLinesQuery,
} from "../../../redux/features/sales/saleReturnApi";
import { PAYMENT_METHOD_LABELS } from "../../../utils/money";

interface Props {
  saleId: string;
  open: boolean;
  setOpen: (value: boolean) => void;
}

/**
 * Taking goods back off an invoice.
 *
 * Built around the lines rather than a total, because a return is almost never
 * for the whole bill and a free-text amount cannot say which units came back —
 * and without that, neither the stock nor the cost can be put right.
 */
const SaleReturnModal = ({ saleId, open, setOpen }: Props) => {
  const { data, isFetching } = useGetReturnableLinesQuery(saleId, {
    skip: !open,
  });
  const [createReturn, { isLoading }] = useCreateSaleReturnMutation();

  const invoice = data?.data;
  const lines: IReturnableLine[] = useMemo(
    () => invoice?.lines ?? [],
    [invoice]
  );

  /** index → how many units, and whether they go back on the shelf. */
  const [picked, setPicked] = useState<
    Record<number, { quantity: number; restock: boolean }>
  >({});
  const [mode, setMode] = useState<"cash" | "credit">("cash");
  const [refundMethod, setRefundMethod] = useState("cash");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) return;
    setPicked({});
    setReason("");
    // A customer who has not paid gets their balance reduced by default;
    // handing cash back on an unpaid bill would turn a return into a loan.
    setMode((invoice?.due ?? 0) > 0 ? "credit" : "cash");
  }, [open, invoice?.due]);

  const subtotal = lines.reduce((sum, line) => {
    const row = picked[line.index];
    return sum + (row?.quantity ?? 0) * line.unitPrice;
  }, 0);

  const units = Object.values(picked).reduce(
    (sum, row) => sum + (row.quantity || 0),
    0
  );

  const creditable = Math.min(invoice?.due ?? 0, subtotal);
  const cashBack = mode === "credit" ? subtotal - creditable : subtotal;

  const setQuantity = (line: IReturnableLine, quantity: number) =>
    setPicked((current) => {
      const next = { ...current };
      if (!quantity) {
        delete next[line.index];
        return next;
      }
      next[line.index] = {
        quantity: Math.min(quantity, line.returnable),
        restock: current[line.index]?.restock ?? true,
      };
      return next;
    });

  const onSubmit = async () => {
    const items = Object.entries(picked)
      .filter(([, row]) => row.quantity > 0)
      .map(([index, row]) => ({
        index: Number(index),
        quantity: row.quantity,
        restock: row.restock,
      }));

    if (!items.length) {
      toast.error("Pick at least one line to return");
      return;
    }

    try {
      const result = await createReturn({
        sale: saleId,
        items,
        mode,
        refundMethod: cashBack > 0 ? refundMethod : undefined,
        reason: reason.trim() || undefined,
      }).unwrap();
      toast.success(result?.message || "Return saved");
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not save the return");
    }
  };

  const nothingLeft = lines.length > 0 && lines.every((l) => l.returnable === 0);

  return (
    <Modal
      title={`Return against ${invoice?.invoiceNo ?? "invoice"}`}
      open={open}
      onCancel={() => setOpen(false)}
      onOk={onSubmit}
      okText={cashBack > 0 ? "Refund and save" : "Save return"}
      okButtonProps={{ loading: isLoading, disabled: units === 0 }}
      width={780}
      destroyOnHidden
    >
      {isFetching ? (
        <Loading />
      ) : nothingLeft ? (
        <Alert
          type="info"
          showIcon
          message="Everything on this invoice has already been returned"
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-lg border border-secondary-100">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-secondary-50 text-left text-[11px] uppercase tracking-wide text-secondary-500">
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2 text-center">Sold</th>
                  <th className="px-3 py-2 text-center">Already back</th>
                  <th className="px-3 py-2 text-center">Returning</th>
                  <th className="px-3 py-2 text-center">Resellable</th>
                  <th className="px-3 py-2 text-right">Refund</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const row = picked[line.index];
                  const spent = (row?.quantity ?? 0) * line.unitPrice;
                  return (
                    <tr
                      key={line.index}
                      className="border-t border-secondary-100"
                    >
                      <td className="px-3 py-2">
                        <p className="m-0 font-medium text-secondary-800">
                          {line.name}
                          {line.variantName ? ` — ${line.variantName}` : ""}
                        </p>
                        <span className="font-mono text-[11px] text-secondary-400">
                          {line.sku} · <Money value={line.unitPrice} /> each
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">{line.quantity}</td>
                      <td className="px-3 py-2 text-center text-secondary-500">
                        {line.returned || "—"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <InputNumber
                          size="small"
                          min={0}
                          max={line.returnable}
                          disabled={line.returnable === 0}
                          value={row?.quantity || null}
                          onChange={(value) =>
                            setQuantity(line, Number(value) || 0)
                          }
                          className="w-[70px]"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        {/* Damaged goods are refunded but not put back on the
                            shelf — the money returns, the stock does not. */}
                        <Checkbox
                          disabled={!row?.quantity}
                          checked={row?.restock ?? true}
                          onChange={(event) =>
                            setPicked((current) => ({
                              ...current,
                              [line.index]: {
                                quantity: current[line.index]?.quantity ?? 0,
                                restock: event.target.checked,
                              },
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-secondary-800">
                        {spent > 0 ? <Money value={spent} /> : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="m-0 mb-1.5 text-[12px] font-semibold text-secondary-600">
                How the customer is squared up
              </p>
              <Segmented
                block
                value={mode}
                onChange={(value) => setMode(value as "cash" | "credit")}
                options={[
                  { label: "Hand money back", value: "cash" },
                  {
                    label: "Take off what they owe",
                    value: "credit",
                    disabled: (invoice?.due ?? 0) <= 0,
                  },
                ]}
              />
              {(invoice?.due ?? 0) > 0 && (
                <p className="m-0 mt-1.5 text-[11px] text-secondary-400">
                  This invoice still has <Money value={invoice?.due} /> unpaid.
                </p>
              )}

              {cashBack > 0 && (
                <Select
                  className="mt-2 w-full"
                  value={refundMethod}
                  onChange={setRefundMethod}
                  options={Object.entries(PAYMENT_METHOD_LABELS).map(
                    ([value, label]) => ({ value, label })
                  )}
                />
              )}

              <Input.TextArea
                className="mt-2"
                rows={2}
                placeholder="Why is it coming back?"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </div>

            <div className="rounded-lg border border-primary-200 bg-primary-50 p-3">
              <Line label="Units coming back" value={String(units)} />
              <Line label="Value" value={<Money value={subtotal} />} />
              {mode === "credit" && (
                <Line
                  label="Off what they owe"
                  value={<Money value={creditable} />}
                />
              )}
              <div className="mt-2 flex items-center justify-between border-t border-primary-200 pt-2">
                <span className="text-[12px] font-semibold uppercase tracking-wide text-primary-700">
                  Cash handed back
                </span>
                <span className="text-[17px] font-bold text-primary-700">
                  <Money value={cashBack} />
                </span>
              </div>
              <p className="m-0 mt-2 text-[11px] text-secondary-500">
                VAT is reversed in the same proportion it was charged, and the
                units go back into the exact batches they were sold from.
              </p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

const Line = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-center justify-between text-[13px]">
    <span className="text-secondary-600">{label}</span>
    <span className="font-medium text-secondary-800">{value}</span>
  </div>
);

export default SaleReturnModal;
