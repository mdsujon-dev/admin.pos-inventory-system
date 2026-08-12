import { Button, ColorPicker, Form } from "antd";
import { useEffect } from "react";
import { toast } from "react-toastify";
import {
  ICountry,
  useUpdateCountryMutation,
} from "../../../../redux/features/country/countryApi";
import { FormInput } from "../../../Form/FormInput";
import AppFormModal from "../../shared/AppFormModal";
import UploadImage from "../../../shared/UploadImage";

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const UpdateCountryModal = ({
  open,
  setOpen,
  data,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  data?: ICountry | null;
}) => {
  const [form] = Form.useForm();
  const [updateCountry, { isLoading }] = useUpdateCountryMutation();

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        name: data.name,
        code: data.code,
        flag: data.flag,
        role: data.role,
        address: data.address,
        email: data.email,
        phone: data.phone,
        accentSolid: data.accentSolid,
      });
    }
  }, [data, form]);

  const handleSubmit = async (
    values: Partial<ICountry> & { accentSolid: any }
  ) => {
    if (!data?._id) return;
    try {
      const accent =
        typeof values.accentSolid === "string"
          ? values.accentSolid
          : values.accentSolid?.toHexString?.() || data.accentSolid;

      const payload = {
        ...values,
        code: values.code?.toUpperCase(),
        accentSolid: accent,
      };

      const res = await updateCountry({
        id: data._id,
        data: payload,
      }).unwrap();
      if (res?.success) {
        toast.success("Country updated successfully");
        setOpen(false);
        form.resetFields();
      }
    } catch (err: any) {
      console.error("Validation error:", err);
      toast.error(err?.data?.message || "Failed to update country");
    }
  };

  return (
    <AppFormModal
      entity="Country"
      isEditing={true}
      open={open}
      setOpen={setOpen}
      width={1000}
      form={form}
      onSubmit={handleSubmit}
      loading={isLoading}
    >
        <Form.Item
          label="Flag"
          name="flag"
          tooltip="Upload a flag image (recommended ratio 4:3, transparent or solid background)."
          rules={[{ required: true, message: "Flag image is required" }]}
        >
          <UploadImage form={form} fieldPath="flag" />
        </Form.Item>

        <div className="grid lg:grid-cols-2 gap-4">
          <FormInput
            label="Country Name"
            name="name"
            rules={[{ required: true, message: "Name is required" }]}
            placeholder="e.g. Bangladesh"
          />
          <FormInput
            label="Country Code (ISO)"
            name="code"
            rules={[
              { required: true, message: "Code is required" },
              { min: 2, max: 5, message: "Code must be 2–5 characters" },
            ]}
            placeholder="e.g. BD"
          />
          <FormInput
            label="Role / Tagline"
            name="role"
            rules={[{ required: true, message: "Role is required" }]}
            placeholder="e.g. Engineering Hub"
          />
          <FormInput
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                type: "email",
                message: "Valid email is required",
              },
            ]}
            placeholder="e.g. institute@gmail.com"
          />
          <FormInput
            label="Phone"
            name="phone"
            rules={[{ required: true, message: "Phone is required" }]}
            placeholder="e.g. +880 1711 432 284"
          />
        </div>

        <FormInput
          label="Address"
          name="address"
          rules={[{ required: true, message: "Address is required" }]}
          placeholder="Full office address"
        />

        <Form.Item
          label="Accent Color"
          name="accentSolid"
          tooltip="Used for the card's hover glow, country code watermark and CTA accents."
          rules={[
            { required: true, message: "Accent color is required" },
            {
              validator: (_, value) => {
                const hex =
                  typeof value === "string" ? value : value?.toHexString?.();
                if (!hex || !HEX_COLOR.test(hex)) {
                  return Promise.reject("Must be a valid hex color");
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <ColorPicker showText format="hex" />
        </Form.Item>
    </AppFormModal>
  );
};

export default UpdateCountryModal;

