import { Button, Form, Input, Modal, Switch } from "antd";
import { Save } from "lucide-react";
import React, { useEffect } from "react";
import { toast } from "react-toastify";
import { useCreateDesignationMutation } from "../../../../redux/features/designation/designationApi";

interface CreateDesignationModalProps {
  open: boolean;
  setOpen: (value: boolean) => void;
}

const CreateDesignationModal: React.FC<CreateDesignationModalProps> = ({
  open,
  setOpen,
}) => {
  const [form] = Form.useForm();
  const [createDesignation, { isLoading }] = useCreateDesignationMutation();

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ is_active: true });
    }
  }, [open, form]);

  const handleSubmit = async (values: {
    name: string;
    description?: string;
    is_active?: boolean;
  }) => {
    try {
      await createDesignation(values).unwrap();
      toast.success("Designation created successfully!");
      form.resetFields();
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create designation");
    }
  };

  return (
    <Modal
      title="Create Designation"
      open={open}
      onCancel={() => setOpen(false)}
      width={600}
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Please enter designation name" }]}
        >
          <Input placeholder="e.g. Accountant, Cashier, Store Manager" />
        </Form.Item>

        <Form.Item label="Description" name="description">
          <Input.TextArea rows={3} placeholder="Enter description (optional)" />
        </Form.Item>

        <Form.Item label="Status" name="is_active" valuePropName="checked">
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
            Create Designation
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateDesignationModal;
