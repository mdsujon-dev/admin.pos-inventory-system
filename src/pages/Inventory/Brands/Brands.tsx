import { Button, Image, Input, Modal, Space, Switch, Tooltip } from "antd";
import { ColumnsType } from "antd/es/table";
import { Edit, Image as ImageIcon, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import ExportMenu from "../../../components/Common/ExportMenu";
import PageHeader from "../../../components/Common/PageHeader";
import PageMeta from "../../../components/Common/PageMeta";
import PermissionGate from "../../../components/Common/PermissionGate";
import BrandModal from "../../../components/modal/inventory/BrandModal";
import DataTable from "../../../components/Table/DataTable";
import { config } from "../../../config";
import {
  IBrand,
  useDeleteBrandMutation,
  useGetBrandsQuery,
  useLazyGetBrandsQuery,
  useToggleBrandStatusMutation,
} from "../../../redux/features/inventory/brandApi";
import { makeSheet } from "../../../utils/tableExport";

const { confirm } = Modal;

const Brands = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [selected, setSelected] = useState<IBrand | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const queryParams = [
    { name: "page", value: currentPage },
    { name: "limit", value: limit },
    ...(searchText ? [{ name: "keyword", value: searchText }] : []),
  ];

  const { data, isFetching } = useGetBrandsQuery(queryParams);
  const [fetchAllBrands] = useLazyGetBrandsQuery();
  const [deleteBrand] = useDeleteBrandMutation();
  const [toggleStatus] = useToggleBrandStatusMutation();

  const brands: IBrand[] = data?.data?.data || [];
  const total: number = data?.data?.meta?.total || 0;

  const openCreate = () => {
    setSelected(null);
    setIsOpenModal(true);
  };

  const openEdit = (brand: IBrand) => {
    setSelected(brand);
    setIsOpenModal(true);
  };

  const handleDelete = (brand: IBrand) => {
    confirm({
      title: `Delete "${brand.name}"?`,
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteBrand(brand._id).unwrap();
          toast.success("Brand deleted successfully");
        } catch (error: any) {
          toast.error(error?.data?.message || "Failed to delete brand");
        }
      },
    });
  };

  const handleToggleStatus = async (brand: IBrand) => {
    setTogglingId(brand._id);
    try {
      await toggleStatus(brand._id).unwrap();
      toast.success(
        `Brand ${brand.isActive ? "deactivated" : "activated"} successfully`
      );
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const columns: ColumnsType<IBrand> = [
    {
      title: "Logo",
      dataIndex: "logo",
      key: "logo",
      width: 80,
      render: (logo?: string | null) =>
        logo ? (
          <Image
            src={
              logo.startsWith("http")
                ? logo
                : `${config.image_access_url}${logo}`
            }
            alt="brand"
            width={42}
            height={42}
            style={{ objectFit: "contain", borderRadius: 6 }}
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
          module="Brands"
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
          <PermissionGate module="Brands" action="Update">
            <Tooltip title="Edit Brand">
              <Button
                icon={<Edit className="w-4 h-4" />}
                onClick={() => openEdit(record)}
              />
            </Tooltip>
          </PermissionGate>
          <PermissionGate module="Brands" action="Delete">
            <Tooltip title="Delete Brand">
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
        title="Brands - POS & Inventory Admin Panel"
        description="Manage product brands"
        canonicalUrl={`${window.location.origin}/inventory/brands`}
        noindex={true}
      />
      <PageHeader
        title="Brands"
        subtitle="Manage the manufacturers and labels you stock"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Inventory" },
          { title: "Brands" },
        ]}
        extra={
          <div className="flex flex-wrap items-center gap-2">
            <ExportMenu
              sheet={async () => {
                const all = await fetchAllBrands([
                  { name: "page", value: 1 },
                  { name: "limit", value: 10000 },
                  ...(searchText
                    ? [{ name: "keyword", value: searchText }]
                    : []),
                ]).unwrap();

                return makeSheet({
                  title: "Brands",
                  unit: "brand",
                  filters: [searchText && `Search: "${searchText}"`],
                  headers: ["Name", "Slug", "Description", "Status"],
                  rows: (all?.data?.data || []) as IBrand[],
                  isLow: (b: any) => !b.isActive,
                  cells: (b: any) => [
                    b.name || "—",
                    b.slug || "—",
                    b.description || "—",
                    b.isActive ? "Active" : "Inactive",
                  ],
                });
              }}
              disabled={total === 0}
            />
            <PermissionGate module="Brands" action="Create">
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={openCreate}
              >
                Add Brand
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
      </div>

      <DataTable
        data={brands}
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
        <BrandModal
          open={isOpenModal}
          setOpen={setIsOpenModal}
          data={selected}
        />
      )}
    </div>
  );
};

export default Brands;
