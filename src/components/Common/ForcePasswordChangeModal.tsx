import { Button, Form, Input, Modal } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

import { useChangeOwnPasswordMutation } from "../../redux/features/auth/authApi";
import {
  clearPasswordChange,
  selectCurrentUser,
} from "../../redux/features/auth/authSlice";
import { useAppDispatch } from "../../redux/features/hooks";

/**
 * Offered while an account is still on the password it was issued with.
 *
 * Staff accounts can be created from a profile form with no password box — they
 * start on a shared company default that every colleague can guess. This dialog
 * is how that gets replaced.
 *
 * Two deliberate choices:
 *
 * It does not ask for the current password. The person signed in with it
 * seconds ago, and it is the default anybody could have typed — asking again
 * proves nothing and only stands between a public account and a private one.
 * (The server still demands it for accounts past this stage; see
 * `changePassword`.)
 *
 * It can be dismissed, but not dealt with. Skipping lasts for this visit only —
 * the dialog comes back at the next sign-in, and every one after it, until the
 * password is actually changed. Nagging someone who is in the middle of
 * something is worse than nagging them tomorrow; letting it go silently is
 * worse than both.
 */
const ForcePasswordChangeModal = () => {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const user = useSelector(selectCurrentUser);
  const [changePassword, { isLoading }] = useChangeOwnPasswordMutation();

  // Deliberately component state, not redux: it must not be persisted, or
  // "later" would quietly become "never".
  const [skipped, setSkipped] = useState(false);

  const mustChange = Boolean(user?.is_password_change);

  const onFinish = async (values: { newPassword: string }) => {
    try {
      const res = await changePassword({
        newPassword: values.newPassword,
      }).unwrap();

      // The server hands back fresh tokens so the session survives the change.
      if (res?.data?.token) localStorage.setItem("token", res.data.token);
      dispatch(clearPasswordChange());
      form.resetFields();
      toast.success("Password updated");
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not change the password");
    }
  };

  return (
    <Modal
      open={mustChange && !skipped}
      title="Set your password"
      footer={null}
      // Closable now — the X and the mask do the same as "Not now".
      closable
      onCancel={() => setSkipped(true)}
      maskClosable
      width={440}
      destroyOnClose
    >
      <p className="mb-4 text-sm text-secondary-500">
        Your account is still on the password it was created with — the one the
        office hands out. Choose your own so it is yours alone.
      </p>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="New password"
          name="newPassword"
          rules={[
            { required: true, message: "Enter a new password" },
            { min: 6, message: "At least 6 characters" },
          ]}
        >
          <Input.Password placeholder="Minimum 6 characters" autoFocus />
        </Form.Item>

        <Form.Item
          label="Confirm new password"
          name="confirmPassword"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "Type the new password again" },
            // Catching the mismatch here saves a round trip and, more to the
            // point, saves someone locking themselves out with a typo.
            ({ getFieldValue }) => ({
              validator: (_, value) =>
                !value || getFieldValue("newPassword") === value
                  ? Promise.resolve()
                  : Promise.reject(new Error("The two passwords do not match")),
            }),
          ]}
        >
          <Input.Password placeholder="Repeat it" />
        </Form.Item>

        <div className="flex gap-2">
          <Button block onClick={() => setSkipped(true)}>
            Not now
          </Button>
          <Button
            block
            type="primary"
            onClick={() => form.submit()}
            loading={isLoading}
          >
            Save and continue
          </Button>
        </div>

        <p className="mt-3 text-center text-xs text-secondary-400">
          Skipping is fine — you will be asked again next time you sign in.
        </p>
      </Form>
    </Modal>
  );
};

export default ForcePasswordChangeModal;
