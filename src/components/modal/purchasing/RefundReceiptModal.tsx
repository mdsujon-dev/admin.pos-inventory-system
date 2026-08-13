import { DatePicker, Input, InputNumber, Modal, Select } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Money from "../../shared/Money";
import {
  IPurchaseReturn,
  useRecordRefundReceiptMutation,
} from "../../../redux/features/purchasing/purchaseReturnApi";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_REFERENCE_HINTS,
  PAYMENT_REFERENCE_LABELS,
  round2,
} from "../../../utils/money";

/**
 * The supplier finally pays back what a return left them owing.
 *
 * A separate step rather than a tick on the return, because this is the moment
 * the money is real: until it is recorded the amount sits on the ledger as
 * owed to us and stays out of every cash figure. Pressing this button is what
 * moves it, and the date on the form is the date it counts from — a March
 * credit note settled in May is May's cash, not March's.
 *
 * Part payments are allowed on purpose. A supplier clearing a large credit in
 * two cheques is ordinary, and a form that insisted on the full amount would
 * push the shop into recording both as one lump on the wrong day.
 */
const RefundReceiptModal = ({
  row,
  open,
  setOpen,
}: {
  row: IPurchaseReturn;
  open: boolean;
  setOpen: (value: boolean) => void;
}) => {
  const [record, { isLoading }] = useRecordRefundReceiptMutation();

  const owed = round2(row.refundDue ?? 0);
  const [amount, setAmount] = useState<number | null>(owed);
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [receivedAt, setReceivedAt] = useState<Dayjs>(dayjs());
  const [note, setNote] = useState("");

  // Reopened against a different return, or after a part payment moved the
  // balance — either way the form starts from what is owed now.
  useEffect(() => {
    if (!open) return;
    setAmount(owed);
    setMethod("cash");
    setReference("");
    setReceivedAt(dayjs());
    setNote("");
  }, [open, owed]);

  const entered = round2(amount ?? 0);
  const leftOver = round2(owed - entered);

  const onSubmit = async () => {
    if (entered <= 0) {
      toast.error("Enter an amount above zero");
      return;
    }
    if (entered > owed) {
      toast.error("That is more than the supplier still owes on this return");
      return;
    }

    try {
      const result = await record({
        id: row._id,
        amount: entered,
        method,
        reference: reference.trim() || undefined,
        receivedAt: receivedAt.toISOString(),
        note: note.trim() || undefined,
      }).unwrap();
      toast.success(result?.message || "Refund recorded");
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Could not record the refund");
    }
  };

  return (
    <Modal
      title={`Refund received — ${row.returnNo}`}
      open={open}
      onCancel={() => setOpen(false)}
      onOk={onSubmit}
      okText="Record refund"
      okButtonProps={{ loading: isLoading, disabled: entered <= 0 }}
      width={620}
      destroyOnHidden
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-md border border-[#f59e0b55] bg-[#fffbeb] px-3 py-2.5">
          <div className="min-w-0">
            <p className="m-0 text-[13px] font-semibold text-secondary-800">
              {row.vendorName}
            </p>
            <p className="m-0 text-[11px] text-secondary-500">
              {row.purchaseNo} · sent back{" "}
              {dayjs(row.returnedAt).format("DD MMM YYYY")}
            </p>
          </div>
          <div className="text-right">
            <p className="m-0 text-[10px] uppercase tracking-wide text-[#92400e]">
              Still owed to us
            </p>
            <span className="text-[18px] font-bold text-[#92400e]">
              <Money value={owed} />
            </span>
          </div>
        </div>

        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <div>
            <p className="m-0 mb-1.5 text-[12px] font-semibold text-secondary-600">
              Amount received
            </p>
            <InputNumber
              type="number"
              min={0}
              max={owed}
              className="w-full"
              value={amount}
              onChange={(value) =>
                setAmount(value == null ? null : Number(value))
              }
            />
          </div>

          <div>
            <p className="m-0 mb-1.5 text-[12px] font-semibold text-secondary-600">
              How it came back
            </p>
            <Select
              className="w-full"
              value={method}
              onChange={setMethod}
              options={Object.entries(PAYMENT_METHOD_LABELS).map(
                ([value, label]) => ({ value, label })
              )}
            />
          </div>

          <div>
            <p className="m-0 mb-1.5 text-[12px] font-semibold text-secondary-600">
              Received on
            </p>
            <DatePicker
              className="w-full"
              allowClear={false}
              value={receivedAt}
              onChange={(value) => value && setReceivedAt(value)}
            />
          </div>

          <div>
            <p className="m-0 mb-1.5 text-[12px] font-semibold text-secondary-600">
              {PAYMENT_REFERENCE_LABELS[method] ?? "Reference"}
            </p>
            <Input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder={PAYMENT_REFERENCE_HINTS[method] ?? "Optional"}
            />
          </div>
        </div>

        <Input.TextArea
          rows={2}
          placeholder="Note (optional)"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />

        {/*
          Said out loud rather than left to arithmetic: a part payment that
          silently closes the return is how a balance stops being chased.
        */}
        {entered > 0 && (
          <p className="m-0 text-[12px] text-secondary-500">
            {leftOver > 0 ? (
              <>
                <Money value={leftOver} /> will still be owed on{" "}
                {row.returnNo} after this.
              </>
            ) : (
              <>{row.returnNo} will be settled in full.</>
            )}
          </p>
        )}

        {row.receipts && row.receipts.length > 0 && (
          <div className="rounded-md border border-secondary-100 p-3">
            <p className="m-0 mb-2 text-[11px] font-semibold uppercase tracking-wide text-secondary-500">
              Already received
            </p>
            {row.receipts.map((receipt, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-[12px] text-secondary-600"
              >
                <span>
                  {dayjs(receipt.receivedAt).format("DD MMM YYYY")} ·{" "}
                  {PAYMENT_METHOD_LABELS[receipt.method] ?? receipt.method}
                  {receipt.reference ? ` · ${receipt.reference}` : ""}
                </span>
                <span className="font-medium text-secondary-800">
                  <Money value={receipt.amount} />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RefundReceiptModal;
