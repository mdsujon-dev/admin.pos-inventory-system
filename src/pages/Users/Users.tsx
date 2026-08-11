import { Button, Input, Modal, Space, Switch, Tag, Tooltip } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { Edit, Key, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import PermissionGate from "../../components/Common/PermissionGate";
import ChangePasswordModal from "../../components/modal/user/ChangePasswordModal";
import CreateUserModal from "../../components/modal/user/CreateUserModal";
import UpdateUserModal from "../../components/modal/user/UpdateUserModal";
import DateTimeStacked from "../../components/shared/DateTimeStacked";
import DataTable from "../../components/Table/DataTable";
import { useMe } from "../../hooks/useMe";
import {
  useDeleteUserMutation,
  useGetAllUserQuery,
  useLazyGetAllUserQuery,
  useToggleUserStatusMutation,
} from "../../redux/features/user/userApi";
import ExportMenu from "../../components/Common/ExportMenu";
import { makeSheet } from "../../utils/tableExport";

const { confirm } = Modal;

const Users = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [isOpenCreateModal, setIsOpenCreateModal] = useState(false);
  const [isOpenUpdateModal, setIsOpenUpdateModal] = useState(false);
  const [isOpenChangePasswordModal, setIsOpenChangePasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const { me } = useMe();
  const myId = me?._id;

  const { data, isFetching } = useGetAllUserQuery({
    page: currentPage,
    limit,
    search: searchText || undefined,
  });

  const [deleteUser] = useDeleteUserMutation();
  const [toggleUserStatus] = useToggleUserStatusMutation();
  const [fetchAllUsers] = useLazyGetAllUserQuery();
  // Per-row loading so only the toggled row dims, not every switch on the page.
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const users = data?.result || [];
  const meta = data?.meta || {};

  const buildSheet = async () => {
    const all = await fetchAllUsers({
      limit: 10000,
      search: searchText || undefined,
    }).unwrap();

    return makeSheet({
      title: "Employees",
      unit: "employee",
      filters: [searchText && `Search: "${searchText}"`],
      headers: [
        "Name",
        "Email",
        "Role",
        "Designation",
        "Phone",
        "Last login",
        "Status",
      ],
      rows: all?.result || [],
      // A dormant account is the one worth noticing on a printed staff list.
      isLow: (u: any) => !u.isActive,
      cells: (u: any) => [
        u.name || "—",
        u.email || "—",
        u.role ? String(u.role).toUpperCase().replace(/_/g, " ") : "—",
        u.designationId?.name || "—",
        u.phone || "—",
        u.lastLogin ? dayjs(u.lastLogin).format("DD MMM YYYY, h:mm A") : "Never",
        u.isActive ? "Active" : "Inactive",
      ],
    });
  };

  const handleDelete = (userId: string) => {
    confirm({
      title: "Are you sure you want to delete this user?",
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteUser(userId).unwrap();
          toast.success("User deleted successfully!");
        } catch (error: any) {
          toast.error(error?.data?.message || "Failed to delete user");
        }
      },
    });
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setTogglingId(userId);
    try {
      await toggleUserStatus(userId).unwrap();
      toast.success(`User ${currentStatus ? "deactivated" : "activated"} successfully!`);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update user status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setIsOpenUpdateModal(true);
  };

  const handleChangePassword = (user: any) => {
    setSelectedUser(user);
    setIsOpenChangePasswordModal(true);
  };

  const columns: ColumnsType<any> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: any) => <div>
        <div className="line-clamp-1">{name?.length > 20 ? name?.substring(0, 20) + "..." : name || "N/A"}</div>
        <div className="text-xs text-secondary-500">{record?.email || "N/A"}</div>
      </div>,
    },
   
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color="var(--primary)">
          {role ? role.toUpperCase().replace(/_/g, " ") : "N/A"}
        </Tag>
      ),
    },
    {
      title: "Designation",
      dataIndex: "designationId",
      key: "designationId",
      render: (designation: any) => (
        <span className="line-clamp-1">{designation?.name || "N/A"}</span>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (phone: string) => <span>{phone || "N/A"}</span>,
    },
    {
      title: "Last Login",
      dataIndex: "lastLogin",
      key: "lastLogin",
      width: 150,
      render: (lastLogin: string) => (
        <DateTimeStacked value={lastLogin} emptyText="N/A" />
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      render: (isActive: boolean, record: any) => {
        const isSelf = myId && String(record._id) === String(myId);
        return (
          <PermissionGate
            module="Employees"
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
            <Tooltip
              title={isSelf ? "You cannot change your own status" : ""}
            >
              <Switch
                checked={isActive}
                disabled={!!isSelf || togglingId === record._id}
                loading={togglingId === record._id}
                checkedChildren="Active"
                unCheckedChildren="Inactive"
                onChange={() => handleToggleStatus(record._id, isActive)}
              />
            </Tooltip>
          </PermissionGate>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 200,
      render: (_: any, record: any) => {
        const isSelf = myId && String(record._id) === String(myId);
        return (
          <Space>
            <PermissionGate module="Employees" action="Update">
              <Tooltip title="Edit User">
                <Button
                  icon={<Edit className="w-4 h-4" />}
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>
            </PermissionGate>
            <PermissionGate module="Employees" action="Change Password">
              <Tooltip
                title={
                  isSelf
                    ? "Use Profile page to change your own password"
                    : "Change Password"
                }
              >
                <Button
                  icon={<Key className="w-4 h-4" />}
                  disabled={!!isSelf}
                  onClick={() => handleChangePassword(record)}
                />
              </Tooltip>
            </PermissionGate>
            <PermissionGate module="Employees" action="Delete">
              <Tooltip
                title={isSelf ? "You cannot delete yourself" : "Delete User"}
              >
                <Button
                  icon={<Trash2 className="w-4 h-4" />}
                  disabled={!!isSelf}
                  onClick={() => handleDelete(record._id)}
                />
              </Tooltip>
            </PermissionGate>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <PageMeta
        title="Employees - POS & Inventory Admin Panel"
        description="Manage employees and their permissions"
        keywords="employees, employee management, POS & Inventory"
        canonicalUrl={`${window.location.origin}/employees`}
        noindex={true}
      />
      <PageHeader
        title="Employees"
        subtitle="Manage all employees"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Employee Management" },
          { title: "Employees" },
        ]}
        extra={
          <div className="flex flex-wrap items-center gap-2">
            <ExportMenu sheet={buildSheet} disabled={(meta.total || 0) === 0} />
            <PermissionGate module="Employees" action="Create">
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setIsOpenCreateModal(true)}
              >
                Add New User
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="Search users by name or email..."
          prefix={<Search className="w-4 h-4 text-secondary-400" />}
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setCurrentPage(1);
          }}
          className="max-w-md"
        />
      </div>

      <DataTable
        data={users}
        columns={columns}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        limit={limit}
        setLimit={setLimit}
        total={meta.total || 0}
        isPaginate={meta.totalPage > 1}
        loading={isFetching}
        rowKey="_id"
      />


      {isOpenCreateModal && (
        <CreateUserModal
          open={isOpenCreateModal}
          setOpen={setIsOpenCreateModal}
        />
      )}

      {isOpenUpdateModal && selectedUser && (
        <UpdateUserModal
          open={isOpenUpdateModal}
          setOpen={setIsOpenUpdateModal}
          data={selectedUser}
        />
      )}

      {isOpenChangePasswordModal && selectedUser && (
        <ChangePasswordModal
          open={isOpenChangePasswordModal}
          setOpen={setIsOpenChangePasswordModal}
          userId={selectedUser._id}
          userName={selectedUser.name}
        />
      )}
    </div>
  );
};

export default Users;
