import { Form, Input, Switch } from "antd";
import { toast } from "react-toastify";
import {
  IVendor,
  useCreateVendorMutation,
  useUpdateVendorMutation,
} from "../../../redux/features/purchasing/vendorApi";
import { FormInput } from "../../Form/FormInput";
import InventoryFormModal from "../inventory/InventoryFormModal";

const VendorModal = ({
  open,
  setOpen,
  data,
  onCreated,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  data?: IVendor | null;
  /** Called with the new vendor so a purchase form can select it. */
  onCreated?: (created: IVendor) => void;
}) => {
  const [form] = Form.useForm();
  const [createVendor, { isLoading: creating }] = useCreateVendorMutation();
  const [updateVendor, { isLoading: updating }] = useUpdateVendorMutation();

  const isEditing = Boolean(data?._id);
  const loading = creating || updating;

  const handleSubmit = async (values: Partial<IVendor>) => {
    const payload = {
      name: values.name?.trim(),
      company: values.company?.trim() || "",
      phone: values.phone?.trim(),
      email: values.email?.trim() || "",
      address: values.address?.trim() || "",
      note: values.note?.trim() || "",
      isActive: values.isActive ?? true,
    };

    try {
      if (isEditing) {
        await updateVendor({ id: data!._id, data: payload }).unwrap();
        toast.success("Vendor updated successfully");
      } else {
        const response = await createVendor(payload).unwrap();
        toast.success("Vendor created successfully");
        onCreated?.(response?.data);
      }
      setOpen(false);
      form.resetFields();
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
          `Failed to ${isEditing ? "update" : "create"} vendor`
      );
    }
  };

  return (
    <InventoryFormModal
      open={open}
      setOpen={setOpen}
      entity="Vendor"
      isEditing={isEditing}
      loading={loading}
      form={form}
      onSubmit={handleSubmit}
      initialValues={{
        name: data?.name ?? "",
        company: data?.company ?? "",
        phone: data?.phone ?? "",
        email: data?.email ?? "",
        address: data?.address ?? "",
        note: data?.note ?? "",
        isActive: data?.isActive ?? true,
      }}
    >
      <div className="grid gap-x-4 sm:grid-cols-2">
        <FormInput
          label="Contact Name"
          name="name"
          rules={[
            { required: true, message: "Name is required" },
            { max: 120, message: "Name is too long" },
          ]}
          placeholder="e.g. Rahim Uddin"
        />
        <FormInput
          label="Company"
          name="company"
          placeholder="e.g. Rahim Traders"
        />
        <FormInput
          label="Phone"
          name="phone"
          help="This is the vendor's identity — one number, one supplier"
          rules={[{ required: true, message: "A phone number is required" }]}
          placeholder="e.g. 01711223344"
        />
        <FormInput label="Email" name="email" placeholder="Optional" />
      </div>

      <Form.Item label="Address" name="address">
        <Input.TextArea rows={2} placeholder="Optional" />
      </Form.Item>

      <Form.Item label="Note" name="note">
        <Input.TextArea rows={2} placeholder="Payment terms, delivery days…" />
      </Form.Item>

      <Form.Item label="Status" name="isActive" valuePropName="checked">
        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
      </Form.Item>
    </InventoryFormModal>
  );
};

export default VendorModal;
