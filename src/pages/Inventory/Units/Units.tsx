import { Button, Input, Modal, Space, Switch, Tag, Tooltip } from "antd";
import { ColumnsType } from "antd/es/table";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import ExportMenu from "../../../components/Common/ExportMenu";
import PageHeader from "../../../components/Common/PageHeader";
import PageMeta from "../../../components/Common/PageMeta";
import PermissionGate from "../../../components/Common/PermissionGate";
import UnitModal from "../../../components/modal/inventory/UnitModal";
import DataTable from "../../../components/Table/DataTable";
import {
  IUnit,
  useDeleteUnitMutation,
  useGetUnitsQuery,
  useLazyGetUnitsQuery,
  useToggleUnitStatusMutation,
} from "../../../redux/features/inventory/unitApi";
import { makeSheet } from "../../../utils/tableExport";

const { confirm } = Modal;

const Units = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [selected, setSelected] = useState<IUnit | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const queryParams = [
    { name: "page", value: currentPage },
    { name: "limit", value: limit },
    ...(searchText ? [{ name: "keyword", value: searchText }] : []),
  ];

  const { data, isFetching } = useGetUnitsQuery(queryParams);
  const [fetchAllUnits] = useLazyGetUnitsQuery();
  const [deleteUnit] = useDeleteUnitMutation();
  const [toggleStatus] = useToggleUnitStatusMutation();

  const units: IUnit[] = data?.data?.data || [];
  const total: number = data?.data?.meta?.total || 0;

  const openCreate = () => {
    setSelected(null);
    setIsOpenModal(true);
  };

  const openEdit = (unit: IUnit) => {
    setSelected(unit);
    setIsOpenModal(true);
  };

  const handleDelete = (unit: IUnit) => {
    confirm({
      title: `Delete "${unit.name}"?`,
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteUnit(unit._id).unwrap();
          toast.success("Unit deleted successfully");
        } catch (error: any) {
          toast.error(error?.data?.message || "Failed to delete unit");
        }
      },
    });
  };

  const handleToggleStatus = async (unit: IUnit) => {
    setTogglingId(unit._id);
    try {
      await toggleStatus(unit._id).unwrap();
      toast.success(
        `Unit ${unit.isActive ? "deactivated" : "activated"} successfully`
      );
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const columns: ColumnsType<IUnit> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string) => (
        <p className="font-semibold text-secondary-800 m-0">{name}</p>
      ),
    },
    {
      title: "Short Name",
      dataIndex: "shortName",
      key: "shortName",
      width: 140,
      render: (shortName: string) => (
        <Tag color="var(--primary)">{shortName}</Tag>
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
          module="Units"
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
          <PermissionGate module="Units" action="Update">
            <Tooltip title="Edit Unit">
              <Button
                icon={<Edit className="w-4 h-4" />}
                onClick={() => openEdit(record)}
              />
            </Tooltip>
          </PermissionGate>
          <PermissionGate module="Units" action="Delete">
            <Tooltip title="Delete Unit">
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
        title="Units - POS & Inventory Admin Panel"
        description="Manage the units products are measured and sold in"
        canonicalUrl={`${window.location.origin}/inventory/units`}
        noindex={true}
      />
      <PageHeader
        title="Units"
        subtitle="How each product is measured and sold — kg, pcs, litre"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Inventory" },
          { title: "Units" },
        ]}
        extra={
          <div className="flex flex-wrap items-center gap-2">
            <ExportMenu
              sheet={async () => {
                const all = await fetchAllUnits([
                  { name: "page", value: 1 },
                  { name: "limit", value: 10000 },
                  ...(searchText
                    ? [{ name: "keyword", value: searchText }]
                    : []),
                ]).unwrap();

                return makeSheet({
                  title: "Units",
                  unit: "unit",
                  filters: [searchText && `Search: "${searchText}"`],
                  headers: ["Name", "Short Name", "Description", "Status"],
                  rows: (all?.data?.data || []) as IUnit[],
                  isLow: (u: any) => !u.isActive,
                  cells: (u: any) => [
                    u.name || "—",
                    u.shortName || "—",
                    u.description || "—",
                    u.isActive ? "Active" : "Inactive",
                  ],
                });
              }}
              disabled={total === 0}
            />
            <PermissionGate module="Units" action="Create">
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={openCreate}
              >
                Add Unit
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="Search by name or short name..."
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
        data={units}
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
        <UnitModal open={isOpenModal} setOpen={setIsOpenModal} data={selected} />
      )}
    </div>
  );
};

export default Units;
