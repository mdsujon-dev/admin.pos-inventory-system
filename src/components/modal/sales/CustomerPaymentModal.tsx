import { Alert, DatePicker, Form, Input, InputNumber, Select, Table } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useCreateCustomerPaymentMutation } from "../../../redux/features/sales/customerPaymentApi";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_REFERENCE_HINTS,
  PAYMENT_REFERENCE_LABELS,
  round2,
} from "../../../utils/money";
import Money from "../../shared/Money";
import AppFormModal from "../shared/AppFormModal";

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

interface OpenInvoice {
  _id: string;
  invoiceNo: string;
  saleDate: string;
  grandTotal: number;
  due: number;
}

/**
 * Taking money off a customer's tab.
 *
 * Amount first, invoices second: someone paying down what they owe hands over
 * what they can and expects it to land against the oldest bills, which is what
 * happens when nothing is ticked. Ticking specific invoices is for when the
 * customer asked for one to be cleared by name.
 *
 * The date matters more here than anywhere else on this screen. It is the day
 * the money counts from, and it defaults to today rather than to the invoice —
 * a debt collected in March is March's cash however old the sale was.
 */
const CustomerPaymentModal = ({
  open,
  setOpen,
  customer,
  invoices = [],
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  customer: { _id: string; name: string; totalDue: number };
  invoices?: OpenInvoice[];
}) => {
  const [form] = Form.useForm();
  const [createPayment, { isLoading }] = useCreateCustomerPaymentMutation();
  const [picked, setPicked] = useState<string[]>([]);
  const [amount, setAmount] = useState<number | null>(null);

  // Watched rather than held in state: the method decides which fields the
  // form shows, and AntD already owns the value.
  const method: string = Form.useWatch("method", form) ?? "cash";
  const isWallet = WALLETS.includes(method);

  const openInvoices = useMemo(
    () => invoices.filter((row) => row.due > 0),
    [invoices]
  );

  const pickedTotal = round2(
    openInvoices
      .filter((row) => picked.includes(row._id))
      .reduce((sum, row) => sum + row.due, 0)
  );

  const handleSubmit = async (values: {
    amount: number;
    method: string;
    reference?: string;
    details?: Record<string, unknown>;
    note?: string;
    receivedAt?: Dayjs;
  }) => {
    /**
     * Only the fields the chosen method actually showed are sent.
     *
     * Switching from bank to cash mid-form leaves the bank values behind in
     * the form store, and saving them would file a cheque number against
     * money taken in notes.
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
        customer: customer._id,
        amount: values.amount,
        method: values.method,
        reference: values.reference?.trim() || undefined,
        details,
        note: values.note?.trim() || undefined,
        receivedAt: (values.receivedAt ?? dayjs()).toISOString(),
        ...(picked.length ? { sales: picked } : {}),
      }).unwrap();

      toast.success(result?.message ?? "Payment recorded");
      setOpen(false);
      form.resetFields();
      setPicked([]);
    } catch (error: any) {
      toast.error(error?.data?.message || "Could not record the payment");
    }
  };

  const overpaying = (amount ?? 0) > (customer.totalDue ?? 0);

  return (
    <AppFormModal
      open={open}
      setOpen={setOpen}
      entity="Customer Payment"
      title="Record a payment"
      subtitle={`Money received from ${customer.name}`}
      isEditing={false}
      loading={isLoading}
      form={form}
      width={720}
      onSubmit={handleSubmit}
      initialValues={{
        amount: customer.totalDue > 0 ? customer.totalDue : null,
        method: "cash",
        receivedAt: dayjs(),
      }}
    >
      <div className="mb-4 flex items-center justify-between rounded-xl border border-secondary-100 bg-secondary-50 px-3 py-2.5">
        <div>
          <p className="m-0 text-sm font-semibold text-secondary-800">
            {customer.name}
          </p>
          <p className="m-0 text-xs text-secondary-500">Outstanding balance</p>
        </div>
        <span className="text-xl font-bold text-danger">
          <Money value={customer.totalDue ?? 0} />
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
        <Form.Item
          label="Received on"
          name="receivedAt"
          tooltip="The day the money arrived — this is the day it counts as cash"
        >
          <DatePicker className="w-full" allowClear={false} />
        </Form.Item>
        <Form.Item
          label={PAYMENT_REFERENCE_LABELS[method] ?? "Reference"}
          name="reference"
          tooltip="Whatever single thing proves this money moved"
        >
          <Input placeholder={PAYMENT_REFERENCE_HINTS[method] ?? "Optional"} />
        </Form.Item>

        {isWallet && (
          <>
            <Form.Item label="Sender number" name={["details", "senderNumber"]}>
              <Input placeholder="Their number" inputMode="numeric" />
            </Form.Item>
            <Form.Item
              label="Receiver number"
              name={["details", "receiverNumber"]}
            >
              <Input placeholder="Our number" inputMode="numeric" />
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
            <Form.Item label="Account number" name={["details", "accountNumber"]}>
              <Input placeholder="Which account it landed in" />
            </Form.Item>
            <Form.Item label="Cheque date" name={["details", "chequeDate"]}>
              <DatePicker className="w-full" placeholder="If it was a cheque" />
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
            <Form.Item label="Handed over by" name={["details", "handedTo"]}>
              <Input placeholder="Who from the customer's side paid" />
            </Form.Item>
            <Form.Item label="Received by" name={["details", "receivedBy"]}>
              <Input placeholder="Who on our side took it" />
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
          description="The extra is kept as credit on this customer's account rather than pushing an invoice negative."
        />
      )}

      {openInvoices.length > 0 && (
        <>
          <p className="mb-2 text-[13px] font-medium text-secondary-700">
            Settle specific invoices{" "}
            <span className="font-normal text-secondary-500">
              — leave unticked and the oldest are cleared first
            </span>
          </p>
          <Table
            dataSource={openInvoices}
            rowKey="_id"
            size="small"
            pagination={{ pageSize: 5, hideOnSinglePage: true }}
            rowSelection={{
              selectedRowKeys: picked,
              onChange: (keys) => setPicked(keys as string[]),
            }}
            columns={[
              {
                title: "Invoice",
                key: "invoiceNo",
                render: (_: unknown, row: OpenInvoice) => (
                  <div>
                    <p className="m-0 font-mono text-xs font-semibold">
                      {row.invoiceNo}
                    </p>
                    <span className="text-[11px] text-secondary-400">
                      {dayjs(row.saleDate).format("DD MMM YYYY")}
                    </span>
                  </div>
                ),
              },
              {
                title: "Owing",
                key: "due",
                width: 120,
                render: (_: unknown, row: OpenInvoice) => (
                  <span className="font-medium text-danger">
                    <Money value={row.due} />
                  </span>
                ),
              },
            ]}
          />
          {picked.length > 0 && (
            <p className="mt-2 text-xs text-secondary-500">
              {picked.length} invoice{picked.length === 1 ? "" : "s"} ticked,
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

export default CustomerPaymentModal;
