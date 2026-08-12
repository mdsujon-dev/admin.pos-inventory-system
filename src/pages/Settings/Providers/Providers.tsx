import { Table, Tag, Typography } from "antd";
import { Plus } from "lucide-react";
import { useState } from "react";
import DeleteModal from "../../../components/modal/DeleteModal";
import ProviderModal from "../../../components/modal/settings/ProviderModal";
import PageHeader from "../../../components/Shared/PageHeader";
import ActionDropdown from "../../../components/ui/ActionDropdown";
import Card from "../../../components/ui/Card";
import Loading from "../../../components/ui/Loading";
import {
  IPaymentProvider,
  useDeletePaymentProviderMutation,
  useGetPaymentProvidersQuery,
  useTogglePaymentProviderStatusMutation,
} from "../../../redux/features/settings/paymentProviderApi";
import dayjs from "dayjs";

const Providers = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<IPaymentProvider | null>(null);

  const { data, isLoading } = useGetPaymentProvidersQuery([
    { name: "limit", value: 500 },
  ]);
  const [deleteProvider] = useDeletePaymentProviderMutation();
  const [toggleStatus] = useTogglePaymentProviderStatusMutation();

  const handleEdit = (provider: IPaymentProvider) => {
    setSelectedProvider(provider);
    setModalOpen(true);
  };

  const handleDelete = (provider: IPaymentProvider) => {
    setSelectedProvider(provider);
    setDeleteModalOpen(true);
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <Typography.Text strong>{text}</Typography.Text>,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color={type === "Bank" ? "blue" : type === "Mobile Banking" ? "purple" : "default"}>
          {type}
        </Tag>
      ),
    },
    {
      title: "Added",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("DD MMM YYYY"),
    },
    {
      title: "Status",
      key: "isActive",
      render: (record: IPaymentProvider) => (
        <ActionDropdown
          record={record}
          onEdit={() => handleEdit(record)}
          onDelete={() => handleDelete(record)}
          onToggleStatus={() => toggleStatus(record._id)}
          status={record.isActive}
        />
      ),
    },
  ];

  if (isLoading) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Payment Providers"
        subtitle="Manage banks, mobile banking, and other payment providers."
        actions={[
          {
            label: "Add Provider",
            icon: Plus,
            onClick: () => {
              setSelectedProvider(null);
              setModalOpen(true);
            },
            primary: true,
          },
        ]}
      />

      <Card>
        <Table
          columns={columns}
          dataSource={data?.data}
          rowKey="_id"
          pagination={false}
          size="middle"
        />
      </Card>

      <ProviderModal
        open={modalOpen}
        setOpen={setModalOpen}
        data={selectedProvider}
      />
      <DeleteModal
        open={deleteModalOpen}
        setOpen={setDeleteModalOpen}
        title="Delete Provider"
        content={`Are you sure you want to delete ${selectedProvider?.name}?`}
        onConfirm={() => selectedProvider && deleteProvider(selectedProvider._id)}
      />
    </div>
  );
};

export default Providers;
