import {
  Button,
  Image,
  Input,
  InputNumber,
  Modal,
  Space,
  Switch,
  Tag,
  Tooltip,
} from "antd";
import { ColumnsType } from "antd/es/table";
import { Check, Edit, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import PageHeader from "../../../components/Common/PageHeader";
import PageMeta from "../../../components/Common/PageMeta";
import PermissionGate from "../../../components/Common/PermissionGate";
import CreateCountryModal from "../../../components/modal/settings/country/CreateCountryModal";
import UpdateCountryModal from "../../../components/modal/settings/country/UpdateCountryModal";
import DataTable from "../../../components/Table/DataTable";
import { config } from "../../../config";
import {
  ICountry,
  useDeleteCountryMutation,
  useGetCountriesQuery,
  useLazyGetCountriesQuery,
  useToggleCountryStatusMutation,
  useUpdateCountrySerialMutation,
} from "../../../redux/features/country/countryApi";
import ExportMenu from "../../../components/Common/ExportMenu";
import { makeSheet } from "../../../utils/tableExport";

const { confirm } = Modal;

const SerialEditor = ({
  current,
  total,
  onSave,
  loading,
}: {
  current: number;
  total: number;
  onSave: (next: number) => void;
  loading: boolean;
}) => {
  const [value, setValue] = useState<number>(current);

  useEffect(() => {
    setValue(current);
  }, [current]);

  const handleSave = () => {
    if (!value || value === current) return;
    if (value < 1 || value > total) {
      toast.error(`Serial must be between 1 and ${total}`);
      return;
    }
    onSave(value);
  };

  return (
    <Space size={4}>
      <InputNumber
        min={1}
        max={total}
        value={value}
        onChange={(v) => setValue(Number(v) || 1)}
        size="small"
        style={{ width: 30 }}
        controls={false}
      />
      <Tooltip title="Save serial">
        <Button
          size="small"
          type="primary"
          icon={<Check className="w-3.5 h-3.5" />}
          loading={loading}
          disabled={value === current || !value}
          onClick={handleSave}
        />
      </Tooltip>
    </Space>
  );
};

const Countries = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [isOpenCreateModal, setIsOpenCreateModal] = useState(false);
  const [isOpenUpdateModal, setIsOpenUpdateModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<ICountry | null>(null);

  const queryParams: { name: string; value: any }[] = [
    { name: "page", value: currentPage },
    { name: "limit", value: limit },
  ];
  if (searchText) {
    queryParams.push({ name: "keyword", value: searchText });
  }

  const { data, isFetching } = useGetCountriesQuery(queryParams);
  const [fetchAllCountries] = useLazyGetCountriesQuery();
  const [deleteCountry] = useDeleteCountryMutation();
  const [toggleStatus] = useToggleCountryStatusMutation();
  const [updateSerial] = useUpdateCountrySerialMutation();
  const [savingSerialId, setSavingSerialId] = useState<string | null>(null);
  // Per-row loading so only the toggled row dims, not every switch on the page.
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const countries: ICountry[] = data?.data?.data || [];
  const totalCountries: number = data?.data?.meta?.total || 0;

  const handleMoveSerial = async (id: string, nextSerial: number) => {
    setSavingSerialId(id);
    try {
      await updateSerial({ id, serial_no: nextSerial }).unwrap();
      toast.success("Serial updated successfully");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update serial");
    } finally {
      setSavingSerialId(null);
    }
  };

  const handleDelete = (id: string) => {
    confirm({
      title: "Are you sure you want to delete this country?",
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteCountry(id).unwrap();
          toast.success("Country deleted successfully!");
        } catch (error: any) {
          toast.error(error?.data?.message || "Failed to delete country");
        }
      },
    });
  };

  const handleEdit = (country: ICountry) => {
    setSelectedCountry(country);
    setIsOpenUpdateModal(true);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setTogglingId(id);
    try {
      await toggleStatus(id).unwrap();
      toast.success(
        `Country ${currentStatus ? "deactivated" : "activated"} successfully!`
      );
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const columns: ColumnsType<ICountry> = [
    {
      title: "SL",
      dataIndex: "serial_no",
      key: "serial_no",
      width: 100,
      align: "center",
      render: (serial: number, record) => (
        <SerialEditor
          current={serial}
          total={totalCountries}
          loading={savingSerialId === record._id}
          onSave={(next) => handleMoveSerial(record._id!, next)}
        />
      ),
    },
    {
      title: "Flag",
      dataIndex: "flag",
      key: "flag",
      width: 70,
      render: (flag?: string) =>
        flag ? (
          <Image
            src={
              flag.startsWith("http")
                ? flag
                : `${config.image_access_url}${flag}`
            }
            alt="flag"
            width={42}
            height={28}
            style={{ objectFit: "cover", borderRadius: 4 }}
          />
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 150,
      render: (name: string, record) => (
        <div>
          <p className="font-semibold text-gray-800 m-0">{name}</p>
          <span className="text-xs text-gray-400">{record.code}</span>
        </div>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 160,
      render: (role: string) => <Tag color="blue">{role}</Tag>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      ellipsis: true,
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      width: 160,
    },
    {
      title: "Accent",
      dataIndex: "accentSolid",
      key: "accentSolid",
      width: 110,
      align: "center",
      render: (color: string) => (
        <div className="flex items-center justify-center gap-2">
          <span
            className="inline-block w-5 h-5 rounded-full border border-gray-200"
            style={{ background: color }}
          />
          <span className="text-xs font-mono text-gray-500">{color}</span>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (isActive: boolean, record) => (
        <Switch
          checked={isActive}
          loading={togglingId === record._id}
          disabled={togglingId === record._id}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          onChange={() => handleToggleStatus(record._id!, isActive)}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 130,
      render: (_, record) => (
        <Space>
          <PermissionGate module="Countries" action="Update">
            <Tooltip title="Edit Country">
              <Button
                icon={<Edit className="w-4 h-4" />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          </PermissionGate>
          <PermissionGate module="Countries" action="Delete">
            <Tooltip title="Delete Country">
              <Button
                danger
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => handleDelete(record._id!)}
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
        title="Countries - POS & Inventory Admin Panel"
        description="Manage country offices displayed on the website"
        keywords="countries, offices, POS & Inventory"
        canonicalUrl={`${window.location.origin}/settings/countries`}
        noindex={true}
      />
      <PageHeader
        title="Countries"
        subtitle="Manage country offices shown on the homepage"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Settings" },
          { title: "Countries" },
        ]}
        extra={
          <div className="flex flex-wrap items-center gap-2">
            <ExportMenu
              sheet={async () => {
                const all = await fetchAllCountries([
                  { name: "page", value: 1 },
                  { name: "limit", value: 10000 },
                  ...(searchText
                    ? [{ name: "keyword", value: searchText }]
                    : []),
                ]).unwrap();

                return makeSheet({
                  title: "Countries",
                  unit: "country",
                  filters: [searchText && `Search: "${searchText}"`],
                  headers: [
                    "SL",
                    "Name",
                    "Code",
                    "Role",
                    "Email",
                    "Phone",
                    "Accent",
                    "Status",
                  ],
                  rows: (all?.data?.data || []) as ICountry[],
                  isLow: (c: any) => !c.isActive,
                  cells: (c: any) => [
                    c.serial_no ?? "—",
                    c.name || "—",
                    c.code || "—",
                    c.role || "—",
                    c.email || "—",
                    c.phone || "—",
                    c.accentSolid || "—",
                    c.isActive ? "Active" : "Inactive",
                  ],
                });
              }}
              disabled={totalCountries === 0}
            />
            <PermissionGate module="Countries" action="Create">
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setIsOpenCreateModal(true)}
              >
                Add New Country
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="Search by name, code, role, email..."
          prefix={<Search className="w-4 h-4 text-gray-400" />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="max-w-md"
        />
      </div>

      <DataTable
        data={countries}
        columns={columns}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        limit={limit}
        setLimit={setLimit}
        total={totalCountries}
        isPaginate={totalCountries > limit}
        loading={isFetching}
        rowKey="_id"
      />

      {isOpenCreateModal && (
        <CreateCountryModal
          open={isOpenCreateModal}
          setOpen={setIsOpenCreateModal}
        />
      )}

      {isOpenUpdateModal && selectedCountry && (
        <UpdateCountryModal
          open={isOpenUpdateModal}
          setOpen={setIsOpenUpdateModal}
          data={selectedCountry}
        />
      )}
    </div>
  );
};

export default Countries;
