import { Button, Image, Input, Modal, Select, Space, Switch, Tag, Tooltip } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { Edit, Search, Trash2 } from "lucide-react";
import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../../../components/Common/PageHeader";
import PageMeta from "../../../components/Common/PageMeta";
import PermissionGate from "../../../components/Common/PermissionGate";
import DataTable from "../../../components/Table/DataTable";
import { config } from "../../../config";
import {
  ICategory,
  useGetCategoriesQuery,
} from "../../../redux/features/inventory/categoryApi";
import {
  IProduct,
  refName,
  useDeleteProductMutation,
  useToggleProductStatusMutation,
} from "../../../redux/features/inventory/productApi";

const { confirm } = Modal;

/** Any of the three product query hooks — they share a request/response shape. */
type ProductQueryHook = (args: { name: string; value: any }[]) => {
  data?: any;
  isFetching: boolean;
};

interface ProductListViewProps {
  title: string;
  subtitle: string;
  breadcrumbLabel: string;
  canonicalPath: string;
  useQuery: ProductQueryHook;
  headerExtra?: ReactNode;
  /** Adds an expiry column — only meaningful on the Expired screen. */
  showExpiry?: boolean;
  emptyHint?: string;
}

/**
 * The product table, shared by Products, Expired Products and Low Stocks.
 *
 * Those three ask the same question of the same rows and differ only in which
 * endpoint narrows them, so the columns, the stock arithmetic and the row
 * actions live here once.
 */
