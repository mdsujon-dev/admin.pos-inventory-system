import { Button, Input, Modal, Space, Switch, Tag, Tooltip } from "antd";
import { ColumnsType } from "antd/es/table";
import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import ExportMenu from "../../../components/Common/ExportMenu";
import PageHeader from "../../../components/Common/PageHeader";
import PageMeta from "../../../components/Common/PageMeta";
import PermissionGate from "../../../components/Common/PermissionGate";
import VariantAttributeModal from "../../../components/modal/inventory/VariantAttributeModal";
import DataTable from "../../../components/Table/DataTable";
import {
  IVariantAttribute,
  useDeleteVariantAttributeMutation,
  useGetVariantAttributesQuery,
  useLazyGetVariantAttributesQuery,
  useToggleVariantAttributeStatusMutation,
} from "../../../redux/features/inventory/variantAttributeApi";
import { makeSheet } from "../../../utils/tableExport";

const { confirm } = Modal;

const VariantAttributes = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [selected, setSelected] = useState<IVariantAttribute | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const queryParams = [
    { name: "page", value: currentPage },
    { name: "limit", value: limit },
    ...(searchText ? [{ name: "keyword", value: searchText }] : []),
  ];

  const { data, isFetching } = useGetVariantAttributesQuery(queryParams);
  const [fetchAllAttributes] = useLazyGetVariantAttributesQuery();
  const [deleteVariantAttribute] = useDeleteVariantAttributeMutation();
  const [toggleStatus] = useToggleVariantAttributeStatusMutation();

  const attributes: IVariantAttribute[] = data?.data?.data || [];
  const total: number = data?.data?.meta?.total || 0;

  const openCreate = () => {
    setSelected(null);
    setIsOpenModal(true);
  };

  const openEdit = (attribute: IVariantAttribute) => {
    setSelected(attribute);
    setIsOpenModal(true);
  };

  const handleDelete = (attribute: IVariantAttribute) => {
    confirm({
      title: `Delete "${attribute.name}"?`,
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteVariantAttribute(attribute._id).unwrap();
          toast.success("Variant attribute deleted successfully");
        } catch (error: any) {
          toast.error(error?.data?.message || "Failed to delete attribute");
        }
      },
    });
  };

  const handleToggleStatus = async (attribute: IVariantAttribute) => {
    setTogglingId(attribute._id);
    try {
      await toggleStatus(attribute._id).unwrap();
      toast.success(
        `Attribute ${
          attribute.isActive ? "deactivated" : "activated"
        } successfully`
      );
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const columns: ColumnsType<IVariantAttribute> = [
    {
      title: "Attribute",
      dataIndex: "name",
      key: "name",
      width: 200,
      render: (name: string) => (
        <p className="font-semibold text-secondary-800 m-0">{name}</p>
      ),
    },
    {
      title: "Values",
      dataIndex: "values",
      key: "values",
      render: (values: string[] = []) => (
        <div className="flex flex-wrap gap-1">
          {values.length > 0 ? (
            values.map((value) => (
              <Tag key={value} color="var(--primary)">
                {value}
              </Tag>
            ))
          ) : (
            <span className="text-secondary-400">—</span>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 130,
      render: (isActive: boolean, record) => (
        <PermissionGate
          module="Variant Attributes"
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
          <PermissionGate module="Variant Attributes" action="Update">
            <Tooltip title="Edit Attribute">
              <Button
                icon={<Edit className="w-4 h-4" />}
                onClick={() => openEdit(record)}
              />
            </Tooltip>
          </PermissionGate>
          <PermissionGate module="Variant Attributes" action="Delete">
            <Tooltip title="Delete Attribute">
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
        title="Variant Attributes - POS & Inventory Admin Panel"
        description="Manage the attributes products can vary along"
        canonicalUrl={`${window.location.origin}/inventory/variant-attributes`}
        noindex={true}
      />
      <PageHeader
        title="Variant Attributes"
        subtitle="The axes a product varies along — colour, size, material"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Inventory" },
          { title: "Variant Attributes" },
        ]}
        extra={
          <div className="flex flex-wrap items-center gap-2">
            <ExportMenu
              sheet={async () => {
                const all = await fetchAllAttributes([
                  { name: "page", value: 1 },
                  { name: "limit", value: 10000 },
                  ...(searchText
                    ? [{ name: "keyword", value: searchText }]
                    : []),
                ]).unwrap();

                return makeSheet({
                  title: "Variant Attributes",
                  unit: "attribute",
                  filters: [searchText && `Search: "${searchText}"`],
                  headers: ["Attribute", "Values", "Status"],
                  rows: (all?.data?.data || []) as IVariantAttribute[],
                  isLow: (a: any) => !a.isActive,
                  cells: (a: any) => [
                    a.name || "—",
                    (a.values || []).join(", ") || "—",
                    a.isActive ? "Active" : "Inactive",
                  ],
                });
              }}
              disabled={total === 0}
            />
            <PermissionGate module="Variant Attributes" action="Create">
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={openCreate}
              >
                Add Attribute
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="Search by attribute or value..."
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
        data={attributes}
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
        <VariantAttributeModal
          open={isOpenModal}
          setOpen={setIsOpenModal}
          data={selected}
        />
      )}
    </div>
  );
};

export default VariantAttributes;
