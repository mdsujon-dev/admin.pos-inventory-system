import { Button, Input, Modal, Space, Switch, Tag, Tooltip } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { BookOpen, Edit, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import PermissionGate from "../../components/Common/PermissionGate";
import Money from "../../components/shared/Money";
import DataTable from "../../components/Table/DataTable";
import {
  IVendor,
  useDeleteVendorMutation,
  useGetVendorsQuery,
  useToggleVendorStatusMutation,
} from "../../redux/features/purchasing/vendorApi";

const { confirm } = Modal;

/** Who the shop buys from, and what it still owes each of them. */
const Vendors = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data, isFetching } = useGetVendorsQuery([
    { name: "page", value: currentPage },
    { name: "limit", value: limit },
    ...(searchText ? [{ name: "keyword", value: searchText }] : []),
  ]);

  const [deleteVendor] = useDeleteVendorMutation();
  const [toggleStatus] = useToggleVendorStatusMutation();

  const vendors: IVendor[] = data?.data?.data || [];
  const total: number = data?.data?.meta?.total || 0;

  const handleDelete = (vendor: IVendor) => {
    confirm({
      title: `Delete "${vendor.name}"?`,
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteVendor(vendor._id).unwrap();
          toast.success("Vendor deleted successfully");
        } catch (error: any) {
          toast.error(error?.data?.message || "Failed to delete vendor");
        }
      },
    });
  };

  const handleToggle = async (vendor: IVendor) => {
    setTogglingId(vendor._id);
    try {
      await toggleStatus(vendor._id).unwrap();
      toast.success(
        `Vendor ${vendor.isActive ? "deactivated" : "activated"} successfully`
      );
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const columns: ColumnsType<IVendor> = [
    {
      title: "Vendor",
      key: "name",
      width: 240,
      render: (_, record) => (
        <div className="min-w-0">
          <p className="m-0 truncate font-semibold text-secondary-800">
            {record.name}
          </p>
          {record.company && (
            <span className="text-xs text-secondary-500">{record.company}</span>
          )}
        </div>
      ),
    },
    {
      title: "Phone",
      key: "phone",
      width: 150,
      render: (_, record) => (
        <span className="font-mono text-sm">{record.phone}</span>
      ),
    },
    {
      title: "Supplies",
      key: "categories",
      width: 220,
      render: (_, record) => {
        const names = (record.categories ?? [])
          .map((row) =>
            typeof row === "string" ? null : (row as { name?: string }).name
          )
          .filter(Boolean) as string[];

        if (names.length === 0) {
          return <span className="text-secondary-400">—</span>;
        }
        return (
          <div className="flex flex-wrap items-center gap-1">
            {names.slice(0, 2).map((name) => (
              <Tag
                key={name}
                className="!m-0 !max-w-[100px] !truncate !border-primary-200 !bg-primary-50 !text-[11px] !text-primary-700"
              >
                {name}
              </Tag>
            ))}
            {names.length > 2 && (
              <Tooltip title={names.slice(2).join(", ")}>
                <Tag className="!m-0 !text-[11px]">+{names.length - 2}</Tag>
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: "Purchased",
      key: "totalPurchased",
      width: 130,
      render: (_, record) => (
        <div>
          <p className="m-0 font-medium text-secondary-800">
            <Money value={record.totalPurchased} />
          </p>
          <span className="text-xs text-secondary-400">
            {record.purchaseCount} bill{record.purchaseCount === 1 ? "" : "s"}
          </span>
        </div>
      ),
    },
    {
      title: "Owed",
      key: "totalDue",
      width: 120,
      render: (_, record) =>
        record.totalDue > 0 ? (
          <span className="font-semibold text-danger">
            <Money value={record.totalDue} />
          </span>
        ) : (
          <span className="text-secondary-400">Settled</span>
        ),
    },
    {
      title: "Last Bill",
      key: "lastPurchaseAt",
      width: 130,
      render: (_, record) =>
        record.lastPurchaseAt ? (
          dayjs(record.lastPurchaseAt).format("DD MMM YYYY")
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
          module="Vendors"
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
            onChange={() => handleToggle(record)}
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
          <Tooltip title="Ledger & history">
            <Button
              icon={<BookOpen className="h-4 w-4" />}
              onClick={() => navigate(`/vendors/${record._id}`)}
            />
          </Tooltip>
          <PermissionGate module="Vendors" action="Update">
            <Tooltip title="Edit">
              <Button
                icon={<Edit className="h-4 w-4" />}
                onClick={() => navigate(`/vendors/${record._id}/edit`)}
              />
            </Tooltip>
          </PermissionGate>
          <PermissionGate module="Vendors" action="Delete">
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
        title="Vendors - POS & Inventory"
        description="Suppliers, their bills and what is owed"
        noindex
      />
      <PageHeader
        title="Vendors"
        subtitle="Who the shop buys from, and what it still owes them"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Purchasing" },
          { title: "Vendors" },
        ]}
        extra={
          <PermissionGate module="Vendors" action="Create">
            <Button
              type="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => navigate("/vendors/new")}
              className="!border-0 !bg-gradient-to-r !from-primary-600 !to-primary-500 shadow-primary"
            >
              Add Vendor
            </Button>
          </PermissionGate>
        }
      />

      <div className="mb-6">
        <Input
          placeholder="Search by name, company or phone..."
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
        data={vendors}
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
            ? `No vendor matches "${searchText}"`
            : "No vendors yet. Stock enters through a purchase, and a purchase needs a supplier — add the first one."
        }
      />

      {isOpenModal && (
        <VendorModal
          open={isOpenModal}
          setOpen={setIsOpenModal}
          data={selected}
        />
      )}
    </div>
  );
};

export default Vendors;