const ProductListView = ({
  title,
  subtitle,
  breadcrumbLabel,
  canonicalPath,
  useQuery,
  headerExtra,
  showExpiry = false,
  emptyHint,
}: ProductListViewProps) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const queryParams = [
    { name: "page", value: currentPage },
    { name: "limit", value: limit },
    ...(searchText ? [{ name: "keyword", value: searchText }] : []),
    ...(categoryFilter ? [{ name: "category", value: categoryFilter }] : []),
    ...(typeFilter ? [{ name: "type", value: typeFilter }] : []),
  ];

  const { data, isFetching } = useQuery(queryParams);
  const [deleteProduct] = useDeleteProductMutation();
  const [toggleStatus] = useToggleProductStatusMutation();

  const { data: categoryData } = useGetCategoriesQuery([
    { name: "limit", value: 500 },
  ]);
  const categories: ICategory[] = categoryData?.data?.data || [];

  const products: IProduct[] = data?.data?.data || [];
  const total: number = data?.data?.meta?.total || 0;

  const handleDelete = (product: IProduct) => {
    confirm({
      title: `Delete "${product.name}"?`,
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteProduct(product._id).unwrap();
          toast.success("Product deleted successfully");
        } catch (error: any) {
          toast.error(error?.data?.message || "Failed to delete product");
        }
      },
    });
  };

  const handleToggleStatus = async (product: IProduct) => {
    setTogglingId(product._id);
    try {
      await toggleStatus(product._id).unwrap();
      toast.success(
        `Product ${product.isActive ? "deactivated" : "activated"} successfully`
      );
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const columns: ColumnsType<IProduct> = [
    {
      title: "Product",
      key: "name",
      width: 280,
      render: (_, record) => {
        const [firstImage] = record.images ?? [];
        return (
          <div className="flex items-center gap-3 min-w-0">
            {firstImage ? (
              <Image
                src={
                  firstImage.startsWith("http")
                    ? firstImage
                    : `${config.image_access_url}${firstImage}`
                }
                alt={record.name}
                width={42}
                height={42}
                style={{ objectFit: "cover", borderRadius: 6 }}
              />
            ) : (
              <div className="w-[42px] h-[42px] rounded-md bg-secondary-100 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-semibold text-secondary-800 m-0 truncate">
                {record.name}
              </p>
              <span className="text-xs text-secondary-400 font-mono">
                {record.sku}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 110,
      render: (type: string, record) =>
        type === "variable" ? (
          <Tooltip title={`${record.variants?.length ?? 0} variants`}>
            <Tag color="blue">Variable</Tag>
          </Tooltip>
        ) : (
          <Tag>Single</Tag>
        ),
    },
    {
      title: "Category",
      key: "category",
      width: 160,
      render: (_, record) => {
        const name = refName(record.category);
        const sub = refName(record.subCategory);
        return name ? (
          <div>
            <p className="m-0 text-secondary-800">{name}</p>
            {sub && <span className="text-xs text-secondary-400">{sub}</span>}
          </div>
        ) : (
          <span className="text-secondary-400">—</span>
        );
      },
    },
    {
      title: "Brand",
      key: "brand",
      width: 130,
      render: (_, record) =>
        refName(record.brand) || <span className="text-secondary-400">—</span>,
    },
    {
      title: "Price",
      key: "price",
      width: 130,
      render: (_, record) => {
        if (record.type === "single") {
          return <span className="font-medium">{record.sellingPrice}</span>;
        }
        // A variable product has no single price, so the table shows the range
        // its variants actually sell at rather than an invented headline price.
        const prices = (record.variants ?? []).map(
          (variant) => variant.sellingPrice
        );
        if (prices.length === 0) return <span className="text-secondary-400">—</span>;
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return (
          <span className="font-medium">
            {min === max ? min : `${min} – ${max}`}
          </span>
        );
      },
    },
    {
      title: "Stock",
      key: "stock",
      width: 120,
      render: (_, record) => {
        const unit = refName(record.unit);
        return (
          <div className="flex items-center gap-2">
            <span
              className={
                record.isLowStock
                  ? "font-semibold text-danger"
                  : "font-medium text-secondary-800"
              }
            >
              {record.totalQuantity}
            </span>
            {unit && <span className="text-xs text-secondary-400">{unit}</span>}
          </div>
        );
      },
    },
    ...(showExpiry
      ? ([
          {
            title: "Expired On",
            key: "nearestExpiryDate",
            width: 150,
            render: (_: unknown, record: IProduct) =>
              record.nearestExpiryDate ? (
                <div>
                  <p className="m-0 text-danger font-medium">
                    {dayjs(record.nearestExpiryDate).format("DD MMM YYYY")}
                  </p>
                  <span className="text-xs text-secondary-400">
                    {dayjs().diff(dayjs(record.nearestExpiryDate), "day")} days
                    ago
                  </span>
                </div>
              ) : (
                <span className="text-secondary-400">—</span>
              ),
          },
        ] as ColumnsType<IProduct>)
      : []),
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 130,
      render: (isActive: boolean, record) => (
        <PermissionGate
          module="Products"
          action="Update"
          fallback={
            <span className={isActive ? "text-primary" : "text-secondary-400"}>
              {isActive ? "Active" : "Inactive"}
            </span>
          }
        >
          <Switch
            checked={isActive}
            loading={togglingId === record._id}
            disabled={togglingId === record._id}
            checkedChildren="Active"
            unCheckedChildren="Inactive"
            onChange={() => handleToggleStatus(record)}
          />
        </PermissionGate>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <Space>
          <PermissionGate module="Products" action="Update">
            <Tooltip title="Edit Product">
              <Button
                icon={<Edit className="w-4 h-4" />}
                onClick={() =>
                  navigate(`/inventory/products/edit/${record._id}`)
                }
              />
            </Tooltip>
          </PermissionGate>
          <PermissionGate module="Products" action="Delete">
            <Tooltip title="Delete Product">
              <Button
                danger icon={<Trash2 className="w-4 h-4" />}
                onClick={() => handleDelete(record)}
              />
            </Tooltip>
          </PermissionGate>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageMeta
        title={`${title} - POS & Inventory Admin Panel`}
        description={subtitle}
        canonicalUrl={`${window.location.origin}${canonicalPath}`}
        noindex={true}
      />
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Inventory" },
          { title: breadcrumbLabel },
        ]}
        extra={headerExtra}
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="Search by name, SKU or barcode..."
          prefix={<Search className="w-4 h-4 text-secondary-400" />}
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setCurrentPage(1);
          }}
          allowClear
          className="max-w-md"
        />
        <Select
          placeholder="Filter by category"
          value={categoryFilter}
          onChange={(value) => {
            setCategoryFilter(value);
            setCurrentPage(1);
          }}
          allowClear
          showSearch
          optionFilterProp="label"
          className="min-w-[200px]"
          options={categories.map((category) => ({
            label: category.name,
            value: category._id,
          }))}
        />
        <Select
          placeholder="Filter by type"
          value={typeFilter}
          onChange={(value) => {
            setTypeFilter(value);
            setCurrentPage(1);
          }}
          allowClear
          className="min-w-[160px]"
          options={[
            { label: "Single", value: "single" },
            { label: "Variable", value: "variable" },
          ]}
        />
      </div>

      {emptyHint && total === 0 && !isFetching && (
        <p className="mb-4 text-sm text-secondary-500">{emptyHint}</p>
      )}

      <DataTable
        data={products}
        columns={columns}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        limit={limit}
        setLimit={setLimit}
        total={total}
        isPaginate={total > limit}
        loading={isFetching}
        rowKey="_id"
      />
    </div>
  );
};

export default ProductListView;
