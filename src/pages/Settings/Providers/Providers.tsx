import { Button, Modal, Space, Switch, Table, Tag, Tooltip } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import PageHeader from "../../../components/Common/PageHeader";
import PageMeta from "../../../components/Common/PageMeta";
import PermissionGate from "../../../components/Common/PermissionGate";
import ProviderModal from "../../../components/modal/settings/ProviderModal";
import {
  IPaymentProvider,
  useDeletePaymentProviderMutation,
  useGetPaymentProvidersQuery,
  useTogglePaymentProviderStatusMutation,
} from "../../../redux/features/settings/paymentProviderApi";
import { SectionCard } from "../../Inventory/Products/ProductFormUI";

const { confirm } = Modal;

/**
 * The banks and wallets money can be sent through.
 *
 * A short reference list, like units or expense headings — every vendor's
 * payment method points at one of these rather than spelling the name out
 * again, so "bKash", "Bkash" and "BKASH" cannot become three providers.
 */
const Providers = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<IPaymentProvider | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data, isFetching } = useGetPaymentProvidersQuery([
    { name: "limit", value: 500 },
  ]);
  const [deleteProvider] = useDeletePaymentProviderMutation();
  const [toggleStatus] = useTogglePaymentProviderStatusMutation();

  const providers: IPaymentProvider[] = data?.data?.data || data?.data || [];

  const handleDelete = (provider: IPaymentProvider) => {
    confirm({
      title: `Delete "${provider.name}"?`,
      content:
        "Vendors already pointing at this provider keep the name they were saved with.",
      okText: "Yes, Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteProvider(provider._id).unwrap();
          toast.success("Provider deleted successfully");
        } catch (error: any) {
          toast.error(error?.data?.message || "Failed to delete provider");
        }
      },
    });
  };

  const columns: ColumnsType<IPaymentProvider> = [
    {
      title: "Provider",
      key: "name",
      render: (_, record) => (
        <span className="font-semibold text-secondary-800">{record.name}</span>
      ),
    },
    {
      title: "Type",
      key: "type",
      width: 180,
      render: (_, record) => (
        <Tag
          className={
            record.type === "Bank"
              ? "!m-0 !border-primary-200 !bg-primary-50 !text-primary-700"
              : "!m-0"
          }
        >
          {record.type}
        </Tag>
      ),
    },
    {
      title: "Added",
      key: "createdAt",
      width: 140,
      render: (_, record) =>
        record.createdAt ? (
          dayjs(record.createdAt).format("DD MMM YYYY")
        ) : (
          <span className="text-secondary-400">—</span>
        ),
    },
    {
      title: "Status",
      key: "isActive",
      width: 130,
      render: (_, record) => (
        <PermissionGate
          module="Payment Providers"
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
      width: 120,
      render: (_, record) => (
        <Space>
          <PermissionGate module="Payment Providers" action="Update">
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
          <PermissionGate module="Payment Providers" action="Delete">
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
        title="Payment Providers - POS & Inventory"
        description="Banks, mobile wallets and other ways money is sent"
        noindex
      />
      <PageHeader
        title="Payment Providers"
        subtitle="The banks and wallets money can be sent through"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Settings" },
          { title: "Payment Providers" },
        ]}
        extra={
          <PermissionGate module="Payment Providers" action="Create">
            <Button
              type="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setSelected(null);
                setIsOpen(true);
              }}
              className="!border-0 !bg-gradient-to-r !from-primary-600 !to-primary-500 shadow-primary"
            >
              Add Provider
            </Button>
          </PermissionGate>
        }
      />

      <SectionCard
        icon={Plus}
        title="Providers"
        subtitle="Vendors pick from this list rather than typing a name each time"
      >
        <Table
          dataSource={providers}
          columns={columns}
          rowKey="_id"
          loading={isFetching}
          size="small"
          pagination={false}
          locale={{
            emptyText:
              "No providers yet. Add the banks and wallets you actually pay through.",
          }}
        />
      </SectionCard>

      {isOpen && (
        <ProviderModal open={isOpen} setOpen={setIsOpen} data={selected} />
      )}
    </div>
  );
};

export default Providers;
