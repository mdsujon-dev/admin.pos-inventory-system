import { Button, Input, Modal, Space, Switch, Tag, Tooltip } from "antd";
import { ColumnsType } from "antd/es/table";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import ExportMenu from "../../../components/Common/ExportMenu";
import PageHeader from "../../../components/Common/PageHeader";
import PageMeta from "../../../components/Common/PageMeta";
import PermissionGate from "../../../components/Common/PermissionGate";
import WarrantyModal from "../../../components/modal/inventory/WarrantyModal";
import DataTable from "../../../components/Table/DataTable";
import {
  IWarranty,
  useDeleteWarrantyMutation,
  useGetWarrantiesQuery,
  useLazyGetWarrantiesQuery,
  useToggleWarrantyStatusMutation,
} from "../../../redux/features/inventory/warrantyApi";
import { makeSheet } from "../../../utils/tableExport";

const { confirm } = Modal;

const Warranties = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [selected, setSelected] = useState<IWarranty | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const queryParams = [
    { name: "page", value: currentPage },
    { name: "limit", value: limit },
    ...(searchText ? [{ name: "keyword", value: searchText }] : []),
  ];

  const { data, isFetching } = useGetWarrantiesQuery(queryParams);
  const [fetchAllWarranties] = useLazyGetWarrantiesQuery();
  const [deleteWarranty] = useDeleteWarrantyMutation();
  const [toggleStatus] = useToggleWarrantyStatusMutation();

  const warranties: IWarranty[] = data?.data?.data || [];
  const total: number = data?.data?.meta?.total || 0;

  const openCreate = () => {
    setSelected(null);
    setIsOpenModal(true);
  };

  const openEdit = (warranty: IWarranty) => {
    setSelected(warranty);
    setIsOpenModal(true);
  };

  const handleDelete = (warranty: IWarranty) => {
    confirm({
      title: `Delete "${warranty.name}"?`,
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteWarranty(warranty._id).unwrap();
          toast.success("Warranty deleted successfully");
        } catch (error: any) {
          toast.error(error?.data?.message || "Failed to delete warranty");
        }
      },
    });
  };

  const handleToggleStatus = async (warranty: IWarranty) => {
    setTogglingId(warranty._id);
    try {
      await toggleStatus(warranty._id).unwrap();
      toast.success(
        `Warranty ${
          warranty.isActive ? "deactivated" : "activated"
        } successfully`
      );
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const columns: ColumnsType<IWarranty> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string) => (
        <p className="font-semibold text-secondary-800 m-0">{name}</p>
      ),
    },
    {
      title: "Duration",
      key: "duration",
      width: 160,
      render: (_, record) => (
        <Tag color="var(--primary)">
          {record.duration} {record.period}
        </Tag>
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
          module="Warranties"
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
          <PermissionGate module="Warranties" action="Update">
            <Tooltip title="Edit Warranty">
              <Button
                icon={<Edit className="w-4 h-4" />}
                onClick={() => openEdit(record)}
              />
            </Tooltip>
          </PermissionGate>
          <PermissionGate module="Warranties" action="Delete">
            <Tooltip title="Delete Warranty">
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
        title="Warranties - POS & Inventory Admin Panel"
        description="Manage warranty terms offered on products"
        canonicalUrl={`${window.location.origin}/inventory/warranties`}
        noindex={true}
      />
      <PageHeader
        title="Warranties"
        subtitle="Cover terms you can attach to a product"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Inventory" },
          { title: "Warranties" },
        ]}
        extra={
          <div className="flex flex-wrap items-center gap-2">
            <ExportMenu
              sheet={async () => {
                const all = await fetchAllWarranties([
                  { name: "page", value: 1 },
                  { name: "limit", value: 10000 },
                  ...(searchText
                    ? [{ name: "keyword", value: searchText }]
                    : []),
                ]).unwrap();

                return makeSheet({
                  title: "Warranties",
                  unit: "warranty",
                  filters: [searchText && `Search: "${searchText}"`],
                  headers: ["Name", "Duration", "Description", "Status"],
                  rows: (all?.data?.data || []) as IWarranty[],
                  isLow: (w: any) => !w.isActive,
                  cells: (w: any) => [
                    w.name || "—",
                    `${w.duration} ${w.period}`,
                    w.description || "—",
                    w.isActive ? "Active" : "Inactive",
                  ],
                });
              }}
              disabled={total === 0}
            />
            <PermissionGate module="Warranties" action="Create">
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={openCreate}
              >
                Add Warranty
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
        data={warranties}
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
        <WarrantyModal
          open={isOpenModal}
          setOpen={setIsOpenModal}
          data={selected}
        />
      )}
    </div>
  );
};

export default Warranties;
