import { Button, Input, Modal, Space, Switch, Tooltip } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { Edit, Plus, Search, Trash2, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import PermissionGate from "../../components/Common/PermissionGate";
import CustomerModal from "../../components/modal/sales/CustomerModal";
import Money from "../../components/shared/Money";
import DataTable from "../../components/Table/DataTable";
import {
  ICustomer,
  useDeleteCustomerMutation,
  useGetCustomersQuery,
  useToggleCustomerStatusMutation,
} from "../../redux/features/sales/customerApi";

const { confirm } = Modal;

/** Everyone who has bought, what they spend, and what they still owe. */
const Customers = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<ICustomer | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data, isFetching } = useGetCustomersQuery([
    { name: "page", value: currentPage },
    { name: "limit", value: limit },
    ...(searchText ? [{ name: "keyword", value: searchText }] : []),
  ]);

  const [deleteCustomer] = useDeleteCustomerMutation();
  const [toggleStatus] = useToggleCustomerStatusMutation();

  const customers: ICustomer[] = data?.data?.data || [];
  const total: number = data?.data?.meta?.total || 0;

  const handleDelete = (customer: ICustomer) => {
    confirm({
      title: `Delete "${customer.name}"?`,
      content:
        "Customers with sales on record cannot be deleted — deactivate those instead.",
      okText: "Yes, Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteCustomer(customer._id).unwrap();
          toast.success("Customer deleted successfully");
        } catch (error: any) {
          toast.error(error?.data?.message || "Failed to delete customer");
        }
      },
    });
  };

  const columns: ColumnsType<ICustomer> = [
    {
      title: "Customer",
      key: "name",
      width: 220,
      render: (_, record) => (
        <div className="min-w-0">
          <p className="m-0 truncate font-semibold text-secondary-800">
            {record.name}
          </p>
          <span className="font-mono text-xs text-secondary-400">
            {record.phone}
          </span>
        </div>
      ),
    },
    {
      title: "Purchases",
      key: "saleCount",
      width: 120,
      render: (_, record) => (
        <div>
          <p className="m-0 font-medium text-secondary-800">
            {record.saleCount}
          </p>
          {record.lastPurchaseAt && (
            <span className="text-xs text-secondary-400">
              last {dayjs(record.lastPurchaseAt).format("DD MMM YY")}
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Spent",
      key: "totalSpent",
      width: 130,
      render: (_, record) => (
        <span className="font-medium text-secondary-800">
          <Money value={record.totalSpent} />
        </span>
      ),
    },
    {
      title: "Owes",
      key: "totalDue",
      width: 120,
      render: (_, record) =>
        record.totalDue > 0 ? (
          <span className="font-semibold text-danger">
            <Money value={record.totalDue} />
          </span>
        ) : (
          <span className="text-secondary-400">—</span>
        ),
    },
    {
      title: "Status",
      key: "isActive",
      width: 120,
      render: (_, record) => (
        <PermissionGate
          module="Customers"
          action="Update"
          fallback={
            <span
              className={record.isActive ? "text-primary" : "text-secondary-400"}
            >
              {record.isActive ? "Active" : "Inactive"}
            </span>
          }
        >
          <Switch
            checked={record.isActive}
            loading={togglingId === record._id}
            checkedChildren="Active"
            unCheckedChildren="Inactive"
            onChange={async () => {
              setTogglingId(record._id);
              try {
                await toggleStatus(record._id).unwrap();
              } catch {
                toast.error("Failed to update status");
              } finally {
                setTogglingId(null);
              }
            }}
          />
        </PermissionGate>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="Profile & history">
            <Button
              icon={<User className="h-4 w-4" />}
              onClick={() => navigate(`/customers/${record._id}`)}
            />
          </Tooltip>
          <PermissionGate module="Customers" action="Update">
            <Tooltip title="Edit">
              <Button
                icon={<Edit className="h-4 w-4" />}
                onClick={() => {
                  setSelected(record);
                  setIsOpen(true);
                }}
              />
            </Tooltip>
          </PermissionGate>
          <PermissionGate module="Customers" action="Delete">
            <Tooltip title="Delete">
              <Button
                danger
                icon={<Trash2 className="h-4 w-4" />}
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
        title="Customers - POS & Inventory"
        description="Everyone who has bought, what they spend and what they owe"
        noindex
      />
      <PageHeader
        title="Customers"
        subtitle="Everyone who has bought, and what they still owe"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Sales" },
          { title: "Customers" },
        ]}
        extra={
          <PermissionGate module="Customers" action="Create">
            <Button
              type="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setSelected(null);
                setIsOpen(true);
              }}
              className="!border-0 !bg-gradient-to-r !from-primary-600 !to-primary-500 shadow-primary"
            >
              Add Customer
            </Button>
          </PermissionGate>
        }
      />

      <div className="mb-6">
        <Input
          placeholder="Search by name, phone or address..."
          prefix={<Search className="h-4 w-4 text-secondary-400" />}
          value={searchText}
          onChange={(event) => {
            setSearchText(event.target.value);
            setCurrentPage(1);
          }}
          allowClear
          className="max-w-md"
        />
      </div>

      <DataTable
        data={customers}
        columns={columns}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        limit={limit}
        setLimit={setLimit}
        total={total}
        isPaginate={total > limit}
        loading={isFetching}
        rowKey="_id"
        emptyText={
          searchText
            ? `No customer matches "${searchText}"`
            : "No customers yet. One is saved the first time a phone number is typed at the till."
        }
      />

      {isOpen && (
        <CustomerModal open={isOpen} setOpen={setIsOpen} data={selected} />
      )}
    </div>
  );
};

export default Customers;
