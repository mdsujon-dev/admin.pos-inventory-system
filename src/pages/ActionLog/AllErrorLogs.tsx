import { SearchOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Drawer,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  AlertOctagon,
  AlertTriangle,
  Globe,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { FiEye } from "react-icons/fi";
import { toast } from "react-toastify";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import PermissionGate from "../../components/Common/PermissionGate";
import DateTimeStacked from "../../components/shared/DateTimeStacked";
import DataTable from "../../components/Table/DataTable";
import { useDebounce } from "../../utils/useDebounce";
import {
  useClearAllErrorLogsMutation,
  useDeleteErrorLogMutation,
  useErrorLogsQuery,
  useLazyErrorLogsQuery,
} from "../../redux/features/errorLog/errorLogApi";
import ExportMenu from "../../components/Common/ExportMenu";
import { makeSheet } from "../../utils/tableExport";

const { Text, Title } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const statusBadge = (statusCode: number) => {
  if (statusCode >= 500) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-primary-100 text-primary-800 ring-1 ring-primary-200">
        <AlertOctagon className="w-3 h-3" />
        {statusCode}
      </span>
    );
  }
  if (statusCode >= 400) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-primary-100 text-primary-800 ring-1 ring-primary-200">
        <AlertTriangle className="w-3 h-3" />
        {statusCode}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
      {statusCode}
    </span>
  );
};

