import { Form, Switch } from "antd";
import { toast } from "react-toastify";
import {
  IPaymentProvider,
  useCreatePaymentProviderMutation,
  useUpdatePaymentProviderMutation,
} from "../../../redux/features/settings/paymentProviderApi";
import { FormInput } from "../../Form/FormInput";
import { FormSelect } from "../../Form/FormSelect";
import AppFormModal from "../shared/AppFormModal";

/**
 * The banks and wallets a vendor can be paid through.
 *
 * Kept as records rather than typed in on each vendor so "City Bank", "City
 * bank" and "CityBank" cannot all exist — the same reason expense headings are
 * a list and not free text.
 */
const ProviderModal = ({
  open,
  setOpen,
  data,
  onCreated,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  data?: IPaymentProvider | null;
  onCreated?: (created: IPaymentProvider) => void;
}) => {
  const [form] = Form.useForm();
  const [createProvider, { isLoading: creating }] =
    useCreatePaymentProviderMutation();
  const [updateProvider, { isLoading: updating }] =
    useUpdatePaymentProviderMutation();

  const isEditing = Boolean(data?._id);

  const handleSubmit = async (values: {
    name: string;
    type: string;
    isActive?: boolean;
  }) => {
    const payload = {
      name: values.name?.trim(),
      type: values.type,
      isActive: values.isActive ?? true,
    };

    try {
      if (isEditing) {
        await updateProvider({ id: data!._id, data: payload }).unwrap();
        toast.success("Provider updated successfully");
      } else {
        const response = await createProvider(payload).unwrap();
        toast.success("Provider created successfully");
        onCreated?.(response?.data);
      }
      setOpen(false);
      form.resetFields();
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
          `Failed to ${isEditing ? "update" : "create"} provider`
      );
    }
  };

  return (
    <AppFormModal
      open={open}
      setOpen={setOpen}
      entity="Payment Provider"
      isEditing={isEditing}
      loading={creating || updating}
      form={form}
      onSubmit={handleSubmit}
      initialValues={{
        name: data?.name ?? "",
        type: data?.type ?? "Mobile Banking",
        isActive: data?.isActive ?? true,
      }}
    >
      <FormInput
        label="Provider Name"
        name="name"
        rules={[
          { required: true, message: "Name is required" },
          { max: 80, message: "Name is too long" },
        ]}
        placeholder="e.g. bKash, City Bank"
      />
      <FormSelect
        label="Provider Type"
        name="type"
        rules={[{ required: true, message: "Type is required" }]}
        tooltip="Decides which fields a vendor's payment method asks for"
        options={[
          { label: "Bank", value: "Bank" },
          { label: "Mobile Banking", value: "Mobile Banking" },
          { label: "Card", value: "Card" },
          { label: "Payment Gateway", value: "Payment Gateway" },
          { label: "Digital Wallet", value: "Digital Wallet" },
          { label: "Cash", value: "Cash" },
          { label: "Check", value: "Check" },
          { label: "Other", value: "Other" },
        ]}
      />
      <Form.Item label="Status" name="isActive" valuePropName="checked">
        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
      </Form.Item>
    </AppFormModal>
  );
};

export default ProviderModal;
