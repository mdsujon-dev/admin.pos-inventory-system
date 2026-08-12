import { Form, Input, InputNumber } from "antd";
import React, { useEffect } from "react";
import { toast } from "react-toastify";
import { TakaIcon } from "../../shared/Icon";
import {
  useAddTransactionMutation,
  useUpdateTransactionMutation,
} from "../../../redux/features/transaction/transactionApi";
import AppFormModal from "../shared/AppFormModal";

interface Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  type: "income" | "expense";
  record?: any; // present → edit mode
}

const TransactionModal: React.FC<Props> = ({ open, setOpen, type, record }) => {
  const [form] = Form.useForm();
  const [addTransaction, { isLoading: adding }] = useAddTransactionMutation();
  const [updateTransaction, { isLoading: updating }] =
    useUpdateTransactionMutation();
  const isEdit = !!record;
  const label = type === "income" ? "Income" : "Expense";

  useEffect(() => {
    if (open) {
      if (record) {
        form.setFieldsValue({ amount: record.amount, reason: record.reason });
      } else {
        form.resetFields();
      }
    }
  }, [open, record, form]);

  const onFinish = async (values: any) => {
    // Date is set automatically by the server (entry's own date).
    const data = { amount: Number(values.amount), reason: values.reason };
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

  return (
    <AppFormModal
      title={`${isEdit ? "Edit" : "Add"} ${label} Entry`}
      entity="Transaction"
      isEditing={isEdit}
      open={open}
      setOpen={setOpen}
      width={560}
      form={form}
      onSubmit={onFinish}
      loading={adding || updating}
    >
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
            size="middle"
            min={0}
            controls={false}
            placeholder="0"
            prefix={<TakaIcon className="text-secondary-400" />}
            // Block any non-numeric keystroke — only digits and a decimal point.
            onKeyDown={(e) => {
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
            }}
          />
        </Form.Item>
        <Form.Item
          label={
            type === "income" ? "Reason (why it came in)" : "Reason (why it went out)"
          }
          name="reason"
          rules={[{ required: true, message: "Enter a reason" }]}
        >
          <Input.TextArea rows={3} placeholder="Describe the reason…" />
        </Form.Item>
    </AppFormModal>
  );
};

export default TransactionModal;
