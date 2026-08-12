import { Alert, Form } from "antd";
import { toast } from "react-toastify";
import {
  IVendor,
  useCreateVendorMutation,
} from "../../../redux/features/purchasing/vendorApi";
import { FormInput } from "../../Form/FormInput";
import AppFormModal from "../shared/AppFormModal";

/**
 * The three fields a purchase actually needs from a new supplier.
 *
 * The full vendor form is a page now, and sending someone to it mid-purchase
 * would throw away the bill they were halfway through entering. What they get
 * here is enough to raise the bill; the categories, terms and payment methods
 * are filled in later from the vendor's own screen.
 */
const QuickVendorModal = ({
  open,
  setOpen,
  onCreated,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  onCreated?: (created: IVendor) => void;
}) => {
  const [form] = Form.useForm();
  const [createVendor, { isLoading }] = useCreateVendorMutation();

  const handleSubmit = async (values: {
    name: string;
    company?: string;
    phone: string;
  }) => {
    try {
      const response = await createVendor({
        name: values.name?.trim(),
        company: values.company?.trim() || "",
        phone: values.phone?.trim(),
      }).unwrap();
      toast.success("Vendor created — the rest can be filled in later");
      onCreated?.(response?.data);
      form.resetFields();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create vendor");
    }
  };

  return (
    <AppFormModal
      open={open}
      setOpen={setOpen}
      entity="Vendor"
      isEditing={false}
      loading={isLoading}
      form={form}
      onSubmit={handleSubmit}
      initialValues={{ name: "", company: "", phone: "" }}
    >
      <Alert
        type="info"
        showIcon
        className="!mb-4"
        message="Just enough to raise this bill"
        description="Categories, terms and payment methods are added later from the vendor's own page."
      />

      <FormInput
        label="Contact Name"
        name="name"
        rules={[
          { required: true, message: "Name is required" },
          { max: 120, message: "Name is too long" },
        ]}
        placeholder="e.g. Rahim Uddin"
      />
      <FormInput
        label="Company"
        name="company"
        placeholder="e.g. RFL Plastics"
      />
      <FormInput
        label="Phone"
        name="phone"
        rules={[{ required: true, message: "A phone number is required" }]}
        placeholder="e.g. 01711223344"
        digitsOnly
      />
    </AppFormModal>
  );
};

export default QuickVendorModal;
