import { Button, Form, Input, Modal } from "antd";
import React, { useEffect } from "react";
import { toast } from "react-toastify";
import { FormInput } from "../../../components/Form/FormInput";
import { FormSelect } from "../../../components/Form/FormSelect";
import { useGetDesignationsQuery } from "../../../redux/features/designation/designationApi";
import { useGetRolesQuery } from "../../../redux/features/role/roleApi";
import { useCreateUserMutation } from "../../../redux/features/user/userApi";

interface CreateUserModalProps {
  open: boolean;
  setOpen: (value: boolean) => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ open, setOpen }) => {
  const [form] = Form.useForm();
  const [createUser, { isLoading }] = useCreateUserMutation();
  const { data: rolesData, isFetching: rolesLoading } = useGetRolesQuery({
    limit: 100,
  });
  // Employee designations only. A trainer's designations belong to the faculty
  // form, and the student one is issued by the system and never listed.
  const { data: designationsData, isFetching: designationsLoading } =
    useGetDesignationsQuery();
  // Exclude the protected SUPER_ADMIN role — it can never be assigned here.
  // FACULTY and STUDENT are already absent: the API does not return them,
  // because those accounts are issued from their own profile forms.
  const roles: any[] = (rolesData?.result || []).filter(
    (r: any) =>
      r.isActive !== false && r.role?.toUpperCase() !== "SUPER_ADMIN"
  );
  const designations: any[] = (designationsData?.data || []).filter(
    (d: any) => d.is_active !== false
  );

  useEffect(() => {
    form.resetFields();
  }, [open, form]);

  const handleSubmit = async (values: any) => {
    try {
      const leadInfo = {
        device: "pc",
        browser: navigator.userAgent,
        ipAddress: "0.0.0.0",
        userAgent: navigator.userAgent,
      };

      // Strip confirmPassword — backend only needs password.
      const { confirmPassword, ...rest } = values;
      void confirmPassword;
      const userData = {
        ...rest,
        leadInfo,
      };

      await createUser(userData).unwrap();
      toast.success("User created successfully!");
      form.resetFields();
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create user");
    }
  };

  return (
    <Modal
      title="Create User"
      open={open}
      onCancel={() => setOpen(false)}
      width={800}
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <div className="grid lg:grid-cols-2 gap-4 mb-2">
          <FormInput
            label="Name"
            name="name"
            placeholder="Enter user name"
            rules={[{ required: true, message: "Please enter user name" }]}
          />

          <FormInput
            label="Email"
            name="email"
            placeholder="Enter email address"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          />

          <FormSelect
            label="Role"
            name="roleId"
            placeholder={rolesLoading ? "Loading roles..." : "Select role"}
            rules={[{ required: true, message: "Please select a role" }]}
            options={roles.map((r: any) => ({
              value: r._id,
              label: r.role,
            }))}
          />

          <FormSelect
            label="Designation"
            name="designationId"
            placeholder={
              designationsLoading
                ? "Loading designations..."
                : "Select designation"
            }
            options={designations.map((d: any) => ({
              value: d._id,
              label: d.name,
            }))}
          />

          <FormInput
            label="Phone"
            name="phone"
            placeholder="Enter phone number (optional)"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: "Please enter password" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>

          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm password" },
              ({ getFieldValue }) => ({
                validator(_rule, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Passwords do not match")
                  );
                },
              }),
            ]}
          >
            <Input.Password placeholder="Re-enter password" />
          </Form.Item>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={isLoading}
            className="w-fit"
          >
            Create
          </Button>
          <Button
            onClick={() => setOpen(false)}
            className="w-fit"
            type="default"
          >
            Cancel
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateUserModal;
