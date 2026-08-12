import { Form, Input, InputNumber, Switch } from "antd";
import { toast } from "react-toastify";
import {
  IWarranty,
  useCreateWarrantyMutation,
  useUpdateWarrantyMutation,
  WARRANTY_PERIODS,
} from "../../../redux/features/inventory/warrantyApi";
import { FormInput } from "../../Form/FormInput";
import { FormSelect } from "../../Form/FormSelect";
import InventoryFormModal from "./InventoryFormModal";

const WarrantyModal = ({
  open,
  setOpen,
  data,
  onCreated,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  data?: IWarranty | null;
  /** Called with the new warranty so a picker that opened this can select it. */
  onCreated?: (created: IWarranty) => void;
}) => {
  const [form] = Form.useForm();
  const [createWarranty, { isLoading: creating }] = useCreateWarrantyMutation();
  const [updateWarranty, { isLoading: updating }] = useUpdateWarrantyMutation();

  const isEditing = Boolean(data?._id);
  const loading = creating || updating;

  const handleSubmit = async (values: any) => {
    const payload = {
      name: values.name?.trim(),
      // The API validates `duration` as an integer, and AntD's InputNumber
      // hands back a string when the field is typed into rather than stepped.
      duration: Number(values.duration),
      period: values.period,
      description: values.description?.trim() || "",
      isActive: values.isActive ?? true,
    };

    try {
      if (isEditing) {
        await updateWarranty({ id: data!._id, data: payload }).unwrap();
        toast.success("Warranty updated successfully");
      } else {
        const response = await createWarranty(payload).unwrap();
        toast.success("Warranty created successfully");
        onCreated?.(response?.data);
      }
      setOpen(false);
      form.resetFields();
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
          `Failed to ${isEditing ? "update" : "create"} warranty`
      );
    }
  };

  return (
    <InventoryFormModal
      open={open}
      setOpen={setOpen}
      entity="Warranty"
      isEditing={isEditing}
      loading={loading}
      form={form}
      onSubmit={handleSubmit}
      initialValues={{
        name: data?.name ?? "",
        duration: data?.duration ?? 1,
        period: data?.period ?? "Months",
        description: data?.description ?? "",
        isActive: data?.isActive ?? true,
      }}
    >
      <FormInput
        label="Warranty Name"
        name="name"
        rules={[
          { required: true, message: "Name is required" },
          { max: 100, message: "Name must be 100 characters or fewer" },
        ]}
        placeholder="e.g. 1 Year Manufacturer Warranty"
      />

      <div className="grid sm:grid-cols-2 gap-x-4">
        <Form.Item
          label="Duration"
          name="duration"
          rules={[
            { required: true, message: "Duration is required" },
            {
              type: "number",
              min: 1,
              message: "Duration must be at least 1",
              transform: (value) => Number(value),
            },
          ]}
        >
          <InputNumber min={1} precision={0} className="w-full" />
        </Form.Item>

        <FormSelect
          label="Period"
          name="period"
          placeholder="Select a period"
          allowClear={false}
          rules={[{ required: true, message: "Period is required" }]}
          options={WARRANTY_PERIODS.map((period) => ({
            label: period,
            value: period,
          }))}
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
    </InventoryFormModal>
  );
};

export default WarrantyModal;
