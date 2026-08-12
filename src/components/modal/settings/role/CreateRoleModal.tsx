import { Form, Input, Switch } from "antd";
import React, { useEffect } from "react";
import { toast } from "react-toastify";
import { useCreateRoleMutation } from "../../../../redux/features/role/roleApi";
import AppFormModal from "../../shared/AppFormModal";

interface CreateRoleModalProps {
  open: boolean;
  setOpen: (value: boolean) => void;
}

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({ open, setOpen }) => {
  const [form] = Form.useForm();
  const [createRole, { isLoading }] = useCreateRoleMutation();

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ isActive: true });
    }
  }, [open, form]);

  const handleSubmit = async (values: {
    role: string;
    description?: string;
    isActive?: boolean;
  }) => {
    try {
      await createRole({
        ...values,
        role: values.role?.trim().toUpperCase(),
      }).unwrap();
      toast.success("Role created successfully!");
      form.resetFields();
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create role");
    }
  };

  return (
    <AppFormModal
      entity="Role"
      isEditing={false}
      open={open}
      setOpen={setOpen}
      width={600}
      form={form}
      onSubmit={handleSubmit}
      loading={isLoading}
    >
        <Form.Item
          label="Role Name"
          name="role"
          rules={[{ required: true, message: "Please enter role name" }]}
          extra="Will be stored in uppercase (e.g., MANAGER, HR)"
        >
          <Input placeholder="e.g., Manager, HR, Content Editor" />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <Input.TextArea
            rows={3}
            placeholder="Describe the role and its responsibilities..."
          />
        </Form.Item>

        <Form.Item label="Status" name="isActive" valuePropName="checked">
          <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
        </Form.Item>

    </AppFormModal>
  );
};

export default CreateRoleModal;
