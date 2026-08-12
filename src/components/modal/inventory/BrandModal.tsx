import { Form, Input, Switch } from "antd";
import { toast } from "react-toastify";
import {
  IBrand,
  useCreateBrandMutation,
  useUpdateBrandMutation,
} from "../../../redux/features/inventory/brandApi";
import { FormInput } from "../../Form/FormInput";
import UploadImage from "../../shared/UploadImage";
import AppFormModal from "./AppFormModal";

const BrandModal = ({
  open,
  setOpen,
  data,
  onCreated,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  data?: IBrand | null;
  /** Called with the new brand so a picker that opened this can select it. */
  onCreated?: (created: IBrand) => void;
}) => {
  const [form] = Form.useForm();
  const [createBrand, { isLoading: creating }] = useCreateBrandMutation();
  const [updateBrand, { isLoading: updating }] = useUpdateBrandMutation();

  const isEditing = Boolean(data?._id);
  const loading = creating || updating;

  const handleSubmit = async (values: Partial<IBrand>) => {
    const payload = {
      name: values.name?.trim(),
      logo: values.logo || null,
      description: values.description?.trim() || "",
      isActive: values.isActive ?? true,
    };

    try {
      if (isEditing) {
        await updateBrand({ id: data!._id, data: payload }).unwrap();
        toast.success("Brand updated successfully");
      } else {
        const response = await createBrand(payload).unwrap();
        toast.success("Brand created successfully");
        onCreated?.(response?.data);
      }
      setOpen(false);
      form.resetFields();
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
          `Failed to ${isEditing ? "update" : "create"} brand`
      );
    }
  };

  return (
    <AppFormModal
      open={open}
      setOpen={setOpen}
      entity="Brand"
      isEditing={isEditing}
      loading={loading}
      form={form}
      onSubmit={handleSubmit}
      initialValues={{
        name: data?.name ?? "",
        logo: data?.logo ?? null,
        description: data?.description ?? "",
        isActive: data?.isActive ?? true,
      }}
    >
      <Form.Item label="Logo" name="logo">
        <UploadImage form={form} fieldPath="logo" />
      </Form.Item>

      <FormInput
        label="Brand Name"
        name="name"
        rules={[
          { required: true, message: "Name is required" },
          { max: 100, message: "Name must be 100 characters or fewer" },
        ]}
        placeholder="e.g. Samsung"
      />

      <Form.Item
        label="Description"
        name="description"
        rules={[{ max: 500, message: "Description must be 500 characters or fewer" }]}
      >
        <Input.TextArea rows={3} placeholder="Optional short description" />
      </Form.Item>

      <Form.Item label="Status" name="isActive" valuePropName="checked">
        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
      </Form.Item>
    </AppFormModal>
  );
};

export default BrandModal;
