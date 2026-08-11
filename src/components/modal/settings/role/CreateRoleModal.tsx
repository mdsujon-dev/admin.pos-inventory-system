import { Button, Form, Input, Modal, Switch } from "antd";
import { Save } from "lucide-react";
import React, { useEffect } from "react";
import { toast } from "react-toastify";
import { useCreateRoleMutation } from "../../../../redux/features/role/roleApi";

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
    <Modal
      title="Create Role"
      open={open}
      onCancel={() => setOpen(false)}
      width={600}
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
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

        <Form.Item>
          <Button
            type="primary"
            icon={<Save className="w-4 h-4" />}
            onClick={() => form.submit()}
            loading={isLoading}
            block
          >
            Create Role
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateRoleModal;
