import { Button, Input, Modal, Space, Switch, Tag, Tooltip } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { Edit, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import PermissionGate from "../../components/Common/PermissionGate";
import CreateRoleModal from "../../components/modal/settings/role/CreateRoleModal";
import UpdateRoleModal from "../../components/modal/settings/role/UpdateRoleModal";
import DateTimeStacked from "../../components/shared/DateTimeStacked";
import DataTable from "../../components/Table/DataTable";
import {
  useDeleteRoleMutation,
  useGetRolesQuery,
  useToggleRoleStatusMutation,
} from "../../redux/features/role/roleApi";
import ExportMenu from "../../components/Common/ExportMenu";
import { makeSheet } from "../../utils/tableExport";
import { useDebounce } from "../../utils/useDebounce";

const { confirm } = Modal;

const Roles = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [isOpenCreate, setIsOpenCreate] = useState(false);
  const [isOpenUpdate, setIsOpenUpdate] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);

  const debouncedSearch = useDebounce(searchText, 400);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const { data, isFetching } = useGetRolesQuery({
    page: currentPage,
    limit,
    searchTerm: debouncedSearch || undefined,
  });
  const [deleteRole] = useDeleteRoleMutation();
  const [toggleRoleStatus] = useToggleRoleStatusMutation();
  // Only the row currently in flight shows loading — using the mutation's
  // shared isLoading flag would dim every switch on the page during one update.
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Hide the protected SUPER_ADMIN role — it's a system account, not something
  // an admin manages from this list.
  const roles: any[] = (data?.result || []).filter(
    (r: any) => r.role?.toUpperCase() !== "SUPER_ADMIN"
  );
  const meta = data?.meta || {};

  const handleDelete = (id: string) => {
    confirm({
      title: "Delete this role?",
      content:
        "This will remove the role. Existing users with this role keep their role string but won't be linked to it anymore.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteRole(id).unwrap();
          toast.success("Role deleted successfully!");
        } catch (error: any) {
          toast.error(error?.data?.message || "Failed to delete role");
        }
      },
    });
  };

  const handleToggleStatus = async (id: string, current: boolean) => {
    setTogglingId(id);
    try {
      await toggleRoleStatus(id).unwrap();
      toast.success(`Role ${current ? "deactivated" : "activated"}`);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update role status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleEdit = (role: any) => {
    setSelectedRole(role);
    setIsOpenUpdate(true);
  };

  // Its own page now — long enough to want the window, and worth an address
  // somebody can link to.
  const handleManagePermissions = (role: any) =>
    navigate(`/employees/roles/${role._id}/permissions`);

  const columns: ColumnsType<any> = [
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 220,
      render: (role: string) => (
        <Tag color="var(--primary)" className="text-sm font-semibold">
          {role?.replace(/_/g, " ")}
        </Tag>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text: string) => (
        <span className="line-clamp-1">{text || "N/A"}</span>
      ),
    },
    {
      title: "Employee Count",
      dataIndex: "employeeCount",
      key: "employeeCount",
      width: 150,
      align: "center",
      render: (count: number | undefined) => (
        <Tag color={count && count > 0 ? "blue" : "default"}>
          {count ?? 0}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 130,
      render: (isActive: boolean, record: any) => (
        <PermissionGate
          module="Roles"
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
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date: string) => <DateTimeStacked value={date} emptyText="N/A" />,
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 220,
      render: (_: any, record: any) => (
        <Space>
          <PermissionGate module="Roles" action="Permission">
            <Tooltip title="Manage Permissions">
              <Button
                type="primary"
                ghost
                icon={<ShieldCheck className="w-[18px] h-[18px]" />}
                onClick={() => handleManagePermissions(record)}
              />
            </Tooltip>
          </PermissionGate>
          <PermissionGate module="Roles" action="Update">
            <Tooltip title="Edit Role">
              <Button
                icon={<Edit className="w-4 h-4" />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          </PermissionGate>
          <PermissionGate module="Roles" action="Delete">
            <Tooltip title="Delete Role">
              <Button
                danger
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => handleDelete(record._id)}
              />
            </Tooltip>
          </PermissionGate>
        </Space>
      ),
    },
  ];

  const totalPage = meta?.totalPage ?? 0;
  const showPagination = totalPage > 1;

  return (
    <div>
      <PageMeta
        title="Roles - POS & Inventory Admin Panel"
        description="Manage employee roles and permissions"
        keywords="roles, RBAC, permissions, POS & Inventory"
        canonicalUrl={`${window.location.origin}/employees/roles`}
        noindex={true}
      />
      <PageHeader
        title="Roles"
        subtitle="Manage employee roles and assign module permissions"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Employee Management" },
          { title: "Roles" },
        ]}
        extra={
          <div className="flex flex-wrap items-center gap-2">
            {/* The page holds the roles it is showing and there are never many,
                so this exports what is on screen rather than re-fetching. */}
            <ExportMenu
              sheet={() =>
                makeSheet({
                  title: "Roles",
                  unit: "role",
                  filters: [debouncedSearch && `Search: "${debouncedSearch}"`],
                  headers: [
                    "Role",
                    "Description",
                    "Employees",
                    "Status",
                    "Created",
                  ],
                  rows: roles,
                  isLow: (r: any) => !r.isActive,
                  cells: (r: any) => [
                    r.role ? String(r.role).toUpperCase().replace(/_/g, " ") : "—",
                    r.description || "—",
                    r.employeeCount ?? 0,
                    r.isActive ? "Active" : "Inactive",
                    r.createdAt
                      ? dayjs(r.createdAt).format("DD MMM YYYY, h:mm A")
                      : "—",
                  ],
                })
              }
              disabled={roles.length === 0}
            />
            <PermissionGate module="Roles" action="Create">
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setIsOpenCreate(true)}
              >
                Add New Role
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="Search roles by name..."
          prefix={<Search className="w-4 h-4 text-gray-400" />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="max-w-md"
        />
      </div>

      <DataTable
        data={roles}
        columns={columns}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        limit={limit}
        setLimit={setLimit}
        total={meta?.total ?? roles.length}
        isPaginate={showPagination}
        loading={isFetching}
        rowKey="_id"
      />

      {isOpenCreate && (
        <CreateRoleModal open={isOpenCreate} setOpen={setIsOpenCreate} />
      )}

      {isOpenUpdate && selectedRole && (
        <UpdateRoleModal
          open={isOpenUpdate}
          setOpen={setIsOpenUpdate}
          data={selectedRole}
        />
      )}
    </div>
  );
};

export default Roles;
