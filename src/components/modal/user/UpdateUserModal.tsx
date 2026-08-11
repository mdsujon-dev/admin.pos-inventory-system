import { Button, Form, Modal } from "antd";
import React, { useEffect } from "react";
import { toast } from "react-toastify";
import { FormInput } from "../../../components/Form/FormInput";
import { FormSelect } from "../../../components/Form/FormSelect";
import { useGetDesignationsQuery } from "../../../redux/features/designation/designationApi";
import { useGetRolesQuery } from "../../../redux/features/role/roleApi";
import { useUpdateUserMutation } from "../../../redux/features/user/userApi";

interface UpdateUserModalProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  data: any;
}

const UpdateUserModal: React.FC<UpdateUserModalProps> = ({
  open,
  setOpen,
  data,
}) => {
  const [form] = Form.useForm();
  const [updateUser, { isLoading }] = useUpdateUserMutation();
  const { data: rolesData, isFetching: rolesLoading } = useGetRolesQuery({
    limit: 100,
  });
  // Employee designations only — a trainer's belong to the faculty form, and the
  // student one is issued by the system and never listed.
  const { data: designationsData, isFetching: designationsLoading } =
    useGetDesignationsQuery();
  // Exclude the protected SUPER_ADMIN role — it can never be assigned here.
  const roles: any[] = (rolesData?.result || []).filter(
    (r: any) =>
      r.isActive !== false && r.role?.toUpperCase() !== "SUPER_ADMIN"
  );
  const designations: any[] = (designationsData?.data || []).filter(
    (d: any) => d.is_active !== false
  );

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        name: data.name,
        email: data.email,
        roleId: data.roleId?._id || data.roleId,
        designationId: data.designationId?._id || data.designationId,
        phone: data.phone,
      });
    }
  }, [data, form]);

  const handleSubmit = async (values: any) => {
    try {
      await updateUser({ id: data._id, data: values }).unwrap();
      toast.success("User updated successfully!");
      form.resetFields();
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update user");
    }
  };

  return (
    <Modal
      title="Update User"
      open={open}
      onCancel={() => setOpen(false)}
      width={600}
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <div className="grid lg:grid-cols-2 gap-4 mb-4">
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
        <div className="flex justify-end gap-2">
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={isLoading}
            className="w-fit"
          >
            Update
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

export default UpdateUserModal;
