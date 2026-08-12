import { Form, Input, Switch } from "antd";
import { toast } from "react-toastify";
import {
  ICategory,
  useGetCategoriesQuery,
} from "../../../redux/features/inventory/categoryApi";
import {
  categoryOf,
  ISubCategory,
  useCreateSubCategoryMutation,
  useUpdateSubCategoryMutation,
} from "../../../redux/features/inventory/subCategoryApi";
import { FormInput } from "../../Form/FormInput";
import { FormSelect } from "../../Form/FormSelect";
import UploadImage from "../../shared/UploadImage";
import InventoryFormModal from "./InventoryFormModal";

const SubCategoryModal = ({
  open,
  setOpen,
  data,
  defaultCategory,
  onCreated,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  data?: ISubCategory | null;
  /** Pre-picks the parent when opened from somewhere that already knows it. */
  defaultCategory?: string;
  /** Called with the new sub category so a picker can select it. */
  onCreated?: (created: ISubCategory) => void;
}) => {
  const [form] = Form.useForm();
  const [createSubCategory, { isLoading: creating }] =
    useCreateSubCategoryMutation();
  const [updateSubCategory, { isLoading: updating }] =
    useUpdateSubCategoryMutation();

  // Only active categories are offered: filing a new sub category under a
  // disabled parent would hide it the moment it is saved.
  const { data: categoryData, isFetching: loadingCategories } =
    useGetCategoriesQuery([
      { name: "limit", value: 500 },
      { name: "isActive", value: true },
    ]);
  const categories: ICategory[] = categoryData?.data?.data || [];

  const isEditing = Boolean(data?._id);
  const loading = creating || updating;

  const handleSubmit = async (values: any) => {
    const payload = {
      name: values.name?.trim(),
      category: values.category,
      image: values.image || null,
      description: values.description?.trim() || "",
      isActive: values.isActive ?? true,
    };

    try {
      if (isEditing) {
        await updateSubCategory({ id: data!._id, data: payload }).unwrap();
        toast.success("Sub category updated successfully");
      } else {
        const response = await createSubCategory(payload).unwrap();
        toast.success("Sub category created successfully");
        onCreated?.(response?.data);
      }
      setOpen(false);
      form.resetFields();
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
          `Failed to ${isEditing ? "update" : "create"} sub category`
      );
    }
  };

  return (
    <InventoryFormModal
      open={open}
      setOpen={setOpen}
      entity="Sub Category"
      isEditing={isEditing}
      loading={loading}
      form={form}
      onSubmit={handleSubmit}
      initialValues={{
        name: data?.name ?? "",
        // The list read populates `category`; the form needs the plain id.
        category: data
          ? categoryOf(data)?._id ?? data.category
          : defaultCategory,
        image: data?.image ?? null,
        description: data?.description ?? "",
        isActive: data?.isActive ?? true,
      }}
    >
      <Form.Item label="Image" name="image">
        <UploadImage form={form} fieldPath="image" />
      </Form.Item>

      <FormSelect
        label="Parent Category"
        name="category"
        placeholder="Select a category"
        loading={loadingCategories}
        showSearch
        optionFilterProp="label"
        rules={[{ required: true, message: "Parent category is required" }]}
        options={categories.map((category) => ({
          label: category.name,
          value: category._id,
        }))}
      />

      <FormInput
        label="Sub Category Name"
        name="name"
        rules={[
          { required: true, message: "Name is required" },
          { max: 100, message: "Name must be 100 characters or fewer" },
        ]}
        placeholder="e.g. Mobile Phones"
      />

      <Form.Item
        label="Description"
        name="description"
        rules={[{ max: 500, message: "Description must be 500 characters or fewer" }]}
      >
        <Input.TextArea rows={3} placeholder="Optional short description" />
      </Form.Item>

      <Form.Item label="Status" name="isActive" valuePropName="checked">
        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
      </Form.Item>
    </InventoryFormModal>
  );
};

export default SubCategoryModal;
