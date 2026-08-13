import { Form, Input, Switch } from "antd";
import { toast } from "react-toastify";
import {
  ICustomer,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
} from "../../../redux/features/sales/customerApi";
import { FormInput } from "../../Form/FormInput";
import AppFormModal from "../shared/AppFormModal";

const CustomerModal = ({
  open,
  setOpen,
  data,
  onCreated,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  data?: ICustomer | null;
  onCreated?: (created: ICustomer) => void;
}) => {
  const [form] = Form.useForm();
  const [createCustomer, { isLoading: creating }] = useCreateCustomerMutation();
  const [updateCustomer, { isLoading: updating }] = useUpdateCustomerMutation();

  const isEditing = Boolean(data?._id);

  const handleSubmit = async (values: Partial<ICustomer>) => {
    const payload = {
      name: values.name?.trim(),
      phone: values.phone?.trim(),
      email: values.email?.trim() || "",
      address: values.address?.trim() || "",
      note: values.note?.trim() || "",
      isActive: values.isActive ?? true,
    };

    try {
      if (isEditing) {
        await updateCustomer({ id: data!._id, data: payload }).unwrap();
        toast.success("Customer updated successfully");
      } else {
        const response = await createCustomer(payload).unwrap();
        toast.success("Customer created successfully");
        onCreated?.(response?.data);
      }
      setOpen(false);
      form.resetFields();
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
          `Failed to ${isEditing ? "update" : "create"} customer`
      );
    }
  };

  return (
    <AppFormModal
      open={open}
      setOpen={setOpen}
      entity="Customer"
      isEditing={isEditing}
      loading={creating || updating}
      form={form}
      onSubmit={handleSubmit}
      initialValues={{
        name: data?.name ?? "",
        phone: data?.phone ?? "",
        email: data?.email ?? "",
        address: data?.address ?? "",
        note: data?.note ?? "",
        isActive: data?.isActive ?? true,
      }}
    >
      <div className="grid gap-x-4 sm:grid-cols-2">
        <FormInput
          label="Name"
          name="name"
          rules={[
            { required: true, message: "Name is required" },
            { max: 120, message: "Name is too long" },
          ]}
          placeholder="e.g. Karim Mia"
        />
        <FormInput
          label="Phone"
          name="phone"
          tooltip="This is the customer's identity — one number, one person"
          rules={[{ required: true, message: "A phone number is required" }]}
          placeholder="e.g. 01711223344"
        />
      </div>

      <FormInput label="Email" name="email" placeholder="Optional" />

      <Form.Item label="Address" name="address">
        <Input.TextArea rows={2} placeholder="Optional" />
      </Form.Item>

      <Form.Item label="Note" name="note">
        <Input.TextArea rows={2} placeholder="Anything worth remembering" />
      </Form.Item>

      <Form.Item label="Status" name="isActive" valuePropName="checked">
        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
      </Form.Item>
    </AppFormModal>
  );
};

export default CustomerModal;
