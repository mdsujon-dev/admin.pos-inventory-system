import { Alert, DatePicker, Form, Input, InputNumber, Select, Table } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { IVendor } from "../../../redux/features/purchasing/vendorApi";
import { useCreateVendorPaymentMutation } from "../../../redux/features/purchasing/vendorPaymentApi";
import { PAYMENT_METHOD_LABELS, round2 } from "../../../utils/money";
import Money from "../../shared/Money";
import AppFormModal from "../shared/AppFormModal";

/**
 * What the one "proof" field is called, per method.
 *
 * The same field every time — one string that settles "did this really go
 * out" — but nobody calls a bKash trx id a reference, so the label follows
 * the method rather than making the cashier translate.
 */
const REFERENCE_LABEL: Record<string, string> = {
  cash: "Voucher no",
  bkash: "Transaction ID",
  nagad: "Transaction ID",
  rocket: "Transaction ID",
  bank: "Cheque / transfer no",
  card: "Approval code",
  other: "Reference",
};

const REFERENCE_HINT: Record<string, string> = {
  cash: "e.g. VCH-1042",
  bkash: "e.g. 9F2K7XQ1PL",
  nagad: "e.g. 9F2K7XQ1PL",
  rocket: "e.g. 9F2K7XQ1PL",
  bank: "e.g. 004512 or the transfer id",
  card: "e.g. 013422",
  other: "Optional",
};

const WALLETS = ["bkash", "nagad", "rocket"];

/** Which extra fields each method offers — and therefore which ones it saves. */
const WALLET_FIELDS = ["senderNumber", "receiverNumber", "accountType"];
const DETAIL_FIELDS: Record<string, string[]> = {
  cash: ["handedTo", "receivedBy"],
  bkash: WALLET_FIELDS,
  nagad: WALLET_FIELDS,
  rocket: WALLET_FIELDS,
  bank: ["bankName", "branch", "accountNumber", "chequeDate"],
  card: ["cardLast4"],
  other: [],
};

interface OpenBill {
  _id: string;
  purchaseNo: string;
  billNo?: string;
  purchaseDate: string;
  grandTotal: number;
  due: number;
}

/**
 * Paying a supplier.
 *
 * Amount first, bills second: a shopkeeper hands over what they can afford
 * and expects it to land against the oldest debts, which is what happens when
 * nothing is ticked. Ticking specific bills is for when the supplier asked for
 * one to be cleared by name.
 */
