import { DatePicker, Form, Input, Modal, Switch } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { toast } from "react-toastify";
import { useCompleteFollowUpMutation } from "../../../redux/features/crm/crmApi";

interface Props {
  /** The promise being ticked off. */
  activity: { _id: string; summary: string; customer?: { name?: string } };
  open: boolean;
  setOpen: (value: boolean) => void;
}

/**
 * Ticking off a follow-up, with what came of it.
 *
 * The outcome is the point. A follow-up marked done and nothing else looks
 * handled from the outside while telling the next person to ring the customer
 * absolutely nothing — which is how the same conversation gets had twice.
 *
 * Scheduling the next one lives here too, because "call back Thursday" is the
 * most common outcome there is, and asking for it in a second place is asking
 * for it to be forgotten.
 */
const CompleteFollowUpModal = ({ activity, open, setOpen }: Props) => {
  const [form] = Form.useForm();
  const [completeFollowUp, { isLoading }] = useCompleteFollowUpMutation();
  const [again, setAgain] = useState(false);

  const onFinish = async (values: any) => {
    try {
      const result = await completeFollowUp({
        id: activity._id,
        data: {
          outcome: values.outcome?.trim() || undefined,
          nextFollowUpAt: again
            ? values.nextFollowUpAt?.toISOString()
            : undefined,
          nextSummary: again ? values.nextSummary?.trim() : undefined,
        },
      }).unwrap();
      toast.success(result?.message || "Marked done");
      form.resetFields();
      setAgain(false);
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.data?.message || "Could not mark it done");
    }
  };

  return (
    <Modal
      title="How did it go?"
      open={open}
      onCancel={() => setOpen(false)}
      onOk={() => form.submit()}
      okText="Mark done"
      okButtonProps={{ loading: isLoading }}
      destroyOnHidden
      width={560}
    >
      <p className="m-0 mb-3 rounded-lg border border-secondary-100 bg-secondary-50 px-3 py-2 text-[13px] text-secondary-600">
        {activity.customer?.name ? (
          <>
            <span className="font-semibold text-secondary-800">
              {activity.customer.name}
            </span>{" "}
            ·{" "}
          </>
        ) : null}
        {activity.summary}
      </p>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ nextFollowUpAt: dayjs().add(7, "day") }}
      >
        <Form.Item
          label="What happened"
          name="outcome"
          tooltip="Goes into the customer's history as its own entry, dated today."
          rules={[{ required: true, message: "Write down what came of it" }]}
        >
          <Input.TextArea
            rows={3}
            placeholder="Spoke to him — will settle the balance on Sunday"
          />
        </Form.Item>

        <div className="mb-3 flex items-center gap-2">
          <Switch checked={again} onChange={setAgain} size="small" />
          <span className="text-[13px] text-secondary-700">
            Needs another follow-up
          </span>
        </div>

        {again && (
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Form.Item
              label="Next one due"
              name="nextFollowUpAt"
              rules={[{ required: true, message: "Pick a date" }]}
            >
              <DatePicker className="w-full" format="DD MMM YYYY" />
            </Form.Item>
            <Form.Item label="About" name="nextSummary">
              <Input placeholder="Leave blank to reuse this one" />
            </Form.Item>
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default CompleteFollowUpModal;
