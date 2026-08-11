import {
  Badge,
  Button,
  Empty,
  Input,
  Pagination,
  Segmented,
  Select,
  Skeleton,
  Tag,
  Tooltip,
} from "antd";
import { format, formatDistanceToNow } from "date-fns";
import {
  Bell,
  CheckCheck,
  ChevronDown,
  Filter,
  Mail,
  MessageCircle,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { FC, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "../../components/Common/PageHeader";
import PageMeta from "../../components/Common/PageMeta";
import PermissionGate from "../../components/Common/PermissionGate";
import {
  INotification,
  NotificationPriority,
  NotificationType,
} from "../../redux/features/notification/notification.types";
import {
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
} from "../../redux/features/notification/notificationApi";

const TYPE_META: Record<
  NotificationType,
  { label: string; icon: typeof Bell; tone: string }
> = {
  time_member_contact: {
    label: "Team Member Contact",
    icon: MessageCircle,
    tone: "bg-violet-50 text-violet-600 ring-violet-200",
  },
  contact_message: {
    label: "Contact Message",
    icon: Mail,
    tone: "bg-sky-50 text-sky-600 ring-sky-200",
  },
  quotation_request: {
    label: "Quotation Request",
    icon: Mail,
    tone: "bg-amber-50 text-amber-600 ring-amber-200",
  },
  system: {
    label: "System",
    icon: Bell,
    tone: "bg-secondary-100 text-secondary-600 ring-secondary-200",
  },
};

const PRIORITY_TAG: Record<NotificationPriority, { color: string; label: string }> = {
  high: { color: "red", label: "High" },
  normal: { color: "blue", label: "Normal" },
  low: { color: "default", label: "Low" },
};

interface CardProps {
  item: INotification;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onMarkRead: (item: INotification) => void;
  onDelete: (item: INotification) => void;
  onOpenAction: (item: INotification) => void;
}

const NotificationCard: FC<CardProps> = ({
  item,
  isExpanded,
  onToggle,
  onMarkRead,
  onDelete,
}) => {
  const meta = TYPE_META[item.type] ?? TYPE_META.system;
  const Icon = meta.icon;
  const priority = PRIORITY_TAG[item.priority] ?? PRIORITY_TAG.normal;
  const isUnread = !item.isRead;

  const createdAtAbsolute = useMemo(() => {
    try {
      return format(new Date(item.createdAt), "PPpp");
    } catch {
      return "";
    }
  }, [item.createdAt]);

  const createdAtRelative = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });
    } catch {
      return "";
    }
  }, [item.createdAt]);

  const metadataEntries = useMemo(() => {
    if (!item.metadata) return [];
    return Object.entries(item.metadata).filter(
      ([, v]) => v !== null && v !== undefined && v !== ""
    );
  }, [item.metadata]);

  return (
    <div
      className={`group rounded-xl border transition-all duration-200 ${
        isUnread
          ? "border-primary-200 bg-primary-50/30 shadow-sm"
          : "border-secondary-100 bg-white"
      } ${isExpanded ? "shadow-md" : "hover:shadow-sm hover:border-secondary-200"}`}
    >
      <button
        type="button"
        onClick={() => onToggle(item._id)}
        aria-expanded={isExpanded}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left"
      >
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full ring-2 flex items-center justify-center ${meta.tone}`}
        >
          <Icon size={18} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={`text-[13px] sm:text-sm leading-snug ${
                    isUnread
                      ? "font-semibold text-secondary-900"
                      : "text-secondary-700"
                  }`}
                >
                  {item.title}
                </h3>
                {isUnread && (
                  <span className="inline-flex w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
              <p
                className={`mt-1 text-xs text-secondary-500 ${
                  isExpanded ? "" : "line-clamp-1"
                }`}
              >
                {item.message}
              </p>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <Tag color={priority.color} className="!m-0 !text-[10px]">
                  {priority.label}
                </Tag>
                <span className="text-[11px] text-secondary-400 font-medium">
                  {meta.label}
                </span>
                <span className="text-secondary-300">•</span>
                <Tooltip title={createdAtAbsolute}>
                  <span className="text-[11px] text-secondary-400">
                    {createdAtRelative}
                  </span>
                </Tooltip>
              </div>
            </div>

            <ChevronDown
              size={18}
              className={`flex-shrink-0 mt-1 text-secondary-400 transition-transform duration-200 ${
                isExpanded ? "rotate-180 text-primary" : ""
              }`}
            />
          </div>
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pl-[68px]">
            <div className="rounded-lg border border-secondary-100 bg-secondary-50/50 p-4 space-y-3">
              <div>
                <h4 className="text-[11px] uppercase tracking-wide font-semibold text-secondary-500 mb-1">
                  Message
                </h4>
                <p className="text-sm text-secondary-700 whitespace-pre-line leading-relaxed">
                  {item.message}
                </p>
              </div>

              {metadataEntries.length > 0 && (
                <div>
                  <h4 className="text-[11px] uppercase tracking-wide font-semibold text-secondary-500 mb-2">
                    Details
                  </h4>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                    {metadataEntries.map(([key, value]) => (
                      <div key={key} className="flex gap-2 text-xs">
                        <dt className="text-secondary-500 capitalize min-w-[90px]">
                          {key.replace(/([A-Z])/g, " $1").trim()}:
                        </dt>
                        <dd className="text-secondary-800 font-medium break-all">
                          {String(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <div className="flex items-center gap-4 text-[11px] text-secondary-500 pt-1 border-t border-secondary-100">
                <span>
                  <span className="text-secondary-400">Source:</span>{" "}
                  <span className="text-secondary-700 font-medium">
                    {item.source?.module ?? "—"}
                  </span>
                </span>
                <span>
                  <span className="text-secondary-400">Created:</span>{" "}
                  <span className="text-secondary-700">{createdAtAbsolute}</span>
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {isUnread && (
                  <Button
                    size="small"
                    icon={<CheckCheck size={14} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkRead(item);
                    }}
                  >
                    Mark as read
                  </Button>
                )}
                <PermissionGate module="Notifications" action="Delete">
                  <Button
                    size="small"
                    danger
                    icon={<Trash2 size={14} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item);
                    }}
                  >
                    Delete
                  </Button>
                </PermissionGate>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AllNotifications: FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialFocusId = searchParams.get("focus") ?? undefined;
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>();
  const [keyword, setKeyword] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(initialFocusId ? [initialFocusId] : [])
  );

  const queryArgs = useMemo(
    () => ({
      page,
      limit,
      ...(readFilter !== "all" && {
        isRead: readFilter === "read" ? ("true" as const) : ("false" as const),
      }),
      ...(typeFilter && { type: typeFilter }),
      ...(priorityFilter && { priority: priorityFilter }),
      ...(keyword && { keyword }),
    }),
    [page, limit, readFilter, typeFilter, priorityFilter, keyword]
  );

  const {
    data: listResp,
    isLoading,
    isFetching,
    refetch,
  } = useGetNotificationsQuery(queryArgs);
  const { data: unreadResp } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 60_000,
  });

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] =
    useMarkAllNotificationsAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const notifications = useMemo<INotification[]>(
    () => listResp?.data?.data ?? [],
    [listResp]
  );
  const meta = listResp?.data?.meta ?? {
    total: 0,
    page: 1,
    limit,
    totalPage: 0,
    unread: 0,
  };
  const unreadCount: number = unreadResp?.data?.total ?? meta.unread ?? 0;
  const totalPage =
    meta.totalPage ?? (limit > 0 ? Math.ceil(meta.total / limit) : 0);

  useEffect(() => {
    if (initialFocusId && notifications.some((n) => n._id === initialFocusId)) {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.add(initialFocusId);
        return next;
      });
    }
  }, [initialFocusId, notifications]);

  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    const target = notifications.find((n) => n._id === id);
    if (target && !target.isRead) {
      markAsRead(id).catch(() => {
        // non-critical
      });
    }
  };

  const handleMarkRead = async (item: INotification) => {
    if (item.isRead) return;
    try {
      await markAsRead(item._id).unwrap();
    } catch {
      // swallow
    }
  };

  const handleDelete = async (item: INotification) => {
    try {
      await deleteNotification(item._id).unwrap();
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(item._id);
        return next;
      });
    } catch {
      // swallow
    }
  };

  const handleOpenAction = (item: INotification) => {
    if (!item.actionUrl) return;
    if (/^https?:\/\//.test(item.actionUrl)) {
      window.open(item.actionUrl, "_blank", "noopener,noreferrer");
    } else {
      navigate(item.actionUrl);
    }
  };

  const handleMarkAll = async () => {
    if (unreadCount === 0) return;
    try {
      await markAllAsRead(undefined).unwrap();
    } catch {
      // swallow
    }
  };

  const resetFilters = () => {
    setReadFilter("all");
    setTypeFilter(undefined);
    setPriorityFilter(undefined);
    setKeyword("");
    setPage(1);
    setSearchParams({});
  };

  const hasActiveFilters =
    readFilter !== "all" ||
    !!typeFilter ||
    !!priorityFilter ||
    !!keyword;

  return (
    <>
      <PageMeta
        title="Notifications | POS & Inventory Admin Panel"
        description="View, filter, and manage all admin notifications."
      />
      <PageHeader
        title="Notifications"
        subtitle="All system, contact, and quotation notifications in one place"
        breadcrumbs={[
          { title: "Dashboard", path: "/" },
          { title: "Notifications" },
        ]}
        extra={
          <div className="flex items-center gap-2">
            <Tooltip title="Refresh">
              <Button
                icon={<RefreshCw size={14} />}
                onClick={() => refetch()}
                loading={isFetching && !isLoading}
              >
                Refresh
              </Button>
            </Tooltip>
            <Button
              type="primary"
              icon={<CheckCheck size={14} />}
              disabled={unreadCount === 0}
              loading={isMarkingAll}
              onClick={handleMarkAll}
            >
              Mark all as read
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl border border-secondary-100 bg-white p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-50 text-primary flex items-center justify-center">
            <Bell size={18} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-secondary-500 font-medium">
              Total
            </p>
            <p className="text-lg font-bold text-secondary-900">{meta.total}</p>
          </div>
        </div>
        <div className="rounded-xl border border-secondary-100 bg-white p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
            <Badge dot={unreadCount > 0} color="#e11d48">
              <Bell size={18} />
            </Badge>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-secondary-500 font-medium">
              Unread
            </p>
            <p className="text-lg font-bold text-secondary-900">{unreadCount}</p>
          </div>
        </div>
        <div className="rounded-xl border border-secondary-100 bg-white p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCheck size={18} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-secondary-500 font-medium">
              Read
            </p>
            <p className="text-lg font-bold text-secondary-900">
              {Math.max(0, meta.total - unreadCount)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-secondary-100 bg-white p-4 mb-5">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <Segmented
            value={readFilter}
            onChange={(val) => {
              setReadFilter(val as "all" | "unread" | "read");
              setPage(1);
            }}
            options={[
              { label: "All", value: "all" },
              {
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    Unread
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </span>
                ),
                value: "unread",
              },
              { label: "Read", value: "read" },
            ]}
          />

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-1 lg:max-w-2xl lg:justify-end">
            <Input
              allowClear
              placeholder="Search title or message..."
              prefix={<Search size={14} className="text-secondary-400" />}
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
              className="sm:max-w-[260px]"
            />
            <Select
              allowClear
              placeholder="Type"
              value={typeFilter}
              onChange={(val) => {
                setTypeFilter(val);
                setPage(1);
              }}
              className="sm:min-w-[160px]"
              options={[
                { value: "time_member_contact", label: "Team Member" },
                { value: "contact_message", label: "Contact Message" },
                { value: "quotation_request", label: "Quotation" },
                { value: "system", label: "System" },
              ]}
            />
            <Select
              allowClear
              placeholder="Priority"
              value={priorityFilter}
              onChange={(val) => {
                setPriorityFilter(val);
                setPage(1);
              }}
              className="sm:min-w-[130px]"
              options={[
                { value: "high", label: "High" },
                { value: "normal", label: "Normal" },
                { value: "low", label: "Low" },
              ]}
            />
            {hasActiveFilters && (
              <Button
                icon={<Filter size={14} />}
                onClick={resetFilters}
                type="text"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-secondary-100 bg-white p-4"
            >
              <Skeleton active avatar paragraph={{ rows: 2 }} />
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-secondary-200 bg-white py-16">
            <Empty
              description={
                <div className="text-center">
                  <p className="text-secondary-700 font-medium">
                    No notifications found
                  </p>
                  <p className="text-secondary-500 text-xs mt-1">
                    {hasActiveFilters
                      ? "Try adjusting filters or clearing them"
                      : "You're all caught up — new notifications will appear here"}
                  </p>
                </div>
              }
            />
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationCard
              key={n._id}
              item={n}
              isExpanded={expandedIds.has(n._id)}
              onToggle={handleToggle}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
              onOpenAction={handleOpenAction}
            />
          ))
        )}
      </div>

      {totalPage > 1 && (
        <div className="mt-6 flex items-center justify-center">
          <Pagination
            current={page}
            pageSize={limit}
            total={meta.total}
            onChange={(p) => setPage(p)}
            showSizeChanger={false}
            size="small"
          />
        </div>
      )}
    </>
  );
};

export default AllNotifications;