const VendorPaymentModal = ({
  open,
  setOpen,
  vendor,
  bills = [],
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  vendor: Pick<IVendor, "_id" | "name" | "totalDue">;
  bills?: OpenBill[];
}) => {
  const [form] = Form.useForm();
  const [createPayment, { isLoading }] = useCreateVendorPaymentMutation();
  const [picked, setPicked] = useState<string[]>([]);
  const [amount, setAmount] = useState<number | null>(null);

  // Watched rather than held in state: the method decides which fields the
  // form shows, and AntD already owns the value.
  const method: string = Form.useWatch("method", form) ?? "cash";
  const isWallet = WALLETS.includes(method);

  const openBills = useMemo(
    () => bills.filter((bill) => bill.due > 0),
    [bills]
  );

  const pickedTotal = round2(
    openBills
      .filter((bill) => picked.includes(bill._id))
      .reduce((sum, bill) => sum + bill.due, 0)
  );

  const handleSubmit = async (values: {
    amount: number;
    method: string;
    reference?: string;
    details?: Record<string, unknown>;
    note?: string;
    paidAt?: Dayjs;
  }) => {
    /**
     * Only the fields the chosen method actually showed are sent.
     *
     * Switching from bank to cash mid-form leaves the bank values behind in
     * the form store, and saving them would file a cheque number against a
     * payment made in notes.
     */
    const raw = (values.details ?? {}) as Record<string, unknown>;
    const details: Record<string, unknown> = {};
    for (const key of DETAIL_FIELDS[values.method] ?? []) {
      const value = raw[key];
      if (value === undefined || value === null || value === "") continue;
      details[key] =
        key === "chequeDate" ? (value as Dayjs).toISOString() : value;
    }

    try {
      const result = await createPayment({
        vendor: vendor._id,
        amount: values.amount,
        method: values.method,
        reference: values.reference?.trim() || undefined,
        details,
        note: values.note?.trim() || undefined,
        paidAt: (values.paidAt ?? dayjs()).toISOString(),
        ...(picked.length ? { purchases: picked } : {}),
      }).unwrap();

      toast.success(result?.message ?? "Payment recorded");
      setOpen(false);
      form.resetFields();
      setPicked([]);
    } catch (error: any) {
      toast.error(error?.data?.message || "Could not record the payment");
    }
  };

  const overpaying = (amount ?? 0) > (vendor.totalDue ?? 0);

  return (
    <AppFormModal
      open={open}
      setOpen={setOpen}
      entity="Vendor Payment"
      isEditing={false}
      loading={isLoading}
      form={form}
      width={720}
      onSubmit={handleSubmit}
      initialValues={{
        amount: vendor.totalDue > 0 ? vendor.totalDue : null,
        method: "cash",
        paidAt: dayjs(),
      }}
    >
      <div className="mb-4 flex items-center justify-between rounded-xl border border-secondary-100 bg-secondary-50 px-3 py-2.5">
        <div>
          <p className="m-0 text-sm font-semibold text-secondary-800">
            {vendor.name}
          </p>
          <p className="m-0 text-xs text-secondary-500">Outstanding balance</p>
        </div>
        <span className="text-xl font-bold text-danger">
          <Money value={vendor.totalDue ?? 0} />
        </span>
      </div>

      <div className="grid gap-x-4 sm:grid-cols-2">
        <Form.Item
          label="Amount"
          name="amount"
          rules={[{ required: true, message: "Enter an amount" }]}
        >
          <InputNumber
            type="number"
            min={0}
            className="w-full !rounded-lg"
            onChange={(value) => setAmount(value == null ? null : Number(value))}
          />
        </Form.Item>
        <Form.Item label="Method" name="method">
          <Select
            options={Object.entries(PAYMENT_METHOD_LABELS).map(
              ([value, label]) => ({ value, label })
            )}
          />
        </Form.Item>
        <Form.Item label="Paid on" name="paidAt">
          <DatePicker className="w-full" allowClear={false} />
        </Form.Item>
        <Form.Item
          label={REFERENCE_LABEL[method] ?? "Reference"}
          name="reference"
          tooltip="Whatever single thing proves this money moved"
        >
          <Input placeholder={REFERENCE_HINT[method] ?? "Optional"} />
        </Form.Item>

        {/*
          The rest depends on how it was paid. A wallet transfer has numbers on
          both ends, a cheque has a date, cash has a person who took it — and
          none of those mean anything on the other methods, so asking for all
          of them every time would be a form of mostly-empty boxes.
        */}
        {isWallet && (
          <>
            <Form.Item label="Sender number" name={["details", "senderNumber"]}>
              <Input placeholder="Our number" inputMode="numeric" />
            </Form.Item>
            <Form.Item
              label="Receiver number"
              name={["details", "receiverNumber"]}
            >
              <Input placeholder="Their number" inputMode="numeric" />
            </Form.Item>
            <Form.Item label="Account type" name={["details", "accountType"]}>
              <Select
                allowClear
                placeholder="Personal, Agent or Merchant"
                options={["Personal", "Agent", "Merchant"].map((row) => ({
                  label: row,
                  value: row,
                }))}
              />
            </Form.Item>
          </>
        )}

        {method === "bank" && (
          <>
            <Form.Item label="Bank" name={["details", "bankName"]}>
              <Input placeholder="e.g. Dutch Bangla Bank" />
            </Form.Item>
            <Form.Item label="Branch" name={["details", "branch"]}>
              <Input placeholder="e.g. Gulshan" />
            </Form.Item>
            <Form.Item
              label="Account number"
              name={["details", "accountNumber"]}
            >
              <Input placeholder="Whose account it left" />
            </Form.Item>
            <Form.Item label="Cheque date" name={["details", "chequeDate"]}>
              <DatePicker
                className="w-full"
                placeholder="If it was a cheque"
              />
            </Form.Item>
          </>
        )}

        {method === "card" && (
          <Form.Item
            label="Card last 4"
            name={["details", "cardLast4"]}
            tooltip="Only the last four — never the full number"
          >
            <Input maxLength={4} placeholder="e.g. 4821" inputMode="numeric" />
          </Form.Item>
        )}

        {method === "cash" && (
          <>
            <Form.Item label="Handed to" name={["details", "handedTo"]}>
              <Input placeholder="Who at the vendor took it" />
            </Form.Item>
            <Form.Item label="Paid by" name={["details", "receivedBy"]}>
              <Input placeholder="Who from our side handed it over" />
            </Form.Item>
          </>
        )}
      </div>

      {overpaying && (
        <Alert
          type="info"
          showIcon
          className="!mb-4"
          message="More than is owed"
          description="The extra is kept as credit against this vendor rather than pushing a bill negative."
        />
      )}

      {openBills.length > 0 && (
        <>
          <p className="mb-2 text-[13px] font-medium text-secondary-700">
            Settle specific bills{" "}
            <span className="font-normal text-secondary-500">
              — leave unticked and the oldest are cleared first
            </span>
          </p>
          <Table
            dataSource={openBills}
            rowKey="_id"
            size="small"
            pagination={{ pageSize: 5, hideOnSinglePage: true }}
            rowSelection={{
              selectedRowKeys: picked,
              onChange: (keys) => setPicked(keys as string[]),
            }}
            columns={[
              {
                title: "Bill",
                key: "purchaseNo",
                render: (_: unknown, row: OpenBill) => (
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
                title: "Owing",
                key: "due",
                width: 120,
                render: (_: unknown, row: OpenBill) => (
                  <span className="font-medium text-danger">
                    <Money value={row.due} />
                  </span>
                ),
              },
            ]}
          />
          {picked.length > 0 && (
            <p className="mt-2 text-xs text-secondary-500">
              {picked.length} bill{picked.length === 1 ? "" : "s"} ticked,
              owing <Money value={pickedTotal} /> in total
            </p>
          )}
        </>
      )}

      <Form.Item label="Note" name="note" className="!mt-4">
        <Input.TextArea rows={2} placeholder="Optional" />
      </Form.Item>
    </AppFormModal>
  );
};

export default VendorPaymentModal;
