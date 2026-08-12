import { Button, Image, Input, Modal, Select, Space, Switch, Tag, Tooltip } from "antd";
import { ColumnsType } from "antd/es/table";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import ExportMenu from "../../../components/Common/ExportMenu";
import PageHeader from "../../../components/Common/PageHeader";
import PageMeta from "../../../components/Common/PageMeta";
import PermissionGate from "../../../components/Common/PermissionGate";
import SubCategoryModal from "../../../components/modal/inventory/SubCategoryModal";
import DataTable from "../../../components/Table/DataTable";
import { config } from "../../../config";
import {
  ICategory,
  useGetCategoriesQuery,
} from "../../../redux/features/inventory/categoryApi";
import {
  categoryOf,
  ISubCategory,
  useDeleteSubCategoryMutation,
  useGetSubCategoriesQuery,
  useLazyGetSubCategoriesQuery,
  useToggleSubCategoryStatusMutation,
} from "../../../redux/features/inventory/subCategoryApi";
import { makeSheet } from "../../../utils/tableExport";

const { confirm } = Modal;

const SubCategories = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [selected, setSelected] = useState<ISubCategory | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const queryParams = [
    { name: "page", value: currentPage },
    { name: "limit", value: limit },
    ...(searchText ? [{ name: "keyword", value: searchText }] : []),
    ...(categoryFilter ? [{ name: "category", value: categoryFilter }] : []),
  ];

  const { data, isFetching } = useGetSubCategoriesQuery(queryParams);
  const [fetchAllSubCategories] = useLazyGetSubCategoriesQuery();
  const [deleteSubCategory] = useDeleteSubCategoryMutation();
  const [toggleStatus] = useToggleSubCategoryStatusMutation();

  // Drives the parent filter — all categories, not just active ones, so rows
  // filed under a disabled parent are still reachable.
  const { data: categoryData } = useGetCategoriesQuery([
    { name: "limit", value: 500 },
  ]);
  const categories: ICategory[] = categoryData?.data?.data || [];

  const subCategories: ISubCategory[] = data?.data?.data || [];
  const total: number = data?.data?.meta?.total || 0;

  const openCreate = () => {
    setSelected(null);
    setIsOpenModal(true);
  };

  const openEdit = (subCategory: ISubCategory) => {
    setSelected(subCategory);
    setIsOpenModal(true);
  };

  const handleDelete = (subCategory: ISubCategory) => {
    confirm({
      title: `Delete "${subCategory.name}"?`,
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteSubCategory(subCategory._id).unwrap();
          toast.success("Sub category deleted successfully");
        } catch (error: any) {
          toast.error(error?.data?.message || "Failed to delete sub category");
        }
      },
    });
  };

  const handleToggleStatus = async (subCategory: ISubCategory) => {
    setTogglingId(subCategory._id);
    try {
      await toggleStatus(subCategory._id).unwrap();
      toast.success(
        `Sub category ${
          subCategory.isActive ? "deactivated" : "activated"
        } successfully`
      );
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const columns: ColumnsType<ISubCategory> = [
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
            alt="sub category"
            width={42}
            height={42}
            style={{ objectFit: "cover", borderRadius: 6 }}
          />
        ) : (
          <div className="h-[42px] w-[42px] shrink-0 rounded-md bg-secondary-100" />
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
      title: "Parent Category",
      key: "category",
      width: 190,
      render: (_, record) => {
        const parent = categoryOf(record);
        return parent ? (
          <Tag color="var(--primary)">{parent.name}</Tag>
        ) : (
          <span className="text-secondary-400">—</span>
        );
      },
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
          module="Sub Categories"
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
          <PermissionGate module="Sub Categories" action="Update">
            <Tooltip title="Edit Sub Category">
              <Button
                icon={<Edit className="w-4 h-4" />}
                onClick={() => openEdit(record)}
              />
            </Tooltip>
          </PermissionGate>
          <PermissionGate module="Sub Categories" action="Delete">
            <Tooltip title="Delete Sub Category">
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
        title="Sub Categories - POS & Inventory Admin Panel"
        description="Manage product sub categories"
        canonicalUrl={`${window.location.origin}/inventory/sub-categories`}
        noindex={true}
      />
      <PageHeader
        title="Sub Category"
        subtitle="Break each category down into finer groups"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Inventory" },
          { title: "Sub Category" },
        ]}
        extra={
          <div className="flex flex-wrap items-center gap-2">
            <ExportMenu
              sheet={async () => {
                const all = await fetchAllSubCategories([
                  { name: "page", value: 1 },
                  { name: "limit", value: 10000 },
                  ...(searchText
                    ? [{ name: "keyword", value: searchText }]
                    : []),
                  ...(categoryFilter
                    ? [{ name: "category", value: categoryFilter }]
                    : []),
                ]).unwrap();

                return makeSheet({
                  title: "Sub Categories",
                  unit: "sub category",
                  filters: [searchText && `Search: "${searchText}"`],
                  headers: ["Name", "Slug", "Parent Category", "Status"],
                  rows: (all?.data?.data || []) as ISubCategory[],
                  isLow: (s: any) => !s.isActive,
                  cells: (s: any) => [
                    s.name || "—",
                    s.slug || "—",
                    s.category?.name || "—",
                    s.isActive ? "Active" : "Inactive",
                  ],
                });
              }}
              disabled={total === 0}
            />
            <PermissionGate module="Sub Categories" action="Create">
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={openCreate}
              >
                Add Sub Category
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
          className="min-w-[220px]"
          options={categories.map((category) => ({
            label: category.name,
            value: category._id,
          }))}
        />
      </div>

      <DataTable
        data={subCategories}
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
        <SubCategoryModal
          open={isOpenModal}
          setOpen={setIsOpenModal}
          data={selected}
        />
      )}
    </div>
  );
};

export default SubCategories;
