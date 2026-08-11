import {
  Button,
  Card,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Switch,
} from "antd";
import dayjs from "dayjs";
import { Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../../../components/Common/PageHeader";
import PageMeta from "../../../components/Common/PageMeta";
import { FormInput } from "../../../components/Form/FormInput";
import { FormSelect } from "../../../components/Form/FormSelect";
import { Loading } from "../../../components/shared/Loading";
import UploadImage from "../../../components/shared/UploadImage";
import { IBrand, useGetBrandsQuery } from "../../../redux/features/inventory/brandApi";
import {
  ICategory,
  useGetCategoriesQuery,
} from "../../../redux/features/inventory/categoryApi";
import {
  IProduct,
  refId,
  useCreateProductMutation,
  useGetProductByIdQuery,
  useUpdateProductMutation,
} from "../../../redux/features/inventory/productApi";
import {
  categoryOf,
  ISubCategory,
  useGetSubCategoriesQuery,
} from "../../../redux/features/inventory/subCategoryApi";
import { IUnit, useGetUnitsQuery } from "../../../redux/features/inventory/unitApi";
import {
  IVariantAttribute,
  useGetVariantAttributesQuery,
} from "../../../redux/features/inventory/variantAttributeApi";
import {
  IWarranty,
  useGetWarrantiesQuery,
} from "../../../redux/features/inventory/warrantyApi";
import { useVariantBuilder } from "./useVariantBuilder";
import VariantCards from "./VariantCards";

const activeOnly = [
  { name: "limit", value: 500 },
  { name: "isActive", value: true },
];

/** Four across on a wide screen, two on a tablet, one on a phone. */
const ROW = "grid gap-x-4 sm:grid-cols-2 lg:grid-cols-4";

/**
 * Create and edit in one screen.
 *
 * The two differ only in whether an id is in the URL and which verb the save
 * button uses — a separate edit page would be this file with three words
 * changed, and the variant editor is the last thing worth maintaining twice.
 */
const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form] = Form.useForm();
  const [attributeSelections, setAttributeSelections] = useState<
    Record<string, string[]>
  >({});

  const { data: productData, isFetching: loadingProduct } =
    useGetProductByIdQuery(id as string, { skip: !isEditing });
  const product: IProduct | undefined = productData?.data;

  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();

  const { data: categoryData } = useGetCategoriesQuery(activeOnly);
  const { data: subCategoryData } = useGetSubCategoriesQuery(activeOnly);
  const { data: brandData } = useGetBrandsQuery(activeOnly);
  const { data: unitData } = useGetUnitsQuery(activeOnly);
  const { data: warrantyData } = useGetWarrantiesQuery(activeOnly);
  const { data: attributeData } = useGetVariantAttributesQuery(activeOnly);

  const categories: ICategory[] = categoryData?.data?.data || [];
  // Memoised because the filter below depends on it; an inline `|| []`
  // fallback would be a new array each render and re-filter every time.
  const subCategories: ISubCategory[] = useMemo(
    () => subCategoryData?.data?.data || [],
    [subCategoryData]
  );
  const brands: IBrand[] = brandData?.data?.data || [];
  const units: IUnit[] = unitData?.data?.data || [];
  const warranties: IWarranty[] = warrantyData?.data?.data || [];
  const attributes: IVariantAttribute[] = attributeData?.data?.data || [];

  const productType = Form.useWatch("type", form) ?? "single";
  const selectedCategory = Form.useWatch("category", form);
  const lowStockAlert = Form.useWatch("lowStockAlert", form) ?? 0;
  const skuValue = Form.useWatch("sku", form) ?? "";
  const purchasePrice = Form.useWatch("purchasePrice", form) ?? 0;
  const extraCost = Form.useWatch("cost", form) ?? 0;
  const sellingPrice = Form.useWatch("sellingPrice", form) ?? 0;

  const { variants, addVariant, generate, updateVariant, removeVariant } =
    useVariantBuilder({ initial: product?.variants ?? [] });

  // A sub category only makes sense under its own parent, so the list narrows
  // as soon as a category is picked.
  const availableSubCategories = useMemo(
    () =>
      subCategories.filter(
        (subCategory) => categoryOf(subCategory)?._id === selectedCategory
      ),
    [subCategories, selectedCategory]
  );

  const initialValues = useMemo(() => {
    if (!product) {
      return {
        type: "single",
        isActive: true,
        purchasePrice: 0,
        cost: 0,
        sellingPrice: 0,
        discountPrice: null,
        quantity: 0,
        lowStockAlert: 0,
        images: [],
      };
    }

    return {
      name: product.name,
      sku: product.sku,
      type: product.type,
      category: refId(product.category),
      subCategory: refId(product.subCategory),
      brand: refId(product.brand),
      unit: refId(product.unit),
      warranty: refId(product.warranty),
      description: product.description ?? "",
      images: product.images ?? [],
      weight: product.weight ?? null,
      barcode: product.barcode ?? "",
      purchasePrice: product.purchasePrice ?? 0,
      cost: product.cost ?? 0,
      sellingPrice: product.sellingPrice ?? 0,
      discountPrice: product.discountPrice ?? null,
      quantity: product.quantity ?? 0,
      expiryDate: product.expiryDate ? dayjs(product.expiryDate) : null,
      lowStockAlert: product.lowStockAlert ?? 0,
      isActive: product.isActive,
    };
  }, [product]);

  const handleGenerate = () => {
    const selections = Object.entries(attributeSelections)
      .map(([attribute, values]) => ({ attribute, values }))
      .filter((selection) => selection.values.length > 0);

    if (selections.length === 0) {
      toast.error("Pick at least one attribute value first");
      return;
    }

    generate(selections, String(skuValue).trim().toUpperCase());
  };

  const handleSubmit = async (values: any) => {
    if (values.type === "variable") {
      if (variants.length === 0) {
        toast.error("Add at least one variant before saving");
        return;
      }
      if (variants.some((variant) => !variant.name?.trim())) {
        toast.error("Every variant needs a name");
        return;
      }
      if (variants.some((variant) => !variant.sku?.trim())) {
        toast.error("Every variant needs a SKU");
        return;
      }
      const badDiscount = variants.find(
        (variant) =>
          variant.discountPrice != null &&
          variant.discountPrice > variant.sellingPrice
      );
      if (badDiscount) {
        toast.error(
          `"${badDiscount.name}" has a discount price above its selling price`
        );
        return;
      }
    }

    const payload: Record<string, unknown> = {
      name: values.name?.trim(),
      type: values.type,
      category: values.category,
      subCategory: values.subCategory || null,
      brand: values.brand || null,
      unit: values.unit,
      warranty: values.warranty || null,
      description: values.description?.trim() || "",
      images: values.images || [],
      weight: values.weight === undefined ? null : values.weight,
      lowStockAlert: Number(values.lowStockAlert) || 0,
      isActive: values.isActive ?? true,
    };

    // An empty SKU is left off entirely so the API generates one; sending ""
    // would be a request to name it the empty string.
    if (values.sku?.trim()) payload.sku = values.sku.trim().toUpperCase();

    if (values.type === "single") {
      payload.barcode = values.barcode?.trim() || null;
      payload.purchasePrice = Number(values.purchasePrice) || 0;
      payload.cost = Number(values.cost) || 0;
      payload.sellingPrice = Number(values.sellingPrice) || 0;
      payload.discountPrice =
        values.discountPrice === null || values.discountPrice === undefined
          ? null
          : Number(values.discountPrice);
      payload.quantity = Number(values.quantity) || 0;
      payload.expiryDate = values.expiryDate
        ? values.expiryDate.toISOString()
        : null;
    } else {
      // Sent as a whole array — a variant the user removed here is simply
      // absent, which is what deletes it on the server.
      payload.variants = variants.map((variant) => ({
        ...(variant._id ? { _id: variant._id } : {}),
        name: variant.name.trim(),
        options: variant.options ?? [],
        sku: variant.sku.trim().toUpperCase(),
        barcode: variant.barcode?.trim() || null,
        weight: variant.weight ?? null,
        purchasePrice: Number(variant.purchasePrice) || 0,
        cost: Number(variant.cost) || 0,
        sellingPrice: Number(variant.sellingPrice) || 0,
        discountPrice:
          variant.discountPrice === null || variant.discountPrice === undefined
            ? null
            : Number(variant.discountPrice),
        quantity: Number(variant.quantity) || 0,
        lowStockAlert:
          variant.lowStockAlert === null || variant.lowStockAlert === undefined
            ? null
            : Number(variant.lowStockAlert),
        expiryDate: variant.expiryDate || null,
        image: variant.image || null,
        images: variant.images ?? [],
        isActive: variant.isActive ?? true,
      }));
    }

    try {
      if (isEditing) {
        await updateProduct({ id: id as string, data: payload }).unwrap();
        toast.success("Product updated successfully");
      } else {
        await createProduct(payload).unwrap();
        toast.success("Product created successfully");
      }
      navigate("/inventory/products");
    } catch (error: any) {
      toast.error(
        error?.data?.message ||
          `Failed to ${isEditing ? "update" : "create"} product`
      );
    }
  };

  if (isEditing && loadingProduct) return <Loading />;

  const totalCost = (Number(purchasePrice) || 0) + (Number(extraCost) || 0);

  return (
    <div>
      <PageMeta
        title={`${isEditing ? "Edit" : "Create"} Product - POS & Inventory`}
        description="Create and edit products, including variable products with variants"
        noindex={true}
      />
      <PageHeader
        title={isEditing ? "Edit Product" : "Create Product"}
        subtitle={
          isEditing
            ? "Update this product's details, pricing and stock"
            : "Add a new product to the catalog"
        }
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Inventory" },
          { title: "Products", path: "/inventory/products" },
          { title: isEditing ? "Edit" : "Create" },
        ]}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={initialValues}
        // Editing loads asynchronously, so the form is mounted before the
        // values exist; without this the fields stay on the create defaults.
        key={product?._id ?? "create"}
      >
        <div className="space-y-4">
          <Card title="Product Details">
            <Form.Item label="Product Type" name="type">
              <Radio.Group buttonStyle="solid" disabled={isEditing}>
                <Radio.Button value="single">Single Product</Radio.Button>
                <Radio.Button value="variable">Variable Product</Radio.Button>
              </Radio.Group>
            </Form.Item>
            {isEditing && (
              <p className="-mt-2 mb-4 text-xs text-secondary-500">
                Product type cannot be changed after creation — switching it
                would orphan the stock held against the other shape.
              </p>
            )}

            <div className={ROW}>
              <FormInput
                label="Product Name"
                name="name"
                rules={[
                  { required: true, message: "Name is required" },
                  { max: 200, message: "Name is too long" },
                ]}
                placeholder="e.g. Cotton T-Shirt"
              />
              <FormInput
                label="SKU"
                name="sku"
                help="Blank generates one from the name"
                placeholder="e.g. COTTON-T-SHIRT"
              />
              <FormSelect
                label="Brand"
                name="brand"
                placeholder="Select a brand"
                showSearch
                optionFilterProp="label"
                options={brands.map((brand) => ({
                  label: brand.name,
                  value: brand._id,
                }))}
              />
              <FormSelect
                label="Unit"
                name="unit"
                placeholder="Select a unit"
                showSearch
                optionFilterProp="label"
                rules={[{ required: true, message: "Unit is required" }]}
                options={units.map((unit) => ({
                  label: `${unit.name} (${unit.shortName})`,
                  value: unit._id,
                }))}
              />
            </div>

            <div className={ROW}>
              <FormSelect
                label="Category"
                name="category"
                placeholder="Select a category"
                showSearch
                optionFilterProp="label"
                rules={[{ required: true, message: "Category is required" }]}
                // Clearing the child keeps the pair coherent — a sub category
                // from the old parent would no longer belong to this product.
                onChange={() => form.setFieldValue("subCategory", undefined)}
                options={categories.map((category) => ({
                  label: category.name,
                  value: category._id,
                }))}
              />
              <FormSelect
                label="Sub Category"
                name="subCategory"
                placeholder={
                  selectedCategory
                    ? "Select a sub category"
                    : "Pick a category first"
                }
                disabled={!selectedCategory}
                showSearch
                optionFilterProp="label"
                options={availableSubCategories.map((subCategory) => ({
                  label: subCategory.name,
                  value: subCategory._id,
                }))}
              />
              <FormSelect
                label="Warranty"
                name="warranty"
                placeholder="Select a warranty"
                showSearch
                optionFilterProp="label"
                options={warranties.map((warranty) => ({
                  label: `${warranty.name} (${warranty.duration} ${warranty.period})`,
                  value: warranty._id,
                }))}
              />
              <Form.Item label="Weight" name="weight">
                <InputNumber min={0} className="w-full" placeholder="Optional" />
              </Form.Item>
            </div>

            <Form.Item
              label="Description"
              name="description"
              rules={[{ max: 5000, message: "Description is too long" }]}
            >
              <Input.TextArea rows={4} placeholder="Optional description" />
            </Form.Item>
          </Card>

          <Card title="Product Image">
            <Form.Item name="images">
              <UploadImage form={form} fieldPath="images" mode="multiple" />
            </Form.Item>
          </Card>


          {productType === "single" ? (
            <Card title="Pricing & Stock">
              <div className={ROW}>
                <Form.Item label="Purchase Price" name="purchasePrice">
                  <InputNumber min={0} className="w-full" />
                </Form.Item>
                <Form.Item
                  label="Cost"
                  name="cost"
                  tooltip="Freight, duty, handling — anything on top of the purchase price"
                >
                  <InputNumber min={0} className="w-full" />
                </Form.Item>
                <Form.Item label="Total Cost" tooltip="Purchase Price + Cost">
                  {/* Read-only: the server derives this, so an editable field
                      here would just be a second answer to the same sum. */}
                  <InputNumber value={totalCost} disabled className="w-full" />
                </Form.Item>
                <Form.Item
                  label="Selling Price"
                  name="sellingPrice"
                  rules={[
                    { required: true, message: "Selling price is required" },
                  ]}
                >
                  <InputNumber min={0} className="w-full" />
                </Form.Item>
              </div>

              <div className={ROW}>
                <Form.Item
                  label="Discount / Offer Price"
                  name="discountPrice"
                  rules={[
                    {
                      validator: (_, value) =>
                        value == null || value <= (Number(sellingPrice) || 0)
                          ? Promise.resolve()
                          : Promise.reject(
                              "Cannot be higher than the selling price"
                            ),
                    },
                  ]}
                >
                  <InputNumber min={0} className="w-full" placeholder="Optional" />
                </Form.Item>
                <Form.Item label="Current Stock" name="quantity">
                  <InputNumber min={0} precision={0} className="w-full" />
                </Form.Item>
                <Form.Item
                  label="Low Stock Alert At"
                  name="lowStockAlert"
                  tooltip="The product shows on Low Stocks at or below this"
                >
                  <InputNumber min={0} precision={0} className="w-full" />
                </Form.Item>
                <Form.Item label="Expiry Date" name="expiryDate">
                  <DatePicker className="w-full" />
                </Form.Item>
              </div>

              <div className={ROW}>
                <FormInput
                  label="Barcode"
                  name="barcode"
                  placeholder="Optional — scanned at the till"
                />
              </div>
            </Card>
          ) : (
            <Card
              title="Product Variants"
              extra={
                <Button
                  icon={<Sparkles className="h-4 w-4" />}
                  onClick={handleGenerate}
                  disabled={attributes.length === 0}
                >
                  Generate from Attributes
                </Button>
              }
            >
              <div className={ROW}>
                <Form.Item
                  label="Low Stock Alert At"
                  name="lowStockAlert"
                  tooltip="Default threshold for variants that don't set their own"
                >
                  <InputNumber min={0} precision={0} className="w-full" />
                </Form.Item>
              </div>

              {attributes.length > 0 && (
                <>
                  <p className="mb-2 text-[13px] font-medium text-secondary-700">
                    Build combinations (optional)
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {attributes.map((attribute) => (
                      <div key={attribute._id}>
                        <label className="mb-1 block text-[13px] text-secondary-600">
                          {attribute.name}
                        </label>
                        <Select
                          mode="multiple"
                          allowClear
                          className="w-full"
                          placeholder={`Select ${attribute.name.toLowerCase()}`}
                          value={attributeSelections[attribute.name] ?? []}
                          onChange={(values: string[]) =>
                            setAttributeSelections((previous) => ({
                              ...previous,
                              [attribute.name]: values,
                            }))
                          }
                          options={attribute.values.map((value) => ({
                            label: value,
                            value,
                          }))}
                        />
                      </div>
                    ))}
                  </div>
                  <Divider />
                </>
              )}

              <VariantCards
                variants={variants}
                onChange={updateVariant}
                onRemove={removeVariant}
                onAdd={addVariant}
                fallbackLowStock={Number(lowStockAlert) || 0}
              />
            </Card>
          )}

          <div className="flex justify-start mb-6">
            <Form.Item
              name="isActive"
              valuePropName="checked"
              className="mb-0"
            >
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          </div>

          {/* The header's twin at the other end of the screen: same glass,
              pinned the same way, a touch shorter than the 70px top band. The
              negative margins cancel the layout's page padding so it spans edge
              to edge instead of sitting inset like a card. */}
          <div className="sticky bottom-0 z-30 -mx-3 -mb-3 flex h-[45px] items-center justify-end gap-3 border-t border-primary/20 bg-white/80 px-3 backdrop-blur-lg sm:-mx-4 sm:-mb-4 sm:px-6">
            <Button
              className="min-w-28"
              onClick={() => navigate("/inventory/products")}
              disabled={creating || updating}
            >
              Cancel
            </Button>
            <Button
              className="min-w-36"
              type="primary"
              htmlType="submit"
              loading={creating || updating}
            >
              {isEditing ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default ProductForm;
