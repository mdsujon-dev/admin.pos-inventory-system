import { Form, Input, Switch } from "antd";
import { toast } from "react-toastify";
import {
  IUnit,
  useCreateUnitMutation,
  useUpdateUnitMutation,
} from "../../../redux/features/inventory/unitApi";
import { FormInput } from "../../Form/FormInput";
import AppFormModal from "./AppFormModal";

const UnitModal = ({
  open,
  setOpen,
  data,
  onCreated,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  data?: IUnit | null;
  /** Called with the new unit so a picker that opened this can select it. */
  onCreated?: (created: IUnit) => void;
}) => {
  const [form] = Form.useForm();
  const [createUnit, { isLoading: creating }] = useCreateUnitMutation();
  const [updateUnit, { isLoading: updating }] = useUpdateUnitMutation();

  const isEditing = Boolean(data?._id);
  const loading = creating || updating;

  const handleSubmit = async (values: Partial<IUnit>) => {
    const payload = {
      name: values.name?.trim(),
      shortName: values.shortName?.trim(),
      description: values.description?.trim() || "",
      isActive: values.isActive ?? true,
    };

    try {
      if (isEditing) {
        await updateUnit({ id: data!._id, data: payload }).unwrap();
        toast.success("Unit updated successfully");
      } else {
        const response = await createUnit(payload).unwrap();
        toast.success("Unit created successfully");
        onCreated?.(response?.data);
      }
      setOpen(false);
      form.resetFields();
    } catch (error: any) {
      toast.error(
        error?.data?.message || `Failed to ${isEditing ? "update" : "create"} unit`
      );
    }
  };

  return (
    <AppFormModal
      open={open}
      setOpen={setOpen}
      entity="Unit"
      isEditing={isEditing}
      loading={loading}
      form={form}
      onSubmit={handleSubmit}
      initialValues={{
        name: data?.name ?? "",
        shortName: data?.shortName ?? "",
        description: data?.description ?? "",
        isActive: data?.isActive ?? true,
      }}
    >
      <div className="grid sm:grid-cols-2 gap-x-4">
        <FormInput
          label="Unit Name"
          name="name"
          rules={[
            { required: true, message: "Name is required" },
            { max: 50, message: "Name must be 50 characters or fewer" },
          ]}
          placeholder="e.g. Kilogram"
        />
        <FormInput
          label="Short Name"
          name="shortName"
          rules={[
            { required: true, message: "Short name is required" },
            { max: 10, message: "Short name must be 10 characters or fewer" },
          ]}
          placeholder="e.g. kg"
        />
      </div>

      <Form.Item
        label="Description"
        name="description"
        rules={[{ max: 300, message: "Description must be 300 characters or fewer" }]}
      >
        <Input.TextArea rows={3} placeholder="Optional short description" />
      </Form.Item>

      <Form.Item label="Status" name="isActive" valuePropName="checked">
        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
      </Form.Item>
    </AppFormModal>
  );
};

export default UnitModal;
