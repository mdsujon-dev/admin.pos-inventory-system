import { DatePicker, Form, Input, InputNumber, Segmented, Select, Switch } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { TakaIcon } from "../../shared/Icon";
import Money from "../../shared/Money";
import {
  useAddTransactionMutation,
  useUpdateTransactionMutation,
} from "../../../redux/features/transaction/transactionApi";
import {
  IExpenseCategory,
  useCreateExpenseCategoryMutation,
  useGetExpenseCategoriesQuery,
} from "../../../redux/features/accounts/reportApi";
import { PAYMENT_METHOD_LABELS } from "../../../utils/money";
import AppFormModal from "../shared/AppFormModal";

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  type: "income" | "expense";
  record?: any; // present → edit mode
}

const METHOD_OPTIONS = Object.entries(PAYMENT_METHOD_LABELS).map(
  ([value, label]) => ({ value, label })
);

const TransactionModal: React.FC<Props> = ({ open, setOpen, type, record }) => {
  const [form] = Form.useForm();
  const [addTransaction, { isLoading: adding }] = useAddTransactionMutation();
  const [updateTransaction, { isLoading: updating }] =
    useUpdateTransactionMutation();
  const [createCategory] = useCreateExpenseCategoryMutation();

  const { data: categoryData } = useGetExpenseCategoriesQuery(undefined);
  const categories: IExpenseCategory[] = categoryData?.data ?? [];

  const isEdit = !!record;
  const isIncome = type === "income";
  const label = isIncome ? "Income" : "Expense";

  /**
   * A pass-through deal — bought and resold without the goods ever arriving.
   *
   * Kept as a mode rather than a separate screen because it is still one line
   * in the ledger; what changes is that the amount is derived from both sides
   * of the deal instead of typed.
   */
  const [kind, setKind] = useState<"general" | "passthrough">("general");
  const dealValue = Form.useWatch("dealValue", form) as number | undefined;
  const dealCost = Form.useWatch("dealCost", form) as number | undefined;
  const margin = (dealValue ?? 0) - (dealCost ?? 0);

  useEffect(() => {
    if (!open) return;
    if (record) {
      setKind(record.kind === "passthrough" ? "passthrough" : "general");
      form.setFieldsValue({
        amount: record.amount,
        reason: record.reason,
        date: dayjs(record.date || record.createdAt),
        category:
          typeof record.category === "object"
            ? record.category?._id
            : record.category,
        method: record.method,
        reference: record.reference,
        isRefund: !!record.isRefund,
        dealValue: record.dealValue,
        dealCost: record.dealCost,
        party: record.party,
      });
    } else {
      setKind("general");
      form.resetFields();
      // Today, but editable — an expense is often written up the next morning.
      form.setFieldsValue({ date: dayjs(), method: "cash" });
    }
  }, [open, record, form]);

  /** Add a heading without leaving the entry half-typed. */
  const addCategory = async (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    try {
      const created = await createCategory({ name: clean }).unwrap();
      form.setFieldValue("category", created?.data?._id);
      toast.success(`"${clean}" added`);
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not add that heading");
    }
  };

  const onFinish = async (values: any) => {
    const isDeal = isIncome && kind === "passthrough";

    const data: Record<string, unknown> = {
      // On a pass-through the margin is what reaches the books; the server
      // recomputes it from both sides, so this is only the optimistic value.
      amount: isDeal
        ? Number(values.dealValue) - Number(values.dealCost)
        : Number(values.amount),
      reason: values.reason,
      date: values.date ? values.date.toISOString() : undefined,
      category: values.category ?? null,
      method: values.method,
      reference: values.reference?.trim() || undefined,
      isRefund: !!values.isRefund,
      kind: isDeal ? "passthrough" : "general",
      dealValue: isDeal ? Number(values.dealValue) : undefined,
      dealCost: isDeal ? Number(values.dealCost) : undefined,
      party: isDeal ? values.party?.trim() || undefined : undefined,
    };

    try {
      if (isEdit) {
        await updateTransaction({ id: record._id, data }).unwrap();
        toast.success(`${label} entry updated!`);
      } else {
        await addTransaction({ type, ...data }).unwrap();
        toast.success(`${label} entry added!`);
      }
      form.resetFields();
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.data?.message || "Failed to save entry");
    }
  };

  const amountKeys = (e: React.KeyboardEvent) => {
    const allowed = [
      "Backspace",
      "Delete",
      "Tab",
      "Enter",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
      ".",
    ];
    if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return;
    if (!/^[0-9]$/.test(e.key)) e.preventDefault();
  };

  return (
    <AppFormModal
      title={`${isEdit ? "Edit" : "Add"} ${label} Entry`}
      entity="Transaction"
      isEditing={isEdit}
      open={open}
      setOpen={setOpen}
      width={640}
      form={form}
      onSubmit={onFinish}
      loading={adding || updating}
    >
      {isIncome && (
        <Form.Item label="What kind of income">
          <Segmented
            block
            value={kind}
            onChange={(value) => setKind(value as "general" | "passthrough")}
            options={[
              { label: "Straight income", value: "general" },
              { label: "Pass-through deal", value: "passthrough" },
            ]}
          />
          <p className="m-0 mt-1.5 text-[12px] text-secondary-400">
            {kind === "general"
              ? "A rebate, scrap sale, or anything else that came in outside the till."
              : "Bought and resold without the goods reaching the shop. Only the margin is booked as income, and stock is left untouched."}
          </p>
        </Form.Item>
      )}

      <div className="grid gap-x-4 sm:grid-cols-2">
        {isIncome && kind === "passthrough" ? (
          <>
            <Form.Item
              label={
                <span className="inline-flex items-center gap-1">
                  Sold for (<TakaIcon />)
                </span>
              }
              name="dealValue"
              rules={[{ required: true, message: "Enter the sale price" }]}
            >
              <InputNumber
                className="w-full"
                min={0}
                controls={false}
                placeholder="0"
                onKeyDown={amountKeys}
              />
            </Form.Item>
            <Form.Item
              label={
                <span className="inline-flex items-center gap-1">
                  Cost us (<TakaIcon />)
                </span>
              }
              name="dealCost"
              rules={[{ required: true, message: "Enter what it cost" }]}
            >
              <InputNumber
                className="w-full"
                min={0}
                controls={false}
                placeholder="0"
                onKeyDown={amountKeys}
              />
            </Form.Item>
          </>
        ) : (
          <Form.Item
            label={
              <span className="inline-flex items-center gap-1">
                Amount (<TakaIcon />)
              </span>
            }
            name="amount"
            rules={[
              { required: true, message: "Enter an amount" },
              {
                type: "number",
                min: 0.01,
                message: "Amount must be greater than 0",
              },
            ]}
          >
            <InputNumber
              className="w-full"
              min={0}
              controls={false}
              placeholder="0"
              prefix={<TakaIcon className="text-secondary-400" />}
              onKeyDown={amountKeys}
            />
          </Form.Item>
        )}

        <Form.Item
          label="Date"
          name="date"
          rules={[{ required: true, message: "Pick the date it happened" }]}
        >
          <DatePicker className="w-full" format="DD MMM YYYY" allowClear={false} />
        </Form.Item>
      </div>

      {isIncome && kind === "passthrough" && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 px-3 py-2">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-primary-700">
            Booked as income
          </span>
          <span className="text-[17px] font-bold text-primary-700">
            <Money value={margin > 0 ? margin : 0} />
          </span>
        </div>
      )}

      <div className="grid gap-x-4 sm:grid-cols-2">
        <Form.Item
          label={isIncome ? "Heading (optional)" : "Heading"}
          name="category"
          rules={
            isIncome
              ? undefined
              : [{ required: true, message: "Pick a heading for this expense" }]
          }
          // Without this every expense reports as "Uncategorised", which is
          // the difference between a ledger and a list of amounts.
          tooltip={
            isIncome
              ? "Only if it belongs under one of the expense headings."
              : "Salary, rent, electricity — this is what the profit and loss groups by."
          }
        >
          <Select
            showSearch
            allowClear={isIncome}
            optionFilterProp="label"
            placeholder="Choose a heading"
            options={categories.map((row) => ({
              label: row.name,
              value: row._id,
            }))}
            // Typing a heading that does not exist yet offers to create it,
            // so a missing heading never becomes a reason to skip the field.
            notFoundContent={
              <button
                type="button"
                className="w-full rounded px-2 py-1.5 text-left text-[13px] text-primary-700 hover:bg-primary-50"
                onClick={(event) => {
                  const input = (
                    event.currentTarget.closest(".ant-select") as HTMLElement
                  )?.querySelector("input");
                  addCategory((input as HTMLInputElement)?.value ?? "");
                }}
              >
                + Add as a new heading
              </button>
            }
          />
        </Form.Item>

        <Form.Item
          label="How the money moved"
          name="method"
          rules={[{ required: true, message: "Pick how it was paid" }]}
          tooltip="Cash flow groups by this. Left blank it reads as 'Not recorded'."
        >
          <Select options={METHOD_OPTIONS} placeholder="Cash, bKash, bank…" />
        </Form.Item>
      </div>

      {isIncome && kind === "passthrough" && (
        <Form.Item label="Who the deal was with" name="party">
          <Input placeholder="Buyer or supplier name" />
        </Form.Item>
      )}

      <Form.Item
        label={isIncome ? "Reason (why it came in)" : "Reason (why it went out)"}
        name="reason"
        rules={[{ required: true, message: "Enter a reason" }]}
      >
        <Input.TextArea rows={2} placeholder="Describe the reason…" />
      </Form.Item>

      <div className="grid gap-x-4 sm:grid-cols-2">
        <Form.Item
          label="Reference"
          name="reference"
          tooltip="Transaction id, cheque number, voucher — whatever proves it."
        >
          <Input placeholder="Optional" />
        </Form.Item>

        <Form.Item
          label="This is a refund"
          name="isRefund"
          valuePropName="checked"
          tooltip={
            isIncome
              ? "Money given back to a customer. Lowers Income rather than adding to Expense."
              : "Money a supplier gave back. Lowers Expense rather than adding to Income."
          }
        >
          <Switch />
        </Form.Item>
      </div>
    </AppFormModal>
  );
};

export default TransactionModal;
