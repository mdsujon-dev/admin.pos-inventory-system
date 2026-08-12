import { Form, Input, Switch } from "antd";
import React, { useEffect } from "react";
import { toast } from "react-toastify";
import { useUpdateRoleMutation } from "../../../../redux/features/role/roleApi";
import AppFormModal from "../../shared/AppFormModal";

interface UpdateRoleModalProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  data: {
    _id: string;
    role: string;
    description?: string;
    isActive?: boolean;
  };
}

const UpdateRoleModal: React.FC<UpdateRoleModalProps> = ({
  open,
  setOpen,
  data,
}) => {
  const [form] = Form.useForm();
  const [updateRole, { isLoading }] = useUpdateRoleMutation();

  useEffect(() => {
    if (open && data) {
      form.setFieldsValue({
        role: data.role,
        description: data.description,
        isActive: data.isActive ?? true,
      });
    }
  }, [open, data, form]);

  const handleSubmit = async (values: {
    role?: string;
    description?: string;
    isActive?: boolean;
  }) => {
    try {
      await updateRole({
        id: data._id,
        data: {
          ...values,
          role: values.role?.trim().toUpperCase(),
        },
      }).unwrap();
      toast.success("Role updated successfully!");
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update role");
    }
  };

  return (
    <AppFormModal
      entity="Role"
      isEditing={true}
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
        >
          <Input placeholder="e.g., Manager, HR" />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <Input.TextArea rows={3} placeholder="Describe the role..." />
        </Form.Item>

        <Form.Item label="Status" name="isActive" valuePropName="checked">
          <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
        </Form.Item>

    </AppFormModal>
  );
};

export default UpdateRoleModal;
