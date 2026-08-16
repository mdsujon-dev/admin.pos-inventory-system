import { Button, Form, Input } from "antd";
import { ArrowRight, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { useForgotPasswordMutation } from "../../redux/features/auth/authApi";
import { AuthLayout } from "./AuthLayout";

interface ForgotFormValues {
  email: string;
}

const ForgotPassword = () => {
  const [form] = Form.useForm<ForgotFormValues>();
  const navigate = useNavigate();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const onFinish = async (values: ForgotFormValues) => {
    const email = values.email.trim().toLowerCase();
    try {
      const res = await forgotPassword({ email }).unwrap();
      toast.success(res?.message || "Check your inbox for the reset code.");
      navigate("/reset-password", { state: { email } });
    } catch (err: any) {
      toast.error(
        err?.data?.message ||
          err?.data?.errors ||
          "Something went wrong. Please try again."
      );
    }
  };

  return (
    <AuthLayout
      step={{ current: 1, total: 2 }}
      heading="Forgot password"
      subheading="Enter your account email — we'll send a 6-digit reset code."
      footer={
        <span>
          Remembered it?{" "}
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
        name="forgot-password"
        requiredMark={false}
        onFinish={onFinish}
        layout="vertical"
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

        <Button
          type="primary"
          htmlType="submit"
          loading={isLoading}
          size="large"
          block
          className="!mt-2 !h-11 !rounded-lg !border-0 !bg-primary !text-[15px] !font-semibold !text-white !shadow-[0_8px_20px_-8px_rgba(1,149,50,0.55)] hover:!bg-primary-700"
          icon={!isLoading && <ArrowRight className="h-4 w-4" />}
          iconPosition="end"
        >
          Send reset code
        </Button>
      </Form>
    </AuthLayout>
  );
};

export default ForgotPassword;
