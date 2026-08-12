import { Form, Input, Switch } from "antd";
import { useEffect } from "react";
import { toast } from "react-toastify";
import FormModal from "../../../components/Form/FormModal";
import { FormInput } from "../../../components/Form/FormInput";
import { FormSelect } from "../../../components/Form/FormSelect";
import {
  IPaymentProvider,
  useCreatePaymentProviderMutation,
  useUpdatePaymentProviderMutation,
} from "../../../redux/features/settings/paymentProviderApi";

const ProviderModal = ({
  open,
  setOpen,
  data,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  data?: IPaymentProvider | null;
}) => {
  const [form] = Form.useForm();
  const [createProvider, { isLoading: creating }] = useCreatePaymentProviderMutation();
  const [updateProvider, { isLoading: updating }] = useUpdatePaymentProviderMutation();

  const isEditing = Boolean(data?._id);

  useEffect(() => {
    if (open) {
      if (data) {
        form.setFieldsValue({
          name: data.name,
          type: data.type,
          isActive: data.isActive,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ isActive: true, type: "Mobile Banking" });
      }
    }
  }, [data, form, open]);

  const handleSubmit = async (values: any) => {
    const payload = {
      name: values.name.trim(),
      type: values.type,
      isActive: values.isActive ?? true,
    };

    try {
      if (isEditing) {
        await updateProvider({ id: data!._id, data: payload }).unwrap();
        toast.success("Provider updated successfully");
      } else {
        await createProvider(payload).unwrap();
        toast.success("Provider created successfully");
      }
      setOpen(false);
      form.resetFields();
    } catch (error: any) {
      toast.error(error?.data?.message || "Something went wrong");
    }
  };

  return (
    <FormModal
      open={open}
      setOpen={setOpen}
      title={isEditing ? "Edit Provider" : "Add Provider"}
      form={form}
      onSubmit={handleSubmit}
      loading={creating || updating}
    >
      <FormInput
        label="Provider Name"
        name="name"
        rules={[{ required: true, message: "Name is required" }]}
        placeholder="e.g. bKash, City Bank"
      />
      <FormSelect
        label="Provider Type"
        name="type"
        rules={[{ required: true, message: "Type is required" }]}
        options={[
          { label: "Bank", value: "Bank" },
          { label: "Mobile Banking", value: "Mobile Banking" },
          { label: "Other", value: "Other" },
        ]}
      />
      <Form.Item label="Active Status" name="isActive" valuePropName="checked">
        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
      </Form.Item>
    </FormModal>
  );
};

export default ProviderModal;
