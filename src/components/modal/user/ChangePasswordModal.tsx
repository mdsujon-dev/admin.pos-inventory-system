import { Form, Input } from "antd";
import React, { useEffect } from "react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { useChangePasswordMutation } from "../../../redux/features/user/userApi";
import { useChangeOwnPasswordMutation } from "../../../redux/features/auth/authApi";
import {
  selectCurrentUser,
  setUser,
} from "../../../redux/features/auth/authSlice";
import AppFormModal from "../shared/AppFormModal";

interface ChangePasswordModalProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  userId: string;
  userName?: string;
  // When true, this is the logged-in user changing their OWN password — uses
  // the self endpoint (needs the old password) and refreshes the session token.
  self?: boolean;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  open,
  setOpen,
  userId,
  userName,
  self = false,
}) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [changeOwnPassword, { isLoading: isSelfLoading }] =
    useChangeOwnPasswordMutation();

  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleSubmit = async (values: {
    oldPassword?: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    try {
      if (self) {
        const res = await changeOwnPassword({
          oldPassword: values.oldPassword as string,
          newPassword: values.newPassword,
        }).unwrap();

        // Keep the session alive — update the access token; the backend also
        // refreshes the httpOnly refresh-token cookie.
        const newToken = res?.data?.token;
        if (newToken && currentUser) {
          dispatch(setUser({ user: currentUser, token: newToken }));
          localStorage.setItem("token", newToken);
        }
      } else {
        await changePassword({
          userId,
          newPassword: values.newPassword,
        }).unwrap();
      }
      toast.success("Password changed successfully!");
      form.resetFields();
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to change password");
    }
  };

  const loading = self ? isSelfLoading : isLoading;

  return (
    <AppFormModal
      title={`Change Password${userName ? ` - ${userName}` : ""}`}
      entity="User"
      isEditing={true}
      open={open}
      setOpen={setOpen}
      width={600}
      form={form}
      onSubmit={handleSubmit}
      loading={loading}
    >
        {self && (
          <Form.Item
            label="Current Password"
            name="oldPassword"
            rules={[
              { required: true, message: "Please enter your current password" },
            ]}
          >
            <Input.Password placeholder="Enter current password" />
          </Form.Item>
        )}

        <Form.Item
          label="New Password"
          name="newPassword"
          rules={[
            { required: true, message: "Please enter new password" },
            { min: 6, message: "Password must be at least 6 characters" },
          ]}
        >
          <Input.Password placeholder="Enter new password" />
        </Form.Item>

        <Form.Item
          label="Confirm Password"
          name="confirmPassword"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "Please confirm new password" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Passwords do not match"));
              },
            }),
          ]}
        >
          <Input.Password placeholder="Re-enter new password" />
        </Form.Item>

    </AppFormModal>
  );
};

export default ChangePasswordModal;
