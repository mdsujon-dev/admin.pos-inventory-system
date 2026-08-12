import { Form, Select, Switch } from "antd";
import { toast } from "react-toastify";
import {
  IVariantAttribute,
  useCreateVariantAttributeMutation,
  useUpdateVariantAttributeMutation,
} from "../../../redux/features/inventory/variantAttributeApi";
import { FormInput } from "../../Form/FormInput";
import AppFormModal from "./AppFormModal";

const VariantAttributeModal = ({
  open,
  setOpen,
  data,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  data?: IVariantAttribute | null;
}) => {
  const [form] = Form.useForm();
  const [createVariantAttribute, { isLoading: creating }] =
    useCreateVariantAttributeMutation();
  const [updateVariantAttribute, { isLoading: updating }] =
    useUpdateVariantAttributeMutation();

  const isEditing = Boolean(data?._id);
  const loading = creating || updating;

  const handleSubmit = async (values: Partial<IVariantAttribute>) => {
    const cleanedValues = (values.values || [])
      .map((value) => value.trim())
      .filter(Boolean);

    const payload = {
      name: values.name?.trim(),
      values: cleanedValues,
      isActive: values.isActive ?? true,
    };

    try {
      if (isEditing) {
        await updateVariantAttribute({ id: data!._id, data: payload }).unwrap();
        toast.success("Variant attribute updated successfully");
      } else {
        await createVariantAttribute(payload).unwrap();
        toast.success("Variant attribute created successfully");
      }
      setOpen(false);
      form.resetFields();
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
          `Failed to ${isEditing ? "update" : "create"} variant attribute`
      );
    }
  };

  return (
    <AppFormModal
      open={open}
      setOpen={setOpen}
      entity="Variant Attribute"
      isEditing={isEditing}
      loading={loading}
      form={form}
      onSubmit={handleSubmit}
      initialValues={{
        name: data?.name ?? "",
        values: data?.values ?? [],
        isActive: data?.isActive ?? true,
      }}
    >
      <FormInput
        label="Attribute Name"
        name="name"
        rules={[
          { required: true, message: "Name is required" },
          { max: 60, message: "Name must be 60 characters or fewer" },
        ]}
        placeholder="e.g. Color"
      />

      <Form.Item
        label="Values"
        name="values"
        tooltip="Type a value and press Enter. These become the choices a product can vary along."
        rules={[
          {
            validator: (_, value: string[] = []) => {
              const cleaned = value.map((v) => v.trim()).filter(Boolean);
              if (cleaned.length === 0) {
                return Promise.reject("At least one value is required");
              }
              // Two identical values would multiply out into two identical
              // variant rows on the product form, each holding its own stock.
              const unique = new Set(cleaned.map((v) => v.toLowerCase()));
              if (unique.size !== cleaned.length) {
                return Promise.reject("Values must be unique");
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <Select
          mode="tags"
          tokenSeparators={[","]}
          placeholder="e.g. Red, Blue, Green"
          open={false}
          suffixIcon={null}
        />
      </Form.Item>

      <Form.Item label="Status" name="isActive" valuePropName="checked">
        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
      </Form.Item>
    </AppFormModal>
  );
};

export default VariantAttributeModal;