const methodBadge = (method?: string) => {
  if (!method) return null;
  const colors: Record<string, string> = {
    GET: "bg-primary-100 text-primary-800",
    POST: "bg-primary-100 text-primary-800",
    PUT: "bg-primary-100 text-primary-800",
    DELETE: "bg-primary-100 text-primary-800",
    PATCH: "bg-primary-100 text-primary-800",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
        colors[method] || "bg-secondary-100 text-secondary-800"
      }`}
    >
      {method}
    </span>
  );
};

const AllErrorLogs = () => {
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [filterMethod, setFilterMethod] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [selected, setSelected] = useState<any | null>(null);
  const debouncedSearch = useDebounce(searchText, 400);

  const queryArgs = useMemo(() => {
    const args: { name: string; value: any }[] = [
      { name: "page", value: page },
      { name: "limit", value: limit },
    ];
    if (debouncedSearch) args.push({ name: "keyword", value: debouncedSearch });
    if (filterMethod) args.push({ name: "method", value: filterMethod });
    if (filterStatus) args.push({ name: "statusCode", value: filterStatus });
    return args;
  }, [page, limit, debouncedSearch, filterMethod, filterStatus]);

  const { data, isLoading, isFetching, refetch } = useErrorLogsQuery(queryArgs);
  const [deleteErrorLog] = useDeleteErrorLogMutation();
  const [fetchAllErrorLogs] = useLazyErrorLogsQuery();
  const [clearAllErrorLogs, { isLoading: isClearing }] =
    useClearAllErrorLogsMutation();

  const logs = useMemo<any[]>(() => data?.data || [], [data]);
  const meta = data?.meta;
  const showPagination = (meta?.totalPage ?? 0) > 1;

  const stats = useMemo(() => {
    const total = meta?.total ?? logs.length;
    const server = logs.filter((l) => l.statusCode >= 500).length;
    const lead = logs.filter(
      (l) => l.statusCode >= 400 && l.statusCode < 500
    ).length;
    return { total, server, lead };
  }, [logs, meta]);

  const buildSheet = async () => {
    const all = await fetchAllErrorLogs([
      { name: "page", value: 1 },
      { name: "limit", value: 10000 },
      ...(debouncedSearch
        ? [{ name: "keyword", value: debouncedSearch }]
        : []),
      ...(filterMethod ? [{ name: "method", value: filterMethod }] : []),
      ...(filterStatus ? [{ name: "statusCode", value: filterStatus }] : []),
    ]).unwrap();

    return makeSheet({
      title: "Error Logs",
      unit: "error",
      filters: [
        filterMethod && `Method: ${filterMethod}`,
        filterStatus && `Status: ${filterStatus}`,
        debouncedSearch && `Search: "${debouncedSearch}"`,
      ],
      headers: [
        "When",
        "Status",
        "Error",
        "Message",
        "Method",
        "Route",
        "User",
        "IP",
      ],
      rows: all?.data || [],
      // A 5xx is ours to fix; a 4xx is usually the caller's.
      isLow: (l: any) => Number(l.statusCode) >= 500,
      cells: (l: any) => [
        l.timestamp ? dayjs(l.timestamp).format("DD MMM YYYY, h:mm A") : "—",
        l.statusCode ?? "—",
        l.errorName || "—",
        l.message || "—",
        l.method || "—",
        l.route || "—",
        l.email || "guest",
        l.leadDetails?.ipAddress || "—",
      ],
    });
  };

  const handleDelete = (id: string) => {
    confirm({
      title: "Delete this error log?",
      content: "This action cannot be undone.",
      okText: "Yes, delete",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteErrorLog(id).unwrap();
          toast.success("Error log deleted");
        } catch (e: any) {
          toast.error(e?.data?.message || "Failed to delete log");
        }
      },
    });
  };

  const handleClearAll = () => {
    confirm({
      title: "Clear all error logs?",
      content:
        "Every error log will be permanently removed. This cannot be undone.",
      okText: "Yes, clear all",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await clearAllErrorLogs(undefined).unwrap();
          toast.success("All error logs cleared");
        } catch (e: any) {
          toast.error(e?.data?.message || "Failed to clear logs");
        }
      },
    });
  };

  const columns = [
    {
      title: "When",
      key: "timestamp",
      width: 150,
      render: (_: any, record: any) => (
        <DateTimeStacked value={record.timestamp} />
      ),
    },
    {
      title: "Status",
      key: "statusCode",
      width: 100,
      render: (_: any, record: any) => statusBadge(record.statusCode),
    },
    {
      title: "Message",
      key: "message",
      render: (_: any, record: any) => (
        <Tooltip
          title={
            <span className="whitespace-pre-line">{record.message}</span>
          }
          placement="topLeft"
          overlayStyle={{ maxWidth: 480 }}
        >
          <div className="font-medium text-secondary-900 line-clamp-2 cursor-help">
            {record.message}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Where",
      key: "route",
      width: 320,
      render: (_: any, record: any) => (
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2">
            {methodBadge(record.method)}
            <span className="text-xs font-mono text-secondary-700 truncate">
              {record.route || "—"}
            </span>
          </div>
          {record.errorName && (
            <Tag color="var(--primary)" className="font-mono text-xs">
              {record.errorName}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "User",
      key: "user",
      width: 180,
      render: (_: any, record: any) => (
        <div className="space-y-0.5 whitespace-nowrap">
          <div className="text-sm text-secondary-900 truncate">
            {record.email || <Text type="secondary">guest</Text>}
          </div>
          {record.role && (
            <Tag color="default" className="text-xs">
              {String(record.role).toUpperCase()}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Lead",
      key: "lead",
      width: 160,
      render: (_: any, record: any) => (
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1 text-secondary-600">
            <Globe className="w-3 h-3" />
            <span className="font-mono">
              {record.leadDetails?.ipAddress || "—"}
            </span>
          </div>
          <div className="text-secondary-500 truncate max-w-[150px]">
            {record.leadDetails?.userAgent?.split(" ")[0] || ""}
          </div>
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right" as const,
      width: 110,
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="View details">
            <Button
              icon={<FiEye />}
              onClick={() => setSelected(record)}
            />
          </Tooltip>
          <PermissionGate module="Error Logs" action="Delete">
            <Tooltip title="Delete">
              <Button
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => handleDelete(record._id)}
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
        title="Error Logs - POS & Inventory Admin Panel"
        description="Browse and clear application error logs."
        keywords="error logs, application errors, monitoring, POS & Inventory"
        canonicalUrl={`${window.location.origin}/logs/errors`}
        noindex={true}
        nofollow={true}
      />
      <PageHeader
        title="Error Logs"
        subtitle="Errors captured from the API are recorded here"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Logs" },
          { title: "Error Logs" },
        ]}
        extra={
          <div className="flex flex-wrap items-center gap-2">
            {/* Worth having before Clear All is pressed — the file is the only
                copy left afterwards. */}
            <ExportMenu sheet={buildSheet} disabled={logs.length === 0} />
            <PermissionGate module="Error Logs" action="Delete">
              <Button
                loading={isClearing}
                icon={<Trash2 className="w-4 h-4" />}
                onClick={handleClearAll}
              >
                Clear All
              </Button>
            </PermissionGate>
          </div>
        }
      />

      {/* Stats strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <Card className="!border-secondary-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-secondary-500 font-semibold">
                Total Errors
              </div>
              <div className="text-2xl font-bold text-secondary-900 mt-1">
                {stats.total}
              </div>
            </div>
            <XCircle className="w-7 h-7 text-secondary-400" />
          </div>
        </Card>
        <Card className="!border-primary-200 bg-primary-50/40">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-primary-700 font-semibold">
                Server (5xx)
              </div>
              <div className="text-2xl font-bold text-primary-700 mt-1">
                {stats.server}
              </div>
            </div>
            <AlertOctagon className="w-7 h-7 text-primary-500" />
          </div>
        </Card>
        <Card className="!border-primary-200 bg-primary-50/40">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-primary-700 font-semibold">
                Lead (4xx)
              </div>
              <div className="text-2xl font-bold text-primary-700 mt-1">
                {stats.lead}
              </div>
            </div>
            <AlertTriangle className="w-7 h-7 text-primary-500" />
          </div>
        </Card>
      </div>

      <Card className="bg-card border-border mb-5">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <Input
              placeholder="Search by message, route or email…"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPage(1);
              }}
              className="max-w-sm"
              allowClear
            />
            <Select
              placeholder="Method"
              value={filterMethod}
              onChange={(v) => {
                setFilterMethod(v);
                setPage(1);
              }}
              allowClear
              className="w-32"
            >
              <Option value="GET">GET</Option>
              <Option value="POST">POST</Option>
              <Option value="PUT">PUT</Option>
              <Option value="DELETE">DELETE</Option>
              <Option value="PATCH">PATCH</Option>
            </Select>
            <Select
              placeholder="Status"
              value={filterStatus}
              onChange={(v) => {
                setFilterStatus(v);
                setPage(1);
              }}
              allowClear
              className="w-36"
            >
              <Option value="400">400</Option>
              <Option value="401">401</Option>
              <Option value="403">403</Option>
              <Option value="404">404</Option>
              <Option value="409">409</Option>
              <Option value="500">500</Option>
            </Select>
          </div>
          <Button
            loading={isFetching}
            type="primary"
            icon={<RefreshCw size={16} />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </div>
      </Card>

      <DataTable
        loading={isFetching || isLoading}
        columns={columns}
        data={logs}
        rowKey="_id"
        currentPage={page}
        setCurrentPage={setPage}
        limit={limit}
        setLimit={setLimit}
        total={meta?.total ?? 0}
        isPaginate={showPagination}
        isShowSizeChanger={true}
      />

      <Drawer
        title={
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-primary-500" />
            <span>Error Details</span>
          </div>
        }
        open={!!selected}
        onClose={() => setSelected(null)}
        width={720}
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              {statusBadge(selected.statusCode)}
              {methodBadge(selected.method)}
              {selected.errorName && (
                <Tag color="var(--primary)" className="font-mono">
                  {selected.errorName}
                </Tag>
              )}
            </div>

            <div>
              <Text type="secondary" className="text-xs uppercase">
                Message
              </Text>
              <Title level={5} className="!mt-1 !mb-0">
                {selected.message}
              </Title>
            </div>

            <div>
              <Text type="secondary" className="text-xs uppercase">
                Route
              </Text>
              <div className="font-mono text-sm bg-secondary-50 px-3 py-2 rounded mt-1 break-all">
                {selected.route}
              </div>
            </div>

            {Array.isArray(selected.errorSources) &&
              selected.errorSources.length > 0 && (
                <div>
                  <Text type="secondary" className="text-xs uppercase">
                    Error sources
                  </Text>
                  <ul className="mt-1 space-y-1">
                    {selected.errorSources.map((s: any, i: number) => (
                      <li
                        key={i}
                        className="text-sm bg-primary-50 border border-primary-100 rounded px-3 py-1.5"
                      >
                        {s.path ? (
                          <span className="font-mono text-primary-700 mr-2">
                            {s.path}:
                          </span>
                        ) : null}
                        <span className="text-secondary-800">{s.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text type="secondary" className="text-xs uppercase">
                  User
                </Text>
                <div className="text-sm mt-1">
                  {selected.email || "guest"}
                  {selected.role && (
                    <Tag className="ml-2">
                      {String(selected.role).toUpperCase()}
                    </Tag>
                  )}
                </div>
              </div>
              <div>
                <Text type="secondary" className="text-xs uppercase">
                  When
                </Text>
                <div className="text-sm mt-1">
                  {selected.timestamp
                    ? new Date(selected.timestamp).toLocaleString()
                    : "—"}
                </div>
              </div>
            </div>

            {selected.leadDetails && (
              <div>
                <Text type="secondary" className="text-xs uppercase">
                  Lead
                </Text>
                <div className="text-xs font-mono bg-secondary-50 px-3 py-2 rounded mt-1 space-y-1 break-all">
                  <div>
                    <span className="text-secondary-500">IP:</span>{" "}
                    {selected.leadDetails.ipAddress || "—"}
                  </div>
                  <div>
                    <span className="text-secondary-500">URL:</span>{" "}
                    {selected.leadDetails.browserUrl || "—"}
                  </div>
                  <div>
                    <span className="text-secondary-500">UA:</span>{" "}
                    {selected.leadDetails.userAgent || "—"}
                  </div>
                </div>
              </div>
            )}

            {selected.stack && (
              <div>
                <Text type="secondary" className="text-xs uppercase">
                  Stack trace
                </Text>
                {/* Scrolls on its own, so it opts out of the page's smooth
                    scrolling — otherwise the wheel over a long stack trace
                    moves the page behind it instead of the trace. */}
                <pre
                  data-lenis-prevent
                  className="text-xs font-mono bg-secondary-900 text-secondary-100 px-3 py-2 rounded mt-1 overflow-auto overscroll-contain max-h-72"
                >
                  {selected.stack}
                </pre>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default AllErrorLogs;
