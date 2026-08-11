import { Button, Form, Input } from "antd";
import { ArrowRight, KeyRound, Lock, Mail } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { useResetPasswordMutation } from "../../redux/features/auth/authApi";
import { AuthLayout } from "./AuthLayout";

interface ResetFormValues {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}

const ResetPassword = () => {
  const [form] = Form.useForm<ResetFormValues>();
  const location = useLocation();
  const navigate = useNavigate();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const presetEmail = (location.state as { email?: string })?.email ?? "";

  const onFinish = async (values: ResetFormValues) => {
    try {
      const res = await resetPassword({
        email: values.email.trim().toLowerCase(),
        code: values.code.trim(),
        newPassword: values.newPassword,
      }).unwrap();
      toast.success(res?.message || "Password reset. You can now log in.");
      navigate("/login", { replace: true });
    } catch (err: any) {
      toast.error(
        err?.data?.message ||
          err?.data?.errors ||
          "Failed to reset password. Please try again."
      );
    }
  };

  return (
    <AuthLayout
      heading="Reset password"
      subheading="Enter the 6-digit code from your email and pick a new password."
      footer={
        <span className="space-x-1">
          <span className="text-secondary-500">Didn't get a code?</span>
          <Link
            to="/forgot-password"
            className="font-medium text-primary transition-colors hover:text-primary-700"
          >
            Resend
          </Link>
          <span className="text-secondary-300">·</span>
          <Link
            to="/login"
            className="font-medium text-primary transition-colors hover:text-primary-700"
          >
            Back to sign in
          </Link>
        </span>
      }
    >
      <Form
        form={form}
        name="reset-password"
        requiredMark={false}
        onFinish={onFinish}
        layout="vertical"
        initialValues={{ email: presetEmail }}
        className="auth-form space-y-1"
      >
        <Form.Item
          label="Email address"
          name="email"
          rules={[
            { required: true, message: "Please input your email" },
            { type: "email", message: "Please enter a valid email" },
          ]}
        >
          <Input
            size="large"
            prefix={<Mail className="mr-1 h-4 w-4 text-secondary-400" />}
            placeholder="Enter your email"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          label="Verification code"
          name="code"
          rules={[
            { required: true, message: "Please enter the 6-digit code" },
            { pattern: /^\d{6}$/, message: "Code must be a 6-digit number" },
          ]}
        >
          <Input
            size="large"
            prefix={<KeyRound className="mr-1 h-4 w-4 text-secondary-400" />}
            placeholder="Enter the 6-digit code"
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
          />
        </Form.Item>

        <Form.Item
          label="New password"
          name="newPassword"
          rules={[
            { required: true, message: "Please enter a new password" },
            { min: 6, message: "Password must be at least 6 characters" },
          ]}
        >
          <Input.Password
            size="large"
            prefix={<Lock className="mr-1 h-4 w-4 text-secondary-400" />}
            placeholder="Enter new password"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item
          label="Confirm new password"
          name="confirmPassword"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "Please confirm the new password" },
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
          <Input.Password
            size="large"
            prefix={<Lock className="mr-1 h-4 w-4 text-secondary-400" />}
            placeholder="Confirm your new password"
            autoComplete="new-password"
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          loading={isLoading}
          size="large"
          block
          className="!mt-2 !h-11 !rounded-lg !border-0 !bg-primary !text-[15px] !font-semibold !text-white !shadow-[0_8px_20px_-8px_rgba(15,53,25,0.55)] hover:!bg-primary-700"
          icon={!isLoading && <ArrowRight className="h-4 w-4" />}
          iconPosition="end"
        >
          Reset password
        </Button>
      </Form>
    </AuthLayout>
  );
};

export default ResetPassword;
