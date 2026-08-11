import { Avatar, Button, Form, Modal, Upload, message } from "antd";
import type { RcFile, UploadChangeParam } from "antd/es/upload";
import { Camera, ImagePlus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FormInput } from "../../../components/Form/FormInput";
import {
  useUpdateUserMutation,
  useUploadProfileImageMutation,
} from "../../../redux/features/user/userApi";

interface UpdateProfileModalProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  data: {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
    profilePhoto?: string;
  };
}

const MAX_IMAGE_MB = 5;

const UpdateProfileModal: React.FC<UpdateProfileModalProps> = ({
  open,
  setOpen,
  data,
}) => {
  const [form] = Form.useForm();
  const [updateUser, { isLoading }] = useUpdateUserMutation();
  const [uploadProfileImage, { isLoading: isUploading }] =
    useUploadProfileImageMutation();
  const [imagePreview, setImagePreview] = useState<string | undefined>(
    data.profilePhoto
  );

  useEffect(() => {
    if (open && data) {
      form.setFieldsValue({
        name: data.name,
        email: data.email,
        phone: data.phone,
      });
      setImagePreview(data.profilePhoto);
    }
  }, [open, data, form]);

  const initials = (data.name || "?").charAt(0).toUpperCase();

  const beforeUpload = (file: RcFile): boolean => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("Only image files are allowed");
      return false;
    }
    const isSmallEnough = file.size / 1024 / 1024 < MAX_IMAGE_MB;
    if (!isSmallEnough) {
      message.error(`Image must be smaller than ${MAX_IMAGE_MB}MB`);
      return false;
    }
    return true;
  };

  const handleImageChange = async (info: UploadChangeParam) => {
    const file = info.file.originFileObj as File | undefined;
    if (!file) return;

    // Optimistic preview
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    try {
      const res = await uploadProfileImage(file).unwrap();
      // Swap the blob URL for the server URL once the upload succeeds
      setImagePreview(res.url);
      toast.success("Profile image updated");
    } catch (err: any) {
      setImagePreview(data.profilePhoto);
      toast.error(err?.data?.message || "Failed to upload image");
    }
  };

  const handleSubmit = async (values: {
    name?: string;
    email?: string;
    phone?: string;
  }) => {
    try {
      await updateUser({ id: data._id, data: values }).unwrap();
      toast.success("Profile updated successfully!");
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update profile");
    }
  };

  return (
    <Modal
      title="Update Profile"
      open={open}
      onCancel={() => setOpen(false)}
      width={600}
      footer={null}
    >
      {/* Avatar + upload */}
      <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-primary-50/50 border border-primary-100">
        <div className="relative shrink-0">
          <Avatar
            size={72}
            src={imagePreview || undefined}
            className="!bg-primary text-white font-bold text-2xl"
          >
            {!imagePreview && initials}
          </Avatar>
          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={beforeUpload}
            customRequest={({ onSuccess }) => setTimeout(() => onSuccess?.("ok"), 0)}
            onChange={handleImageChange}
            disabled={isUploading}
          >
            <button
              type="button"
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center border-2 border-white shadow-md hover:bg-primary-700 transition-colors"
              aria-label="Change profile photo"
              disabled={isUploading}
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </Upload>
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900">Profile photo</div>
          <div className="text-xs text-gray-500 mt-0.5">
            JPG, PNG, WEBP or GIF · max {MAX_IMAGE_MB}MB
          </div>
          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={beforeUpload}
            customRequest={({ onSuccess }) => setTimeout(() => onSuccess?.("ok"), 0)}
            onChange={handleImageChange}
            disabled={isUploading}
          >
            <Button
              type="link"
              icon={<ImagePlus className="w-4 h-4" />}
              loading={isUploading}
              className="!px-0 !text-primary"
            >
              {imagePreview ? "Change photo" : "Upload photo"}
            </Button>
          </Upload>
        </div>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <div className="grid lg:grid-cols-2 gap-4 mb-2">
          <FormInput
            label="Name"
            name="name"
            placeholder="Your full name"
            rules={[{ required: true, message: "Please enter your name" }]}
          />
          <FormInput
            label="Email"
            name="email"
            placeholder="Your email address"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          />
          <FormInput
            label="Phone"
            name="phone"
            placeholder="Phone number (optional)"
          />
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={isLoading}
          >
            Save Changes
          </Button>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </Form>
    </Modal>
  );
};

export default UpdateProfileModal;
