import { Button, Input, Modal, Space, Switch, Tag, Tooltip } from "antd";
import { ColumnsType } from "antd/es/table";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import PageHeader from "../../../components/Common/PageHeader";
import PageMeta from "../../../components/Common/PageMeta";
import PermissionGate from "../../../components/Common/PermissionGate";
import CreateDesignationModal from "../../../components/modal/settings/designation/CreateDesignationModal";
import UpdateDesignationModal from "../../../components/modal/settings/designation/UpdateDesignationModal";
import DataTable from "../../../components/Table/DataTable";
import ExportMenu from "../../../components/Common/ExportMenu";
import { makeSheet } from "../../../utils/tableExport";
import {
    useDeleteDesignationMutation,
    useGetDesignationsQuery,
    useToggleDesignationStatusMutation,
} from "../../../redux/features/designation/designationApi";

const { confirm } = Modal;

const Designation = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [isOpenCreateModal, setIsOpenCreateModal] = useState(false);
  const [isOpenUpdateModal, setIsOpenUpdateModal] = useState(false);
  const [selectedDesignation, setSelectedDesignation] = useState<any | null>(null);

  const { data, isFetching } = useGetDesignationsQuery();
  const [deleteDesignation] = useDeleteDesignationMutation();
  const [toggleDesignationStatus] = useToggleDesignationStatusMutation();
  // Per-row loading so only the toggled row dims, not every switch on the page.
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const designations = data?.data || [];

  const handleDelete = (id: string) => {
    confirm({
      title: "Are you sure you want to delete this designation?",
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteDesignation(id).unwrap();
          toast.success("Designation deleted successfully!");
        } catch (error: any) {
          toast.error(error?.data?.message || "Failed to delete designation");
        }
      },
    });
  };

  const handleEdit = (designation: any) => {
    setSelectedDesignation(designation);
    setIsOpenUpdateModal(true);
  };

  const handleToggleStatus = async (designationId: string, currentStatus: boolean) => {
    setTogglingId(designationId);
    try {
      await toggleDesignationStatus(designationId).unwrap();
      toast.success(`Designation ${currentStatus ? "deactivated" : "activated"} successfully!`);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update designation status");
    } finally {
      setTogglingId(null);
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 250,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text: string) => <span className="line-clamp-1">{text&& text?.length > 50 ? text?.substring(0, 50) + "..." : text || "N/A"}</span>,
    },
    {
      title: "People",
      dataIndex: "employeeCount",
      key: "employeeCount",
      width: 120,
      align: "center",
      render: (count: number | undefined) => (
        <Tag color={count && count > 0 ? "blue" : "default"}>
          {count ?? 0}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      width: 120,
      render: (isActive: boolean, record: any) => (
        <PermissionGate
          module="Designations"
          action="Update"
          fallback={
            <Switch
              checked={isActive}
              disabled
              checkedChildren="Active"
              unCheckedChildren="Inactive"
            />
          }
        >
          <Switch
            checked={isActive}
            loading={togglingId === record._id}
            disabled={togglingId === record._id}
            checkedChildren="Active"
            unCheckedChildren="Inactive"
            onChange={() => handleToggleStatus(record._id, isActive)}
          />
        </PermissionGate>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <PermissionGate module="Designations" action="Update">
            <Tooltip title="Edit Designation">
              <Button
                icon={<Edit className="w-4 h-4" />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          </PermissionGate>
          <PermissionGate module="Designations" action="Delete">
            <Tooltip title="Delete Designation">
              <Button
                danger icon={<Trash2 className="w-4 h-4" />}
                onClick={() => handleDelete(record._id)}
              />
            </Tooltip>
          </PermissionGate>
        </Space>
      ),
    },
  ];

  const filteredDesignations = designations.filter((designation: any) =>
    designation.name?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <PageMeta
        title="Designations - POS & Inventory Admin Panel"
        description="Manage designations and their permissions"
        keywords="designations, permissions, POS & Inventory"
        canonicalUrl={`${window.location.origin}/employees/designations`}
        noindex={true}
      />
      <PageHeader
        title="Designations"
        subtitle="Job titles for staff"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Employee Management" },
          { title: "Designations" },
        ]}
        extra={
          <div className="flex flex-wrap items-center gap-2">
            <ExportMenu
              sheet={() =>
                makeSheet({
                  title: "Designations",
                  unit: "designation",
                  filters: [searchText && `Search: "${searchText}"`],
                  headers: ["Name", "Description", "People", "Status"],
                  rows: filteredDesignations,
                  isLow: (d: any) => d.is_active === false,
                  cells: (d: any) => [
                    d.name || "—",
                    d.description || "—",
                    d.employeeCount ?? 0,
                    d.is_active === false ? "Inactive" : "Active",
                  ],
                })
              }
              disabled={filteredDesignations.length === 0}
            />
            <PermissionGate module="Designations" action="Create">
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setIsOpenCreateModal(true)}
              >
                Add New
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <Input
          placeholder="Search designations by name..."
          prefix={<Search className="w-4 h-4 text-secondary-400" />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="max-w-md"
        />
      </div>

      <DataTable
        data={filteredDesignations}
        columns={columns}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        limit={limit}
        setLimit={setLimit}
        total={filteredDesignations.length}
        isPaginate={true}
        loading={isFetching}
        rowKey="_id"
      />

      {isOpenCreateModal && (
        <CreateDesignationModal
          open={isOpenCreateModal}
          setOpen={setIsOpenCreateModal}
        />
      )}

      {isOpenUpdateModal && selectedDesignation && (
        <UpdateDesignationModal
          open={isOpenUpdateModal}
          setOpen={setIsOpenUpdateModal}
          data={selectedDesignation}
        />
      )}
    </div>
  );
};

export default Designation;
