import { Button, Divider, Form, Input, InputNumber, Switch } from "antd";
import { useMemo } from "react";
import { toast } from "react-toastify";
import {
  ICategory,
  useGetCategoriesQuery,
} from "../../../redux/features/inventory/categoryApi";
import {
  categoryOf,
  ISubCategory,
  useGetSubCategoriesQuery,
} from "../../../redux/features/inventory/subCategoryApi";
import {
  IVendor,
  useCreateVendorMutation,
  useUpdateVendorMutation,
} from "../../../redux/features/purchasing/vendorApi";
import { FormInput } from "../../Form/FormInput";
import { FormSelect } from "../../Form/FormSelect";
import InventoryFormModal from "../inventory/InventoryFormModal";

const activeOnly = [
  { name: "limit", value: 500 },
  { name: "isActive", value: true },
];

/** Ids out of a field that may hold populated objects or plain ids. */
const idsOf = (rows?: (string | { _id: string })[]) =>
  (rows ?? []).map((row) => (typeof row === "string" ? row : row._id));

const VendorModal = ({
  open,
  setOpen,
  data,
  onCreated,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  data?: IVendor | null;
  /** Called with the new vendor so a purchase form can select it. */
  onCreated?: (created: IVendor) => void;
}) => {
  const [form] = Form.useForm();
  const [createVendor, { isLoading: creating }] = useCreateVendorMutation();
  const [updateVendor, { isLoading: updating }] = useUpdateVendorMutation();

  const { data: categoryData } = useGetCategoriesQuery(activeOnly);
  const { data: subCategoryData } = useGetSubCategoriesQuery(activeOnly);

  const categories: ICategory[] = categoryData?.data?.data || [];
  const subCategories: ISubCategory[] = useMemo(
    () => subCategoryData?.data?.data || [],
    [subCategoryData]
  );

  const watchedCategories = Form.useWatch("categories", form);
  // Memoised because the filter below depends on it; the `?? []` fallback
  // would otherwise be a new array each render and re-filter every time.
  const pickedCategories: string[] = useMemo(
    () => watchedCategories ?? [],
    [watchedCategories]
  );

  /**
   * Sub categories narrow to the categories already chosen.
   *
   * A supplier of plastics has no business being tagged with a sub category
   * of electronics, and the full list is hundreds of rows long — offering it
   * whole would make the field unusable and the data wrong.
   */
  const availableSubCategories = useMemo(() => {
    if (pickedCategories.length === 0) return subCategories;
    return subCategories.filter((row) =>
      pickedCategories.includes(categoryOf(row)?._id ?? "")
    );
  }, [subCategories, pickedCategories]);

  const isEditing = Boolean(data?._id);

  const handleSubmit = async (values: any) => {
    const payload = {
      name: values.name?.trim(),
      company: values.company?.trim() || "",
      phone: values.phone?.trim(),
      email: values.email?.trim() || "",
      address: values.address?.trim() || "",
      note: values.note?.trim() || "",
      categories: values.categories ?? [],
      subCategories: values.subCategories ?? [],
      paymentTerms: values.paymentTerms?.trim() || "",
      creditDays: Number(values.creditDays) || 0,
      paymentMethods: values.paymentMethods ?? [],
      isActive: values.isActive ?? true,
    };

    try {
      if (isEditing) {
        await updateVendor({ id: data!._id, data: payload }).unwrap();
        toast.success("Vendor updated successfully");
      } else {
        const response = await createVendor(payload).unwrap();
        toast.success("Vendor created successfully");
        onCreated?.(response?.data);
      }
      setOpen(false);
      form.resetFields();
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
          `Failed to ${isEditing ? "update" : "create"} vendor`
      );
    }
  };

  return (
    <InventoryFormModal
      open={open}
      setOpen={setOpen}
      entity="Vendor"
      isEditing={isEditing}
      loading={creating || updating}
      form={form}
      width={760}
      onSubmit={handleSubmit}
      initialValues={{
        name: data?.name ?? "",
        company: data?.company ?? "",
        phone: data?.phone ?? "",
        email: data?.email ?? "",
        address: data?.address ?? "",
        note: data?.note ?? "",
        categories: idsOf(data?.categories),
        subCategories: idsOf(data?.subCategories),
        paymentTerms: data?.paymentTerms ?? "",
        creditDays: data?.creditDays ?? 0,
        paymentMethods: data?.paymentMethods ?? [],
        isActive: data?.isActive ?? true,
      }}
    >
      <div className="grid gap-x-4 sm:grid-cols-2">
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
          help="This is the vendor's identity — one number, one supplier"
          rules={[{ required: true, message: "A phone number is required" }]}
          placeholder="e.g. 01711223344"
        />
        <FormInput label="Email" name="email" placeholder="Optional" />
      </div>

      <Form.Item label="Address" name="address">
        <Input.TextArea rows={2} placeholder="Optional" />
      </Form.Item>

      <Divider orientation="left" className="!text-[13px] !text-secondary-500">
        What they supply
      </Divider>

      <FormSelect
        label="Categories"
        name="categories"
        mode="multiple"
        placeholder="Pick everything they carry"
        showSearch
        optionFilterProp="label"
        help="A big supplier carries several — pick all of them"
        options={categories.map((row) => ({ label: row.name, value: row._id }))}
      />

      <FormSelect
        label="Sub Categories"
        name="subCategories"
        mode="multiple"
        placeholder={
          pickedCategories.length
            ? "Narrowed to the categories above"
            : "Optional — pick categories first to narrow this"
        }
        showSearch
        optionFilterProp="label"
        options={availableSubCategories.map((row) => ({
          label: `${row.name}${
            categoryOf(row)?.name ? ` · ${categoryOf(row)?.name}` : ""
          }`,
          value: row._id,
        }))}
      />

      <Divider orientation="left" className="!text-[13px] !text-secondary-500">
        How they get paid
      </Divider>

      <div className="grid gap-x-4 sm:grid-cols-2">
        <FormInput
          label="Payment Terms"
          name="paymentTerms"
          placeholder="e.g. 30 days from delivery"
        />
        <Form.Item
          label="Credit Days"
          name="creditDays"
          tooltip="How long they let a bill run before it is overdue"
        >
          <InputNumber min={0} max={365} precision={0} className="w-full" />
        </Form.Item>
      </div>

      <div className="mb-4">
        <Form.List name="paymentMethods">
          {(fields, { add, remove }) => (
            <div className="flex flex-col gap-4">
              {fields.map(({ key, name, ...restField }) => (
                <div
                  key={key}
                  className="rounded-lg border border-secondary-200 bg-secondary-50 p-4 relative"
                >
                  <Button
                    type="text"
                    danger
                    className="absolute right-2 top-2"
                    onClick={() => remove(name)}
                  >
                    Remove
                  </Button>
                  <div className="grid gap-x-4 sm:grid-cols-2 mt-4">
                    <FormSelect
                      {...restField}
                      label="Method Type"
                      name={[name, "methodType"]}
                      rules={[{ required: true, message: "Type is required" }]}
                      options={[
                        { label: "Bank", value: "Bank" },
                        { label: "Mobile Banking", value: "Mobile Banking" },
                        { label: "Cash", value: "Cash" },
                        { label: "Other", value: "Other" },
                      ]}
                    />

                    {/* Conditionally render fields based on the selected methodType */}
                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, currentValues) =>
                        prevValues.paymentMethods?.[name]?.methodType !==
                        currentValues.paymentMethods?.[name]?.methodType
                      }
                    >
                      {() => {
                        const methodType = form.getFieldValue([
                          "paymentMethods",
                          name,
                          "methodType",
                        ]);

                        if (methodType === "Bank") {
                          return (
                            <>
                              <FormInput
                                {...restField}
                                label="Bank Name"
                                name={[name, "provider"]}
                                placeholder="e.g. Dutch Bangla Bank"
                              />
                              <FormInput
                                {...restField}
                                label="Account Name"
                                name={[name, "accountName"]}
                                placeholder="e.g. Acme Corp"
                              />
                              <FormInput
                                {...restField}
                                label="Account Number"
                                name={[name, "accountNumber"]}
                                placeholder="e.g. 102XXXXX"
                              />
                              <FormInput
                                {...restField}
                                label="Routing Number"
                                name={[name, "routingNumber"]}
                                placeholder="Optional"
                              />
                            </>
                          );
                        }

                        if (methodType === "Mobile Banking") {
                          return (
                            <>
                              <FormSelect
                                {...restField}
                                label="Provider"
                                name={[name, "provider"]}
                                options={[
                                  { label: "bKash", value: "bKash" },
                                  { label: "Nagad", value: "Nagad" },
                                  { label: "Rocket", value: "Rocket" },
                                  { label: "Upay", value: "Upay" },
                                ]}
                              />
                              <FormInput
                                {...restField}
                                label="Mobile Number"
                                name={[name, "accountNumber"]}
                                placeholder="e.g. 01711223344"
                              />
                            </>
                          );
                        }

                        if (methodType === "Other") {
                          return (
                            <FormInput
                              {...restField}
                              label="Details"
                              name={[name, "details"]}
                              placeholder="e.g. Paid via check"
                            />
                          );
                        }

                        return null;
                      }}
                    </Form.Item>
                  </div>
                </div>
              ))}
              <Button
                type="dashed"
                onClick={() => add()}
                block
                className="mt-2"
              >
                + Add Payment Method
              </Button>
            </div>
          )}
        </Form.List>
      </div>

      <Form.Item label="Note" name="note">
        <Input.TextArea rows={2} placeholder="Delivery days, who to ask for…" />
      </Form.Item>

      <Form.Item label="Status" name="isActive" valuePropName="checked">
        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
      </Form.Item>
    </InventoryFormModal>
  );
};

export default VendorModal;
