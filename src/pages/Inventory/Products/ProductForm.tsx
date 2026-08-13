import {
  Button,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
} from "antd";
import dayjs from "dayjs";
import {
  Boxes,
  Layers,
  Package,
  Percent,
  Plus,
  Power,
  Sparkles,
  Tags,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { ReactElement, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../../../components/Common/PageHeader";
import PageMeta from "../../../components/Common/PageMeta";
import { FormInput } from "../../../components/Form/FormInput";
import { FormSelect } from "../../../components/Form/FormSelect";
import BrandModal from "../../../components/modal/inventory/BrandModal";
import CategoryModal from "../../../components/modal/inventory/CategoryModal";
import SubCategoryModal from "../../../components/modal/inventory/SubCategoryModal";
import UnitModal from "../../../components/modal/inventory/UnitModal";
import { Loading } from "../../../components/shared/Loading";
import UploadImage from "../../../components/shared/UploadImage";
import {
  IBrand,
  useGetBrandsQuery,
} from "../../../redux/features/inventory/brandApi";
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
import {
  IUnit,
  useGetUnitsQuery,
} from "../../../redux/features/inventory/unitApi";
import {
  IVariantAttribute,
  useGetVariantAttributesQuery,
} from "../../../redux/features/inventory/variantAttributeApi";
import Money from "../../../components/shared/Money";
import {
  SectionCard,
  StatTile,
  TypePicker,
  type TypeOption,
} from "./ProductFormUI";
import { useVariantBuilder } from "./useVariantBuilder";
import VariantCards from "./VariantCards";

const activeOnly = [
  { name: "limit", value: 500 },
  { name: "isActive", value: true },
];

/** Four across on a wide screen, two on a tablet, one on a phone. */
const ROW = "grid gap-x-4 sm:grid-cols-2 lg:grid-cols-4";

/** The pickers that can also make what they are picking. */
type Creatable = "brand" | "unit" | "category" | "subCategory";

const TYPE_OPTIONS: TypeOption[] = [
  {
    value: "single",
    icon: Package,
    title: "Single Product",
    hint: "One SKU, one price, one stock count",
  },
  {
    value: "variable",
    icon: Layers,
    title: "Variable Product",
    hint: "Sizes or colours, each priced and stocked on its own",
  },
];

/**
 * A barcode you can read off the label and still know what you are holding.
 *
 * The SKU's letters and digits, then a short tail from the clock so two
 * products sharing a root never print the same code. Code 128 is what the
 * label renderer draws and it carries the whole alphabet, so there is nothing
 * to gain from falling back to an opaque run of digits.
 */
const generateBarcode = (sku: string, name: string, index: number = 0) => {
  const root =
    (sku || name || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10) || "ITEM";
  return `${root}-${(Date.now() + index).toString().slice(-6)}`;
};

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
  // Which "add new" modal a picker has opened, if any.
  const [addingNew, setAddingNew] = useState<Creatable | null>(null);

  const { data: productData, isFetching: loadingProduct } =
    useGetProductByIdQuery(id as string, { skip: !isEditing });
  const product: IProduct | undefined = productData?.data;

  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();

  const { data: categoryData } = useGetCategoriesQuery(activeOnly);
  const { data: subCategoryData } = useGetSubCategoriesQuery(activeOnly);
  const { data: brandData } = useGetBrandsQuery(activeOnly);
  const { data: unitData } = useGetUnitsQuery(activeOnly);
  const { data: attributeData } = useGetVariantAttributesQuery(activeOnly);

  const categories: ICategory[] = categoryData?.data?.data || [];
  // Memoised because the filter below depends on it; an inline `|| []`
  // fallback would be a new array each render and re-filter every time.
  const subCategories: ISubCategory[] = useMemo(
    () => subCategoryData?.data?.data || [],
    [subCategoryData],
  );
  const brands: IBrand[] = brandData?.data?.data || [];
  const units: IUnit[] = unitData?.data?.data || [];
  const attributes: IVariantAttribute[] = attributeData?.data?.data || [];

  const productType = Form.useWatch("type", form) ?? "single";
  const selectedCategory = Form.useWatch("category", form);
  const lowStockAlert = Form.useWatch("lowStockAlert", form) ?? 0;
  const skuValue = Form.useWatch("sku", form) ?? "";
  const purchasePrice = Form.useWatch("purchasePrice", form) ?? 0;
  const extraCost = Form.useWatch("cost", form) ?? 0;
  const sellingPrice = Form.useWatch("sellingPrice", form) ?? 0;
  // Watched for the pricing read-outs rather than for the fields themselves,
  // which AntD already owns.
  const discountPrice = Form.useWatch("discountPrice", form);
  const quantity = Form.useWatch("quantity", form) ?? 0;
  const isActive = Form.useWatch("isActive", form) ?? true;

  const { variants, addVariant, generate, updateVariant, removeVariant } =
    useVariantBuilder({ initial: product?.variants ?? [] });

  // A sub category only makes sense under its own parent, so the list narrows
  // as soon as a category is picked.
  const availableSubCategories = useMemo(
    () =>
      subCategories.filter(
        (subCategory) => categoryOf(subCategory)?._id === selectedCategory,
      ),
    [subCategories, selectedCategory],
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

  /**
   * Puts an "add new" row under a picker's options.
   *
   * Nothing here is worth leaving the half-filled form for: a brand that turns
   * out to be missing is two fields, and sending someone to Brands and back
   * costs them everything they had typed.
   */
  const withCreate =
    (entity: Creatable, label: string) => (menu: ReactElement) => (
      <>
        {menu}
        <Divider className="!my-1" />
        <div className="p-1.5">
          <button
            type="button"
            // The select takes focus on mousedown and closes the popup with it,
            // which would tear the button out from under the click.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setAddingNew(entity)}
            className="flex w-full items-center justify-center gap-2 rounded-[7px] border border-primary px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
          >
            <Plus className="h-4 w-4" />
            {label}
          </button>
        </div>
      </>
    );

  // Whatever was just created is what the user wanted selected — they opened
  // the modal from this field.
  const selectCreated = (field: Creatable) => (created?: { _id: string }) => {
    if (created?._id) form.setFieldValue(field, created._id);
    setAddingNew(null);
  };

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
          variant.discountPrice > variant.sellingPrice,
      );
      if (badDiscount) {
        toast.error(
          `"${badDiscount.name}" has a discount price above its selling price`,
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
      description: values.description?.trim() || "",
      images: values.images || [],
      weight: values.weight === undefined ? null : values.weight,
      lowStockAlert: Number(values.lowStockAlert) || 0,
      // Both product types carry one: a variable product's variants can expire
      // on their own dates, but the batch itself still has a shelf life.
      expiryDate: values.expiryDate ? values.expiryDate.toISOString() : null,
      isActive: values.isActive ?? true,
    };

    // An empty SKU is left off entirely so the API generates one; sending ""
    // would be a request to name it the empty string.
    if (values.sku?.trim()) payload.sku = values.sku.trim().toUpperCase();

    if (values.type === "single") {
      // Left blank means "give me one", not "this product has none" — every
      // single product ends up on a shelf label sooner or later.
      payload.barcode =
        values.barcode?.trim() ||
        generateBarcode(values.sku ?? "", values.name ?? "");
      payload.purchasePrice = Number(values.purchasePrice) || 0;
      payload.cost = Number(values.cost) || 0;
      payload.sellingPrice = Number(values.sellingPrice) || 0;
      payload.discountPrice =
        values.discountPrice === null || values.discountPrice === undefined
          ? null
          : Number(values.discountPrice);
      payload.quantity = Number(values.quantity) || 0;
    } else {
      // Sent as a whole array — a variant the user removed here is simply
      // absent, which is what deletes it on the server.
      payload.variants = variants.map((variant, index) => ({
        ...(variant._id ? { _id: variant._id } : {}),
        name: variant.name.trim(),
        options: variant.options ?? [],
        sku: variant.sku.trim().toUpperCase(),
        barcode: variant.barcode?.trim() || generateBarcode(variant.sku, variant.name, index),
        description: variant.description?.trim() || "",
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
          `Failed to ${isEditing ? "update" : "create"} product`,
      );
    }
  };

  if (isEditing && loadingProduct) return <Loading />;

  const totalCost = (Number(purchasePrice) || 0) + (Number(extraCost) || 0);

  // What the product actually sells for, and what that leaves. An offer price
  // is the one being charged, so the margin has to be measured against it —
  // reading the shelf price would flatter every discounted line on the list.
  const listPrice = Number(sellingPrice) || 0;
  const offer = discountPrice == null ? null : Number(discountPrice) || 0;
  const effectivePrice = offer && offer > 0 ? offer : listPrice;
  const profit = effectivePrice - totalCost;
  const margin = effectivePrice > 0 ? (profit / effectivePrice) * 100 : 0;
  const stockValue = totalCost * (Number(quantity) || 0);

  return (
    /* Tall enough to reach the bottom of the scroll area even when the form is
       short — that is what gives the action bar below something to pin against,
       so it sits on the bottom edge of the screen in every state instead of
       drifting up to wherever the content happens to end. 70px of header plus
       the layout's own page padding. */
    <div className="flex min-h-[calc(100dvh-94px)] flex-col sm:min-h-[calc(100dvh-102px)]">
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
        className="flex flex-1 flex-col"
      >
        <div className="flex flex-1 flex-col gap-4">
          <SectionCard
            icon={Boxes}
            title="Product Details"
            subtitle="What it is, where it files, how it is measured"
          >
            <Form.Item label="Product Type" name="type">
              <TypePicker options={TYPE_OPTIONS} />
            </Form.Item>

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
                popupRender={withCreate("brand", "Add new brand")}
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
                popupRender={withCreate("unit", "Add new unit")}
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
                popupRender={withCreate("category", "Add new category")}
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
                popupRender={withCreate("subCategory", "Add new sub category")}
                options={availableSubCategories.map((subCategory) => ({
                  label: subCategory.name,
                  value: subCategory._id,
                }))}
              />
              <Form.Item
                label="Expiry Date"
                name="expiryDate"
                tooltip="The product shows on Expired Products past this date"
              >
                <DatePicker className="w-full" placeholder="Optional" />
              </Form.Item>
              <Form.Item label="Weight" name="weight">
                <InputNumber
                  type="number"
                  min={0}
                  className="w-full"
                  placeholder="Optional"
                />
              </Form.Item>
            </div>

            <Form.Item
              label="Description"
              name="description"
              rules={[{ max: 5000, message: "Description is too long" }]}
            >
              <Input.TextArea rows={4} placeholder="Optional description" />
            </Form.Item>

            <Form.Item 
              label="Product Images" 
              name="images" 
              tooltip="The first one is what lists and receipts show"
            >
              <UploadImage form={form} fieldPath="images" mode="multiple" />
            </Form.Item>
          </SectionCard>

          {productType === "single" ? (
            <SectionCard
              icon={Wallet}
              title="Pricing & Stock"
              subtitle="What it costs, what it sells for, how many are on the shelf"
            >
              <div className={ROW}>
                <Form.Item label="Purchase Price" name="purchasePrice">
                  <InputNumber type="number" min={0} className="w-full" />
                </Form.Item>
                <Form.Item
                  label="Cost"
                  name="cost"
                  tooltip="Freight, duty, handling — anything on top of the purchase price"
                >
                  <InputNumber type="number" min={0} className="w-full" />
                </Form.Item>
                <Form.Item label="Total Cost" tooltip="Purchase Price + Cost">
                  {/* Read-only: the server derives this, so an editable field
                      here would just be a second answer to the same sum. */}
                  <InputNumber
                    type="number"
                    value={totalCost}
                    disabled
                    className="w-full"
                  />
                </Form.Item>
                <Form.Item
                  label="Selling Price"
                  name="sellingPrice"
                  rules={[
                    { required: true, message: "Selling price is required" },
                  ]}
                >
                  <InputNumber type="number" min={0} className="w-full" />
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
                              "Cannot be higher than the selling price",
                            ),
                    },
                  ]}
                >
                  <InputNumber
                    type="number"
                    min={0}
                    className="w-full"
                    placeholder="Optional"
                  />
                </Form.Item>
                <Form.Item
                  label="Opening Stock"
                  name="quantity"
                  tooltip="What is on the shelf right now. From here on stock arrives through Purchases, which is what records who supplied it and at what cost — a number typed here is booked at this product's own cost."
                >
                  <InputNumber
                    type="number"
                    min={0}
                    precision={0}
                    className="w-full"
                  />
                </Form.Item>

                <FormInput
                  label="Barcode"
                  name="barcode"
                  tooltip="Left blank, one is generated from the SKU on save"
                  placeholder="Scanned at the till"
                  suffix={
                    <button
                      type="button"
                      onClick={() =>
                        form.setFieldValue(
                          "barcode",
                          generateBarcode(
                            String(skuValue),
                            String(form.getFieldValue("name") ?? ""),
                          ),
                        )
                      }
                      className="font-medium text-primary transition-colors hover:text-primary-700"
                    >
                      Generate
                    </button>
                  }
                />
              </div>

              {/* The arithmetic nobody should be doing in their head while
                  typing prices in. Recomputed as the fields change, so a
                  discount that eats the margin says so before the save. */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile icon={Wallet} label="Total cost" tone="muted">
                  <Money value={totalCost} />
                </StatTile>
                <StatTile
                  icon={Tags}
                  label="Sells at"
                  tone="brand"
                  note={
                    offer && offer > 0 && offer < listPrice
                      ? `Offer price — list is ৳${listPrice.toLocaleString("en-BD")}`
                      : undefined
                  }
                >
                  <Money value={effectivePrice} />
                </StatTile>
                <StatTile
                  icon={TrendingUp}
                  label="Profit / unit"
                  tone={profit < 0 ? "danger" : "brand"}
                  note={profit < 0 ? "Selling below cost" : undefined}
                >
                  <Money value={profit} />
                </StatTile>
                <StatTile
                  icon={Percent}
                  label="Margin"
                  tone={profit < 0 ? "danger" : "brand"}
                  note={
                    stockValue > 0
                      ? `৳${stockValue.toLocaleString("en-BD")} tied up in stock`
                      : undefined
                  }
                >
                  {effectivePrice > 0 ? `${margin.toFixed(1)}%` : "—"}
                </StatTile>
              </div>
            </SectionCard>
          ) : (
            <SectionCard
              icon={Layers}
              title="Product Variants"
              subtitle={
                variants.length === 1
                  ? "1 variant on this product"
                  : `${variants.length} variants on this product`
              }
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
              {attributes.length > 0 && (
                <>
                  {/* Tinted so the builder reads as a tool sitting above the
                      list, not as another row of the variant being edited. */}
                  <div className="mb-4 rounded-xl border border-primary-100 bg-primary-50/50 p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-primary-700">
                      <Sparkles className="h-4 w-4" />
                      Build combinations
                      <span className="font-normal text-secondary-500">
                        — pick values, then generate the grid
                      </span>
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {attributes.map((attribute) => (
                        <div key={attribute._id}>
                          <label className="mb-1 block text-[13px] font-medium text-secondary-700">
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
                  </div>
                </>
              )}

              <VariantCards
                variants={variants}
                onChange={updateVariant}
                onRemove={removeVariant}
                onAdd={addVariant}
                fallbackLowStock={Number(lowStockAlert) || 0}
              />
            </SectionCard>
          )}

          {/* One line rather than a card: the whole control is a switch, and a
              heading plus a panel around it was three times the height of the
              thing it was labelling. The icon carries the state. */}
          <div className="flex items-center gap-2.5 rounded-xl border border-secondary-100 bg-white px-4 py-3 shadow-card">
            <Power
              className={`h-4 w-4 transition-colors ${
                isActive ? "text-primary" : "text-secondary-400"
              }`}
            />
            <span className="text-sm font-medium text-secondary-700">
              Status
            </span>
            <div className="ml-auto flex items-center">
              <Form.Item
                name="isActive"
                valuePropName="checked"
                noStyle
              >
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </div>
          </div>

          {/* The header's twin at the other end of the screen: same glass,
              pinned the same way, a touch shorter than the 70px top band.
              `mt-auto` holds it against the bottom of the column so it never
              rides up with short content, and the negative margins cancel the
              layout's page padding so it spans edge to edge. */}
          <div className="sticky bottom-0 z-30 -mx-3 -mb-3 mt-auto flex h-[70px] items-center justify-end gap-3 border-t border-primary/20 bg-white/80 px-3 backdrop-blur-lg sm:-mx-4 sm:-mb-4 sm:px-6">
            <Button
              className="min-w-28"
              onClick={() => navigate("/inventory/products")}
              disabled={creating || updating}
            >
              Cancel
            </Button>
            <Button
              className="min-w-36 !border-0 !bg-gradient-to-r !from-primary-600 !to-primary-500 shadow-primary hover:!from-primary-700 hover:!to-primary-600"
              type="primary"
              htmlType="submit"
              loading={creating || updating}
            >
              {isEditing ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </div>
      </Form>

      {/* Mounted only while open, so each one starts on a clean form — the
          shared modal shell reads `initialValues` once, on mount. */}
      {addingNew === "brand" && (
        <BrandModal
          open
          setOpen={() => setAddingNew(null)}
          onCreated={selectCreated("brand")}
        />
      )}
      {addingNew === "unit" && (
        <UnitModal
          open
          setOpen={() => setAddingNew(null)}
          onCreated={selectCreated("unit")}
        />
      )}
      {addingNew === "category" && (
        <CategoryModal
          open
          setOpen={() => setAddingNew(null)}
          onCreated={selectCreated("category")}
        />
      )}
      {addingNew === "subCategory" && (
        <SubCategoryModal
          open
          setOpen={() => setAddingNew(null)}
          // The picker is only reachable once a category is chosen, and that
          // is the parent the new one belongs under.
          defaultCategory={selectedCategory}
          onCreated={selectCreated("subCategory")}
        />
      )}
    </div>
  );
};

export default ProductForm;
