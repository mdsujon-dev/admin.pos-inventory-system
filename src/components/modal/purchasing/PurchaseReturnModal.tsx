import { Alert, Input, InputNumber, Modal, Segmented, Select } from "antd";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Money from "../../shared/Money";
import { Loading } from "../../shared/Loading";
import {
  IReturnableBillLine,
  useCreatePurchaseReturnMutation,
  useGetReturnableBillLinesQuery,
} from "../../../redux/features/purchasing/purchaseReturnApi";
import { PAYMENT_METHOD_LABELS } from "../../../utils/money";

/**
 * Sending goods back to the supplier.
 *
 * Line by line, against the bill they arrived on — a return needs to know
 * which delivery it reverses, because that is where the price paid and the
 * batch the goods went into are both recorded.
 *
 * What can go back is limited by what is still on the shelf, not by what the
 * bill says arrived: units already sold are with a customer, and taking them
 * out of a different batch would charge this supplier's return to somebody
 * else's stock.
 */
const PurchaseReturnModal = ({
  purchaseId,
  open,
  setOpen,
}: {
  purchaseId: string;
  open: boolean;
  setOpen: (value: boolean) => void;
}) => {
  const { data, isFetching } = useGetReturnableBillLinesQuery(purchaseId, {
    skip: !open,
  });
  const [createReturn, { isLoading }] = useCreatePurchaseReturnMutation();

  const bill = data?.data;
  const lines: IReturnableBillLine[] = useMemo(() => bill?.lines ?? [], [bill]);

  const [picked, setPicked] = useState<Record<number, number>>({});
  const [mode, setMode] = useState<"cash" | "credit">("credit");
  const [refundMethod, setRefundMethod] = useState("cash");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) return;
    setPicked({});
    setReason("");
    // An unpaid bill is settled by reducing it; asking for cash on money never
    // handed over would turn the return into a loan the other way.
    setMode((bill?.due ?? 0) > 0 ? "credit" : "cash");
  }, [open, bill?.due]);

  const total = lines.reduce(
    (sum, line) => sum + (picked[line.index] ?? 0) * line.unitCost,
    0
  );
  const units = Object.values(picked).reduce((sum, n) => sum + (n || 0), 0);

  const creditable = Math.min(bill?.due ?? 0, total);
  const cashBack = mode === "credit" ? total - creditable : total;

  const onSubmit = async () => {
    const items = Object.entries(picked)
      .filter(([, quantity]) => quantity > 0)
      .map(([index, quantity]) => ({ index: Number(index), quantity }));

    if (!items.length) {
      toast.error("Pick at least one line to send back");
      return;
    }

    try {
      const result = await createReturn({
        purchase: purchaseId,
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
      title={`Return to supplier — ${bill?.purchaseNo ?? "bill"}`}
      open={open}
      onCancel={() => setOpen(false)}
      onOk={onSubmit}
      okText="Save return"
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
          message="Nothing on this bill can go back — it has all been returned or sold"
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-md border border-secondary-100">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-secondary-50 text-left text-[11px] uppercase tracking-wide text-secondary-500">
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2 text-center">Received</th>
                  <th className="px-3 py-2 text-center">On shelf</th>
                  <th className="px-3 py-2 text-center">Sending back</th>
                  <th className="px-3 py-2 text-right">Credit</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const quantity = picked[line.index] ?? 0;
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
                          {line.sku} · <Money value={line.unitCost} /> each
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">{line.quantity}</td>
                      <td className="px-3 py-2 text-center text-secondary-500">
                        {line.stillOnShelf}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <InputNumber
                          size="small"
                          min={0}
                          max={line.returnable}
                          disabled={line.returnable === 0}
                          value={quantity || null}
                          onChange={(value) =>
                            setPicked((current) => {
                              const next = { ...current };
                              const wanted = Math.min(
                                Number(value) || 0,
                                line.returnable
                              );
                              if (!wanted) delete next[line.index];
                              else next[line.index] = wanted;
                              return next;
                            })
                          }
                          className="w-[70px]"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-secondary-800">
                        {quantity > 0 ? (
                          <Money value={quantity * line.unitCost} />
                        ) : (
                          "—"
                        )}
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
                How the supplier settles up
              </p>
              <Segmented
                block
                value={mode}
                onChange={(value) => setMode(value as "cash" | "credit")}
                options={[
                  {
                    label: "Take off what we owe",
                    value: "credit",
                    disabled: (bill?.due ?? 0) <= 0,
                  },
                  { label: "Money back", value: "cash" },
                ]}
              />
              {(bill?.due ?? 0) > 0 && (
                <p className="m-0 mt-1.5 text-[11px] text-secondary-400">
                  This bill still has <Money value={bill?.due} /> unpaid.
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
                className="!mt-2"
                rows={2}
                placeholder="Why is it going back?"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </div>

            <div className="rounded-md border border-primary-200 bg-primary-50 p-3">
              <Line label="Units going back" value={String(units)} />
              <Line label="Value at landed cost" value={<Money value={total} />} />
              {mode === "credit" && (
                <Line
                  label="Off what we owe"
                  value={<Money value={creditable} />}
                />
              )}
              <div className="mt-2 flex items-center justify-between border-t border-primary-200 pt-2">
                <span className="text-[12px] font-semibold uppercase tracking-wide text-primary-700">
                  Money back
                </span>
                <span className="text-[17px] font-bold text-primary-700">
                  <Money value={cashBack} />
                </span>
              </div>
              <p className="m-0 mt-2 text-[11px] text-secondary-500">
                Valued at landed cost — the freight paid to bring these in is
                part of what the shelf is giving up.
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

export default PurchaseReturnModal;
