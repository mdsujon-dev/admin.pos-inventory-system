import {
  Button,
  Form,
  Input,
  Select,
  Switch,
} from "antd";
import {
  Banknote,
  Boxes,
  Handshake,
  Plus,
  Trash2,
  Warehouse,
} from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import { FormInput } from "../../components/Form/FormInput";
import { FormSelect } from "../../components/Form/FormSelect";
import { Loading } from "../../components/shared/Loading";
import {
  ICategory,
  useGetCategoriesQuery,
} from "../../redux/features/inventory/categoryApi";
import {
  categoryOf,
  ISubCategory,
  useGetSubCategoriesQuery,
} from "../../redux/features/inventory/subCategoryApi";
import {
  useCreateVendorMutation,
  useGetVendorByIdQuery,
  useUpdateVendorMutation,
} from "../../redux/features/purchasing/vendorApi";
import { useGetPaymentProvidersQuery } from "../../redux/features/settings/paymentProviderApi";
import { SectionCard } from "../Inventory/Products/ProductFormUI";

const activeOnly = [
  { name: "limit", value: 500 },
  { name: "isActive", value: true },
];

/** Ids out of a field that may hold populated objects or plain ids. */
const idsOf = (rows?: (string | { _id: string })[]) =>
  (rows ?? []).map((row) => (typeof row === "string" ? row : row._id));

const METHOD_TYPES = ["Bank", "Mobile Banking", "Cash", "Other"];

/**
 * Creating and editing a supplier, on a page of its own.
 *
 * It outgrew a dialog: categories, sub categories, two-sided terms and any
 * number of payment methods, each with its own set of fields. A modal that
 * scrolls is a modal that hides half its form.
 */
const VendorForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form] = Form.useForm();

  const { data: vendorData, isFetching: loadingVendor } = useGetVendorByIdQuery(
    id as string,
    { skip: !isEditing }
  );
  const vendor = vendorData?.data;

  const [createVendor, { isLoading: creating }] = useCreateVendorMutation();
  const [updateVendor, { isLoading: updating }] = useUpdateVendorMutation();

  const { data: categoryData } = useGetCategoriesQuery(activeOnly);
  const { data: subCategoryData } = useGetSubCategoriesQuery(activeOnly);
  const { data: providerData } = useGetPaymentProvidersQuery(activeOnly);

  const categories: ICategory[] = categoryData?.data?.data || [];
  const subCategories: ISubCategory[] = useMemo(
    () => subCategoryData?.data?.data || [],
    [subCategoryData]
  );
  const providers = useMemo(
    () => providerData?.data?.data || providerData?.data || [],
    [providerData]
  );

  const watchedCategories = Form.useWatch("categories", form);
  const pickedCategories: string[] = useMemo(
    () => watchedCategories ?? [],
    [watchedCategories]
  );

  /**
   * Sub categories narrow to the categories already chosen — a plastics
   * supplier has no business carrying a sub category of electronics, and the
   * unfiltered list is hundreds of rows long.
   */
  const availableSubCategories = useMemo(() => {
    if (pickedCategories.length === 0) return subCategories;
    return subCategories.filter((row) =>
      pickedCategories.includes(categoryOf(row)?._id ?? "")
    );
  }, [subCategories, pickedCategories]);

  const providersOfType = (type: string) =>
    (providers as { _id: string; name: string; type: string }[])
      .filter((row) => row.type === type)
      .map((row) => ({ label: row.name, value: row.name }));

  const initialValues = useMemo(() => {
    if (!vendor) {
      return {
        isActive: true,
        categories: [],
        subCategories: [],
        address: {},
        /**
         * One of each is already open on a new vendor.
         *
         * Nearly every supplier has at least one term and one way of being
         * paid, so an empty list behind an "Add" button is a click that is
         * almost always going to be made — and a form that looks like it wants
         * nothing there. Blank rows are dropped on save, so leaving them
         * untouched costs nothing.
         */
        paymentTerms: [{ side: "ours", text: "" }],
        paymentMethods: [{}],
      };
    }
    return {
      name: vendor.name,
      company: vendor.company ?? "",
      phone: vendor.phone,
      email: vendor.email ?? "",
      address: vendor.address ?? {},
      note: vendor.note ?? "",
      categories: idsOf(vendor.categories),
      subCategories: idsOf(vendor.subCategories),
      paymentTerms: vendor.paymentTerms ?? [],
      paymentMethods: vendor.paymentMethods ?? [],
      isActive: vendor.isActive,
    };
  }, [vendor]);

  const handleSubmit = async (values: any) => {
    const payload = {
      name: values.name?.trim(),
      company: values.company?.trim() || "",
      phone: values.phone?.trim(),
      email: values.email?.trim() || "",
      note: values.note?.trim() || "",
      categories: values.categories ?? [],
      subCategories: values.subCategories ?? [],
      // Blank rows are what an "Add" button that was pressed once too often
      // leaves behind; they are not terms.
      paymentTerms: (values.paymentTerms ?? []).filter((row: any) =>
        row?.text?.trim()
      ),
      // A method with no type is the row the form opened with and nobody
      // filled in — not a payment method.
      paymentMethods: (values.paymentMethods ?? []).filter(
        (row: any) => row?.methodType
      ),
      address: values.address ?? {},
      isActive: values.isActive ?? true,
    };

    try {
      if (isEditing) {
        await updateVendor({ id: id as string, data: payload }).unwrap();
        toast.success("Vendor updated successfully");
      } else {
        await createVendor(payload).unwrap();
        toast.success("Vendor created successfully");
      }
      navigate("/vendors");
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
          `Failed to ${isEditing ? "update" : "create"} vendor`
      );
    }
  };

  if (isEditing && loadingVendor) return <Loading />;

  return (
    <div className="flex min-h-[calc(100dvh-94px)] flex-col sm:min-h-[calc(100dvh-102px)]">
      <PageMeta
        title={`${isEditing ? "Edit" : "Create"} Vendor - POS & Inventory`}
        description="Supplier details, what they carry, terms and how they get paid"
        noindex
      />
      <PageHeader
        title={isEditing ? "Edit Vendor" : "Create Vendor"}
        subtitle={
          isEditing
            ? "Update this supplier's details, terms and payment methods"
            : "Add a supplier — stock enters the shop through one of these"
        }
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Purchasing" },
          { title: "Vendors", path: "/vendors" },
          { title: isEditing ? "Edit" : "Create" },
        ]}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={initialValues}
        key={vendor?._id ?? "create"}
        className="flex flex-1 flex-col"
      >
        <div className="flex flex-1 flex-col gap-4">
          <SectionCard
            icon={Warehouse}
            title="Who they are"
            subtitle="The phone number is the identity — one number, one supplier"
          >
            <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <FormInput label="Email" name="email" placeholder="Optional" />
            </div>

            {/*
              Split rather than one box: a single free-text address is what a
              delivery driver cannot use and a report cannot group by — "who do
              we buy from in Bogura" is unanswerable when the district is
              buried in the middle of a sentence.
            */}
            <p className="mb-2 mt-1 text-[13px] font-semibold text-secondary-700">
              Address
            </p>
            <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormInput
                label="Division"
                name={["address", "division"]}
                placeholder="e.g. Rajshahi"
              />
              <FormInput
                label="District"
                name={["address", "district"]}
                placeholder="e.g. Bogura"
              />
              <FormInput
                label="Upazila"
                name={["address", "upazila"]}
                tooltip="Rural areas say upazila; cities say thana. Fill in whichever they gave."
                placeholder="e.g. Shibganj"
              />
              <FormInput
                label="Thana"
                name={["address", "thana"]}
                placeholder="e.g. Kotwali"
              />
              <FormInput
                label="Union / Ward"
                name={["address", "union"]}
                placeholder="Optional"
              />
              <FormInput
                label="Area / Village"
                name={["address", "area"]}
                placeholder="e.g. Jaleshwaritola"
              />
              <FormInput
                label="Road"
                name={["address", "road"]}
                placeholder="e.g. Sherpur Road"
              />
              <FormInput
                label="House / Holding"
                name={["address", "houseNo"]}
                placeholder="e.g. 42/A"
              />
              <FormInput
                label="Post Code"
                name={["address", "postCode"]}
                placeholder="e.g. 5800"
                digitsOnly
              />
              <div className="sm:col-span-2 lg:col-span-3">
                <FormInput
                  label="Landmark"
                  name={["address", "landmark"]}
                  tooltip="How people actually find the place"
                  placeholder="e.g. Opposite the central mosque"
                />
              </div>
            </div>

            <Form.Item label="Note" name="note">
              <Input.TextArea
                rows={3}
                placeholder="Delivery days, who to ask for…"
              />
            </Form.Item>

            <Form.Item label="Status" name="isActive" valuePropName="checked" className="!mb-0">
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          </SectionCard>

          <SectionCard
            icon={Boxes}
            title="What they supply"
            subtitle="Headings rather than a product list — this is what answers 'who do we call for this'"
          >
            <div className="grid gap-x-4 sm:grid-cols-2">
              <FormSelect
                label="Categories"
                name="categories"
                mode="multiple"
                placeholder="Pick everything they carry"
                showSearch
                optionFilterProp="label"
                tooltip="A big supplier carries several — pick all of them"
                options={categories.map((row) => ({
                  label: row.name,
                  value: row._id,
                }))}
              />
              <FormSelect
                label="Sub Categories"
                name="subCategories"
                mode="multiple"
                placeholder={
                  pickedCategories.length
                    ? "Narrowed to the categories above"
                    : "Optional"
                }
                showSearch
                optionFilterProp="label"
                tooltip="Narrows to whatever categories are picked beside it"
                options={availableSubCategories.map((row) => ({
                  label: `${row.name}${
                    categoryOf(row)?.name ? ` · ${categoryOf(row)?.name}` : ""
                  }`,
                  value: row._id,
                }))}
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={Handshake}
            title="Terms"
            subtitle="What we promised them, and what they promised us — kept apart so a dispute has an answer"
          >
            <Form.List name="paymentTerms">
              {(fields, { add, remove }) => (
                <div className="flex flex-col gap-3">
                  {fields.map(({ key, name, ...restField }) => (
                    <div
                      key={key}
                      className="flex flex-wrap items-start gap-3 rounded-xl border border-secondary-100 bg-secondary-50 p-3"
                    >
                      <Form.Item
                        {...restField}
                        name={[name, "side"]}
                        className="!mb-0 w-[150px]"
                        rules={[{ required: true, message: "Whose term?" }]}
                      >
                        <Select
                          placeholder="Whose term"
                          options={[
                            { label: "Our term", value: "ours" },
                            { label: "Vendor term", value: "vendor" },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, "text"]}
                        className="!mb-0 min-w-[240px] flex-1"
                        rules={[
                          { required: true, message: "Write the term out" },
                          { max: 300, message: "That is too long" },
                        ]}
                      >
                        <Input placeholder="e.g. Payment within 30 days of delivery" />
                      </Form.Item>
                      <Button
                        danger
                        type="text"
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => remove(name)}
                      />
                    </div>
                  ))}
                  <Button
                    type="dashed"
                    block
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => add({ side: "ours", text: "" })}
                  >
                    Add Term
                  </Button>
                </div>
              )}
            </Form.List>
          </SectionCard>

          <SectionCard
            icon={Banknote}
            title="How they get paid"
            subtitle="Written down once instead of asked for every time"
          >
            <Form.List name="paymentMethods">
              {(fields, { add, remove }) => (
                <div className="flex flex-col gap-4">
                  {fields.map(({ key, name, ...restField }) => (
                    <div
                      key={key}
                      className="relative rounded-xl border border-secondary-100 bg-secondary-50 p-4"
                    >
                      <Button
                        danger
                        type="text"
                        size="small"
                        className="!absolute !right-2 !top-2"
                        icon={<Trash2 className="h-4 w-4" />}
                        onClick={() => remove(name)}
                      />

                      <div className="grid gap-x-4 sm:grid-cols-2">
                        <FormSelect
                          {...restField}
                          label="Method Type"
                          name={[name, "methodType"]}
                          placeholder="Select a method"
                          rules={[{ required: true, message: "Type is required" }]}
                          options={METHOD_TYPES.map((row) => ({
                            label: row,
                            value: row,
                          }))}
                        />

                        <Form.Item
                          noStyle
                          shouldUpdate={(prev, current) =>
                            prev.paymentMethods?.[name]?.methodType !==
                            current.paymentMethods?.[name]?.methodType
                          }
                        >
                          {() => {
                            const methodType = form.getFieldValue([
                              "paymentMethods",
                              name,
                              "methodType",
                            ]);

                            return (
                              <>
                                {methodType === "Bank" && (
                                  <>
                                    <FormSelect
                                      {...restField}
                                      label="Bank"
                                      name={[name, "provider"]}
                                      showSearch
                                      placeholder="Select a bank"
                                      options={providersOfType("Bank")}
                                    />
                                    <FormInput
                                      {...restField}
                                      label="Branch"
                                      name={[name, "branch"]}
                                      placeholder="e.g. Gulshan Branch"
                                    />
                                    <FormInput
                                      {...restField}
                                      label="Account Name"
                                      name={[name, "accountName"]}
                                      placeholder="e.g. RFL Plastics Ltd"
                                    />
                                    <FormInput
                                      {...restField}
                                      label="Account Number"
                                      name={[name, "accountNumber"]}
                                      placeholder="e.g. 102XXXXXX"
                                    />
                                    <FormInput
                                      {...restField}
                                      label="Routing Number"
                                      name={[name, "routingNumber"]}
                                      placeholder="Optional"
                                    />
                                  </>
                                )}

                                {methodType === "Mobile Banking" && (
                                  <>
                                    <FormSelect
                                      {...restField}
                                      label="Provider"
                                      name={[name, "provider"]}
                                      showSearch
                                      placeholder="Select a provider"
                                      options={providersOfType("Mobile Banking")}
                                    />
                                    <FormInput
                                      {...restField}
                                      label="Mobile Number"
                                      name={[name, "accountNumber"]}
                                      placeholder="e.g. 01711223344"
                                      digitsOnly
                                    />
                                    <FormSelect
                                      {...restField}
                                      label="Account Type"
                                      name={[name, "accountType"]}
                                      placeholder="Select your account type"
                                      options={[
                                        { label: "Personal", value: "Personal" },
                                        { label: "Agent", value: "Agent" },
                                        { label: "Merchant", value: "Merchant" },
                                      ]}
                                    />
                                  </>
                                )}

                                {methodType === "Cash" && (
                                  <>
                                    <FormInput
                                      {...restField}
                                      label="Cash Handed To"
                                      name={[name, "receiverName"]}
                                      placeholder="Who receives it"
                                    />
                                    <FormInput
                                      {...restField}
                                      label="Voucher Handed To"
                                      name={[name, "voucherReceiver"]}
                                      placeholder="Who signs for it"
                                    />
                                    <FormInput
                                      {...restField}
                                      label="Confirmed By"
                                      name={[name, "confirmedBy"]}
                                      placeholder="Who checks it went out"
                                    />
                                  </>
                                )}

                                {/* The catch-all gets the lot — anything that
                                    is not a bank, a wallet or cash in hand is
                                    something nobody anticipated. */}
                                {methodType === "Other" && (
                                  <>
                                    <FormInput
                                      {...restField}
                                      label="Paid Through"
                                      name={[name, "provider"]}
                                      placeholder="e.g. Cheque, Card, Adjustment"
                                    />
                                    <FormInput
                                      {...restField}
                                      label="Reference Name"
                                      name={[name, "accountName"]}
                                      placeholder="Optional"
                                    />
                                    <FormInput
                                      {...restField}
                                      label="Reference Number"
                                      name={[name, "accountNumber"]}
                                      placeholder="Optional"
                                    />
                                    <FormInput
                                      {...restField}
                                      label="Branch / Office"
                                      name={[name, "branch"]}
                                      placeholder="Optional"
                                    />
                                    <FormInput
                                      {...restField}
                                      label="Handed To"
                                      name={[name, "receiverName"]}
                                      placeholder="Who receives it"
                                    />
                                    <FormInput
                                      {...restField}
                                      label="Voucher Handed To"
                                      name={[name, "voucherReceiver"]}
                                      placeholder="Who signs for it"
                                    />
                                    <FormInput
                                      {...restField}
                                      label="Confirmed By"
                                      name={[name, "confirmedBy"]}
                                      placeholder="Who checks it went out"
                                    />
                                  </>
                                )}

                                {methodType && (
                                  <div className="sm:col-span-2">
                                    <Form.Item
                                      {...restField}
                                      label="Description & Info"
                                      name={[name, "details"]}
                                      className="!mb-0"
                                    >
                                      <Input.TextArea
                                        rows={4}
                                        placeholder="Anything else worth remembering about this method"
                                      />
                                    </Form.Item>
                                  </div>
                                )}
                              </>
                            );
                          }}
                        </Form.Item>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="dashed"
                    block
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => add()}
                  >
                    Add Payment Method
                  </Button>
                </div>
              )}
            </Form.List>
          </SectionCard>

          <div className="sticky bottom-0 z-30 -mx-3 -mb-3 mt-auto flex h-[70px] items-center justify-end gap-3 border-t border-primary/20 bg-white/80 px-3 backdrop-blur-lg sm:-mx-4 sm:-mb-4 sm:px-6">
            <Button
              onClick={() => navigate("/vendors")}
              disabled={creating || updating}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={creating || updating}
              className="min-w-40 !border-0 !bg-gradient-to-r !from-primary-600 !to-primary-500 shadow-primary"
            >
              {isEditing ? "Save Changes" : "Create Vendor"}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default VendorForm;
