import { SearchOutlined } from "@ant-design/icons";
import { Button, Card, Divider, Input, Select, Space } from "antd";
import dayjs from "dayjs";
import {
  AlertCircle,
  CheckCircle,
  Globe,
  Monitor,
  RefreshCw,
  User,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { FiEye } from "react-icons/fi";
import { LuArrowRightLeft } from "react-icons/lu";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import ActionLogViewModal from "../../components/modal/ActionLogViewModal";
import DateTimeStacked from "../../components/shared/DateTimeStacked";
import DataTable from "../../components/Table/DataTable";
import {
  useActionLogsQuery,
  useLazyActionLogsQuery,
} from "../../redux/features/actionLog/actionLogApi";
import ExportMenu from "../../components/Common/ExportMenu";
import { makeSheet } from "../../utils/tableExport";

const AllActionLogs = () => {
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [filterMethod, setFilterMethod] = useState<string | undefined>();
  const [selectedActionLog, setSelectedActionLog] = useState(null);
  const [isOpenViewModal, setIsOpenViewModal] = useState(false);

  const { data, isLoading, isFetching, refetch } = useActionLogsQuery([
    ...(filterMethod ? [{ name: "method", value: filterMethod }] : []),
    { name: "limit", value: limit },
    { name: "page", value: page },
  ]);
  const [fetchAllLogs] = useLazyActionLogsQuery();


  const getStatusBadge = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" />
          {statusCode}
        </span>
      );
    } else if (statusCode >= 400 && statusCode < 500) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertCircle className="w-3 h-3" />
          {statusCode}
        </span>
      );
    } else if (statusCode >= 500) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3" />
          {statusCode}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {statusCode}
      </span>
    );
  };

  const getMethodBadge = (method: string) => {
    const colors = {
      GET: "bg-blue-100 text-blue-800",
      POST: "bg-green-100 text-green-800",
      PUT: "bg-yellow-100 text-yellow-800",
      DELETE: "bg-red-100 text-red-800",
      PATCH: "bg-purple-100 text-purple-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          colors[method as keyof typeof colors] || "bg-gray-100 text-gray-800"
        }`}
      >
        {method}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: "bg-primary text-white",
      user: "bg-blue-100 text-blue-800",
      moderator: "bg-orange-100 text-orange-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800"
        }`}
      >
        {role}
      </span>
    );
  };

  const columns = [
    {
      title: "Date & Time",
      key: "timestamp",
      width: 150,
      render: (_: any, record: any) => (
        <DateTimeStacked value={record.timestamp} />
      ),
    },
    {
      title: "User & Action",
      key: "user",
      render: (_: any, record: any) => (
        <div className="space-y-2 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="font-medium text-gray-900">{record.email}</span>
          </div>
          <div className="flex items-center gap-2">
            {getRoleBadge(record.role)}
            <span className="text-sm text-gray-600">• {record.action}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Request Details",
      key: "request",
      render: (_: any, record: any) => (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {getMethodBadge(record.method)}
            {getStatusBadge(record.requestStatusCode)} <LuArrowRightLeft />
            {getStatusBadge(record.responseStatusCode)}
          </div>
          <div className="text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded max-w-xs truncate">
            {record.route}
          </div>
        </div>
      ),
    },
    {
      title: "Lead Info",
      key: "lead",
      render: (_: any, record: any) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Globe className="w-3 h-3 text-gray-400" />
            <span className="font-mono text-gray-600 whitespace-nowrap">
              {record.leadDetails.ipAddress}
            </span>
          </div>
          <div className="text-xs text-gray-500 max-w-xs truncate">
            {record.leadDetails.browserUrl}
          </div>
          <div className="text-xs text-gray-500 max-w-xs truncate">
            {record.leadDetails.userAgent.split(" ")[0]}...
          </div>
        </div>
      ),
    },
    {
      title: "Server Info",
      key: "server",
      render: (_: any, record: any) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Monitor className="w-3 h-3 text-gray-400" />
            <span className="font-mono text-gray-600 whitespace-nowrap">
              {record.serverDetails.hostname}
            </span>
          </div>
          <div className="text-xs text-gray-500 whitespace-nowrap uppercase">
            {record.serverDetails.platform}
          </div>
          <div className="text-xs text-gray-500 whitespace-nowrap">
            Uptime: {record.serverDetails.uptime}
          </div>
        </div>
      ),
    },

    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button
            onClick={() => {
              setSelectedActionLog(record);
              setIsOpenViewModal(true);
            }}
            icon={<FiEye />}
          />
        </Space>
      ),
    },
  ];
  const meta = data?.data?.meta;

  const buildSheet = async () => {
    const all = await fetchAllLogs([
      ...(filterMethod ? [{ name: "method", value: filterMethod }] : []),
      { name: "limit", value: 10000 },
      { name: "page", value: 1 },
    ]).unwrap();

    return makeSheet({
      title: "Action Logs",
      unit: "log",
      filters: [filterMethod && `Method: ${filterMethod}`],
      headers: [
        "When",
        "User",
        "Role",
        "Action",
        "Method",
        "Route",
        "Status",
        "IP",
        "Server",
      ],
      rows: all?.data?.data || [],
      // Anything that did not come back 2xx — the reason to read a log at all.
      isLow: (l: any) => Number(l.responseStatusCode) >= 400,
      cells: (l: any) => [
        l.timestamp ? dayjs(l.timestamp).format("DD MMM YYYY, h:mm A") : "—",
        l.email || "—",
        l.role || "—",
        l.action || "—",
        l.method || "—",
        l.route || "—",
        `${l.requestStatusCode ?? "—"} → ${l.responseStatusCode ?? "—"}`,
        l.leadDetails?.ipAddress || "—",
        l.serverDetails?.hostname || "—",
      ],
    });
  };

  return (
    <div className="">
      <PageMeta
        title="Action Logs - POS & Inventory Admin Panel"
        description="View and monitor all system action logs and user activities."
        keywords="action logs, audit logs, system logs, POS & Inventory"
        canonicalUrl={`${window.location.origin}/action-logs`}
        noindex={true}
        nofollow={true}
      />
      <PageHeader
        title="Action Logs Monitor"
        subtitle="Monitor and track all system actions and user activities"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Action Logs Monitor" },
        ]}
      />
      <Card className="bg-card border-border mb-5">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <Input
              placeholder="Search by email, action, or route..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="max-w-sm"
              allowClear
            />
            <Select
              placeholder="Filter by method"
              value={filterMethod}
              onChange={setFilterMethod}
              allowClear
              className="w-32"
              options={[
                { value: "GET", label: "GET" },
                { value: "POST", label: "POST" },
                { value: "PUT", label: "PUT" },
                { value: "DELETE", label: "DELETE" },
                { value: "PATCH", label: "PATCH" },
              ]}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ExportMenu sheet={buildSheet} disabled={(meta?.total ?? 0) === 0} />
            <Button
              loading={isFetching}
              type="primary"
              size="middle"
              icon={<RefreshCw size={16} />}
              onClick={() => refetch()}
            >
              Refresh
            </Button>
          </div>
        </div>

        <Divider className="my-4" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium">{data?.data?.data?.length ?? 0}</span>{" "}
            of <span className="font-medium">{meta?.total ?? 0}</span> logs
          </p>
          <p className="text-sm text-muted-foreground">
            Page <span className="font-medium">{page}</span> of{" "}
            <span className="font-medium">
              {meta?.total ? Math.ceil(meta?.total / meta?.limit) : 0}
            </span>
          </p>
        </div>
      </Card>

      <DataTable
        loading={isFetching || isLoading}
        columns={columns}
        data={data?.data?.data || []}
        rowKey="id"
        limit={limit}
        setLimit={setLimit}
        setCurrentPage={setPage}
        isPaginate={true}
        total={data?.data?.meta?.total || 0}
      />
      {isOpenViewModal && (
        <ActionLogViewModal
          open={isOpenViewModal}
          setOpen={setIsOpenViewModal}
          data={selectedActionLog}
        />
      )}
    </div>
  );
};

export default AllActionLogs;
