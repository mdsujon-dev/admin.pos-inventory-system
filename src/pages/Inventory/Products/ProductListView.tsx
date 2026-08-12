import { Button, Image, Input, Modal, Select, Space, Switch, Tag, Tooltip } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { Edit, Image as ImageIcon, Search, Trash2 } from "lucide-react";
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

/** "today" / "1 day ago" / "12 days ago" — compared by calendar day. */
const daysSince = (date: string) => {
  const days = dayjs().startOf("day").diff(dayjs(date).startOf("day"), "day");
  if (days <= 0) return "today";
  return days === 1 ? "1 day ago" : `${days} days ago`;
};

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
              <div className="flex w-[42px] h-[42px] shrink-0 items-center justify-center rounded-md bg-secondary-100 text-secondary-400">
                <ImageIcon className="h-5 w-5" />
              </div>
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
          </div>
        );
      },
    },
    ...(showExpiry
      ? ([
          {
            title: "Expired On",
            key: "nearestExpiryDate",
            width: 330,
            render: (_: unknown, record: IProduct) => {
              if (!record.nearestExpiryDate) {
                return <span className="text-secondary-400">—</span>;
              }

              // On a variable product the date above is only the earliest of
              // its variants, which on its own does not say what to pull off
              // the shelf. The rows that actually expired are named here.
              const expired = (record.variants ?? [])
                .filter(
                  (variant) =>
                    variant.expiryDate &&
                    dayjs(variant.expiryDate).isBefore(dayjs())
                )
                .sort(
                  (a, b) =>
                    dayjs(a.expiryDate!).valueOf() -
                    dayjs(b.expiryDate!).valueOf()
                );

              const label = (variant: (typeof expired)[number]) =>
                `${variant.name || variant.sku} — ${dayjs(
                  variant.expiryDate!
                ).format("DD MMM YYYY")}`;

              const isVariable =
                record.type === "variable" && expired.length > 0;

              // Date on the left, the variants that caused it alongside — one
              // stacked under the other doubled the height of every row on the
              // screen for two short tags.
              return (
                <div className="flex items-center gap-3">
                  <div className="shrink-0">
                    <p className="m-0 font-medium leading-tight text-danger">
                      {dayjs(record.nearestExpiryDate).format("DD MMM YYYY")}
                    </p>
                    <span className="text-xs text-secondary-400">
                      {daysSince(record.nearestExpiryDate)}
                      {isVariable &&
                        ` · ${expired.length} of ${
                          record.variants?.length ?? 0
                        } expired`}
                    </span>
                  </div>

                  {isVariable && (
                    <div className="flex min-w-0 flex-wrap items-center gap-1">
                      {expired.slice(0, 2).map((variant) => (
                        <Tooltip
                          key={variant._id ?? variant.sku}
                          title={label(variant)}
                        >
                          <Tag className="!m-0 !max-w-[110px] !truncate !border-danger/30 !bg-danger/10 !px-1.5 !text-[11px] !text-danger">
                            {variant.name || variant.sku}
                          </Tag>
                        </Tooltip>
                      ))}
                      {expired.length > 2 && (
                        <Tooltip
                          title={
                            <div className="space-y-0.5">
                              {expired.slice(2).map((variant) => (
                                <div key={variant._id ?? variant.sku}>
                                  {label(variant)}
                                </div>
                              ))}
                            </div>
                          }
                        >
                          <Tag className="!m-0 !px-1.5 !text-[11px]">
                            +{expired.length - 2}
                          </Tag>
                        </Tooltip>
                      )}
                    </div>
                  )}
                </div>
              );
            },
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
