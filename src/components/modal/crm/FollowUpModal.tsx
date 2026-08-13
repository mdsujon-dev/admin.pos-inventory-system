import { DatePicker, Form, Input, Modal, Select } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { toast } from "react-toastify";
import {
  useLogActivityMutation,
} from "../../../redux/features/crm/crmApi";
import { useGetCustomersQuery } from "../../../redux/features/sales/customerApi";

interface Props {
  open: boolean;
  setOpen: (value: boolean) => void;
  /** Pre-selected when opened from a customer's own profile. */
  customerId?: string;
}

const TYPES = [
  { value: "call", label: "Phone call" },
  { value: "visit", label: "Visit" },
  { value: "sms", label: "Message" },
  { value: "complaint", label: "Complaint" },
  { value: "note", label: "Note" },
];

/**
 * Promising to get back to somebody, written down.
 *
 * The date is the required part, not the note: a reminder with no date is the
 * thing this whole screen exists to replace.
 */
const FollowUpModal = ({ open, setOpen, customerId }: Props) => {
  const [form] = Form.useForm();
  const [logActivity, { isLoading }] = useLogActivityMutation();
  const [search, setSearch] = useState("");

  // Only fetched while the picker is needed, and searched server-side so a
  // long customer list does not have to be pulled down to find one person.
  const { data: customerData, isFetching: loadingCustomers } =
    useGetCustomersQuery(
      [
        { name: "limit", value: 20 },
        ...(search ? [{ name: "keyword", value: search }] : []),
      ],
      { skip: !open || !!customerId }
    );

  const customers = customerData?.data?.data ?? [];

  const onFinish = async (values: any) => {
    try {
      await logActivity({
        customer: customerId ?? values.customer,
        type: values.type,
        summary: values.summary,
        detail: values.detail?.trim() || undefined,
        followUpAt: values.followUpAt.toISOString(),
      }).unwrap();
      toast.success("Follow-up scheduled");
      form.resetFields();
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not schedule that");
    }
  };

  return (
    <Modal
      title="Schedule a follow-up"
      open={open}
      onCancel={() => setOpen(false)}
      onOk={() => form.submit()}
      okText="Schedule"
      okButtonProps={{ loading: isLoading }}
      destroyOnHidden
      width={560}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ type: "call", followUpAt: dayjs().add(1, "day") }}
      >
        {!customerId && (
          <Form.Item
            label="Customer"
            name="customer"
            rules={[{ required: true, message: "Who is this about?" }]}
          >
            <Select
              showSearch
              placeholder="Search by name or phone"
              filterOption={false}
              onSearch={setSearch}
              loading={loadingCustomers}
              options={customers.map((row: any) => ({
                value: row._id,
                label: `${row.name}${row.phone ? ` — ${row.phone}` : ""}`,
              }))}
            />
          </Form.Item>
        )}

        <div className="grid gap-x-4 sm:grid-cols-2">
          <Form.Item label="What kind" name="type">
            <Select options={TYPES} />
          </Form.Item>

          <Form.Item
            label="Due on"
            name="followUpAt"
            rules={[{ required: true, message: "Pick a date" }]}
            tooltip="It appears on this list from this day, and stays until it is done."
          >
            <DatePicker className="w-full" format="DD MMM YYYY" />
          </Form.Item>
        </div>

        <Form.Item
          label="What is it about"
          name="summary"
          rules={[{ required: true, message: "One line is enough" }]}
        >
          <Input placeholder="Ask about the pending order" />
        </Form.Item>

        <Form.Item label="Anything else" name="detail">
          <Input.TextArea rows={2} placeholder="Optional" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FollowUpModal;
