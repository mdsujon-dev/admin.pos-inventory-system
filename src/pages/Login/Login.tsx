import { Button, Checkbox, Form, Input } from "antd";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { useLoginMutation } from "../../redux/features/auth/authApi";
import { setUser } from "../../redux/features/auth/authSlice";
import { useAppDispatch } from "../../redux/features/hooks";
import { AuthLayout } from "./AuthLayout";

interface LoginFormValues {
  email: string;
  password: string;
  remember?: boolean;
}

const Login = () => {
  const [form] = Form.useForm<LoginFormValues>();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const location = useLocation();
  const navigate = useNavigate();

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const onFinish = async (values: LoginFormValues) => {
    try {
      const payload = { ...values, email: values.email?.trim() };
      const res = await login(payload).unwrap();
      if (res?.success) {
        localStorage.setItem("token", res?.data?.token);
        dispatch(setUser({ user: res?.data?.user, token: res?.data?.token }));
        navigate(from, { replace: true });
        toast.success("Login successful!");
      }
    } catch (err: any) {
      toast.error(
        err?.data?.errors ||
          err?.data?.message ||
          "Something went wrong. Please try again later."
      );
    }
  };

  return (
    <AuthLayout
      heading="Welcome back"
      subheading="Sign in to continue to the panel."
      footer="Trouble signing in? Contact your workspace admin."
    >
      <Form
        form={form}
        name="login"
        requiredMark={false}
        onFinish={onFinish}
        layout="vertical"
        initialValues={{ remember: true }}
        className="auth-form space-y-1"
      >
        <Form.Item
          label="Email address"
          name="email"
          // Auto-strip any spaces the user types/pastes (emails have no spaces).
          getValueFromEvent={(e) => e.target.value.replace(/\s/g, "")}
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
          label="Password"
          name="password"
          rules={[{ required: true, message: "Please input your password" }]}
        >
          <Input.Password
            size="large"
            prefix={<Lock className="mr-1 h-4 w-4 text-secondary-400" />}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </Form.Item>

        <div className="mb-5 mt-1 flex items-center justify-between">
          <Form.Item name="remember" valuePropName="checked" className="!mb-0">
            <Checkbox className="!text-sm !text-secondary-600">Remember me</Checkbox>
          </Form.Item>
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-primary transition-colors hover:text-primary-700"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="primary"
          htmlType="submit"
          loading={isLoading}
          size="large"
          block
          className="!mt-2 !h-11 !rounded-lg !border-0 !bg-primary !text-[15px] !font-semibold !text-white !shadow-[0_8px_20px_-8px_rgba(40,95,20,0.55)] hover:!bg-primary-700"
          icon={!isLoading && <ArrowRight className="h-4 w-4" />}
          iconPosition="end"
        >
          Sign in
        </Button>
      </Form>
    </AuthLayout>
  );
};

export default Login;
