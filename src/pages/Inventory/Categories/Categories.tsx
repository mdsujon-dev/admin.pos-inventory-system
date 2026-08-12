import { Button, Image, Input, Modal, Space, Switch, Tooltip } from "antd";
import { ColumnsType } from "antd/es/table";
import { Edit, Image as ImageIcon, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import ExportMenu from "../../../components/Common/ExportMenu";
import PageHeader from "../../../components/Common/PageHeader";
import PageMeta from "../../../components/Common/PageMeta";
import PermissionGate from "../../../components/Common/PermissionGate";
import CategoryModal from "../../../components/modal/inventory/CategoryModal";
import DataTable from "../../../components/Table/DataTable";
import { config } from "../../../config";
import {
  ICategory,
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
  useLazyGetCategoriesQuery,
  useToggleCategoryStatusMutation,
} from "../../../redux/features/inventory/categoryApi";
import { makeSheet } from "../../../utils/tableExport";

const { confirm } = Modal;

const Categories = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [selected, setSelected] = useState<ICategory | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const queryParams = [
    { name: "page", value: currentPage },
    { name: "limit", value: limit },
    ...(searchText ? [{ name: "keyword", value: searchText }] : []),
  ];

  const { data, isFetching } = useGetCategoriesQuery(queryParams);
  const [fetchAllCategories] = useLazyGetCategoriesQuery();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [toggleStatus] = useToggleCategoryStatusMutation();

  const categories: ICategory[] = data?.data?.data || [];
  const total: number = data?.data?.meta?.total || 0;

  const openCreate = () => {
    setSelected(null);
    setIsOpenModal(true);
  };

  const openEdit = (category: ICategory) => {
    setSelected(category);
    setIsOpenModal(true);
  };

  const handleDelete = (category: ICategory) => {
    confirm({
      title: `Delete "${category.name}"?`,
      content:
        "This cannot be undone. Categories with sub categories cannot be deleted.",
      okText: "Yes, Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteCategory(category._id).unwrap();
          toast.success("Category deleted successfully");
        } catch (error: any) {
          toast.error(error?.data?.message || "Failed to delete category");
        }
      },
    });
  };

  const handleToggleStatus = async (category: ICategory) => {
    setTogglingId(category._id);
    try {
      await toggleStatus(category._id).unwrap();
      toast.success(
        `Category ${category.isActive ? "deactivated" : "activated"} successfully`
      );
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const columns: ColumnsType<ICategory> = [
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      width: 80,
      render: (image?: string | null) =>
        image ? (
          <Image
            src={
              image.startsWith("http")
                ? image
                : `${config.image_access_url}${image}`
            }
            alt="category"
            width={42}
            height={42}
            style={{ objectFit: "cover", borderRadius: 6 }}
          />
        ) : (
          <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-md bg-secondary-100 text-secondary-400">
            <ImageIcon className="h-5 w-5" />
          </div>
        ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record) => (
        <div>
          <p className="font-semibold text-secondary-800 m-0">{name}</p>
          <span className="text-xs text-secondary-400">{record.slug}</span>
        </div>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (description?: string) =>
        description || <span className="text-secondary-400">—</span>,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 130,
      render: (isActive: boolean, record) => (
        <PermissionGate
          module="Categories"
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
          <PermissionGate module="Categories" action="Update">
            <Tooltip title="Edit Category">
              <Button
                icon={<Edit className="w-4 h-4" />}
                onClick={() => openEdit(record)}
              />
            </Tooltip>
          </PermissionGate>
          <PermissionGate module="Categories" action="Delete">
            <Tooltip title="Delete Category">
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
        title="Categories - POS & Inventory Admin Panel"
        description="Manage product categories"
        canonicalUrl={`${window.location.origin}/inventory/categories`}
        noindex={true}
      />
      <PageHeader
        title="Category"
        subtitle="Group your products into top-level categories"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Inventory" },
          { title: "Category" },
        ]}
        extra={
          <div className="flex flex-wrap items-center gap-2">
            <ExportMenu
              sheet={async () => {
                const all = await fetchAllCategories([
                  { name: "page", value: 1 },
                  { name: "limit", value: 10000 },
                  ...(searchText
                    ? [{ name: "keyword", value: searchText }]
                    : []),
                ]).unwrap();

                return makeSheet({
                  title: "Categories",
                  unit: "category",
                  filters: [searchText && `Search: "${searchText}"`],
                  headers: ["Name", "Slug", "Description", "Status"],
                  rows: (all?.data?.data || []) as ICategory[],
                  isLow: (c: any) => !c.isActive,
                  cells: (c: any) => [
                    c.name || "—",
                    c.slug || "—",
                    c.description || "—",
                    c.isActive ? "Active" : "Inactive",
                  ],
                });
              }}
              disabled={total === 0}
            />
            <PermissionGate module="Categories" action="Create">
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={openCreate}
              >
                Add Category
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="Search by name or description..."
          prefix={<Search className="w-4 h-4 text-secondary-400" />}
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            // Page 3 of the old result set is usually empty for the new one.
            setCurrentPage(1);
          }}
          allowClear
          className="max-w-md"
        />
      </div>

      <DataTable
        data={categories}
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

      {isOpenModal && (
        <CategoryModal
          open={isOpenModal}
          setOpen={setIsOpenModal}
          data={selected}
        />
      )}
    </div>
  );
};

export default Categories;
