import { Badge, Dropdown, Empty, Skeleton, Tooltip } from "antd";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  Check,
  CheckCheck,
  LucideIcon,
  Mail,
  MessageCircle,
} from "lucide-react";
import { FC, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  INotification,
  NotificationPriority,
  NotificationType,
} from "../../../redux/features/notification/notification.types";
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
} from "../../../redux/features/notification/notificationApi";

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  time_member_contact: MessageCircle,
  contact_message: Mail,
  quotation_request: Mail,
  system: Bell,
};

const PRIORITY_RING: Record<NotificationPriority, string> = {
  high: "ring-rose-200 bg-rose-50 text-rose-600",
  normal: "ring-primary-100 bg-primary-50 text-primary-600",
  low: "ring-secondary-100 bg-secondary-50 text-secondary-500",
};

const formatRelative = (iso: string) => {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
};

interface RowProps {
  item: INotification;
  onMarkRead: (id: string) => void;
  isMarking: boolean;
}

const NotificationRow: FC<RowProps> = ({ item, onMarkRead, isMarking }) => {
  const Icon = TYPE_ICON[item.type] ?? Bell;
  const ringClass =
    PRIORITY_RING[item.priority] ?? PRIORITY_RING.normal;
  const isUnread = !item.isRead;

  const tooltipBody = (
    <div className="max-w-xs">
      <p className="font-semibold text-white text-[12px] mb-1 leading-snug">
        {item.title}
      </p>
      <p className="text-[11px] text-white/90 whitespace-pre-line leading-relaxed">
        {item.message}
      </p>
    </div>
  );

  const handleClick = () => {
    if (!isUnread || isMarking) return;
    onMarkRead(item._id);
  };

  return (
    <Tooltip
      title={tooltipBody}
      placement="left"
      mouseEnterDelay={0.25}
      overlayInnerStyle={{ maxWidth: 320 }}
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={!isUnread}
        aria-label={isUnread ? "Mark as read" : "Already read"}
        className={`w-full text-left flex gap-3 px-4 py-3 transition-all duration-300 ease-out border-l-2 ${
          isUnread
            ? "bg-primary-50/60 border-l-primary hover:bg-primary-50 cursor-pointer active:scale-[0.99]"
            : "bg-white border-l-transparent cursor-default opacity-90"
        }`}
      >
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-full ring-2 flex items-center justify-center transition-all duration-300 ${
            isUnread ? ringClass : "ring-secondary-100 bg-secondary-50 text-secondary-400"
          }`}
        >
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={`text-sm leading-snug truncate transition-colors duration-300 ${
                isUnread
                  ? "font-semibold text-secondary-900"
                  : "font-normal text-secondary-500"
              }`}
            >
              {item.title}
            </p>
            {isUnread ? (
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5 animate-pulse" />
            ) : (
              <Check
                size={14}
                className="flex-shrink-0 text-emerald-500 mt-1 transition-opacity duration-300"
              />
            )}
          </div>
          <p
            className={`mt-0.5 text-xs line-clamp-2 whitespace-pre-line transition-colors duration-300 ${
              isUnread ? "text-secondary-600" : "text-secondary-400"
            }`}
          >
            {item.message}
          </p>
          <p
            className={`mt-1 text-[10px] uppercase tracking-wide font-medium transition-colors duration-300 ${
              isUnread ? "text-secondary-400" : "text-secondary-300"
            }`}
          >
            {formatRelative(item.createdAt)}
          </p>
        </div>
      </button>
    </Tooltip>
  );
};

const NotificationBell: FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { data: unreadResp } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 60_000,
  });
  const unreadCount: number = unreadResp?.data?.total ?? 0;

  const { data: listResp, isFetching } = useGetNotificationsQuery(
    { limit: 10, page: 1 },
    { skip: !open }
  );

  const notifications: INotification[] = useMemo(
    () => listResp?.data?.data ?? [],
    [listResp]
  );

  const [markAllAsRead, { isLoading: isMarkingAll }] =
    useMarkAllNotificationsAsReadMutation();
  const [markAsRead, { isLoading: isMarkingOne }] =
    useMarkNotificationAsReadMutation();

  const handleMarkRead = async (id: string) => {
    try {
      await markAsRead(id).unwrap();
    } catch {
      // swallow — UI state is non-critical
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

  const dropdownContent = (
    <div className="w-[380px] max-w-[92vw] bg-white rounded-xl shadow-2xl border border-secondary-100 overflow-hidden">
      <header className="flex items-center justify-between px-4 py-3 border-b border-secondary-100 bg-gradient-to-r from-primary-50 to-white">
        <div>
          <h3 className="text-sm font-bold text-secondary-900 font-display">
            Notifications
          </h3>
          <p className="text-[11px] text-secondary-500">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "You're all caught up"}
          </p>
        </div>
        <Tooltip title={unreadCount === 0 ? "Nothing to mark" : "Mark all as read"}>
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={unreadCount === 0 || isMarkingAll}
            className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary-700 disabled:text-secondary-300 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        </Tooltip>
      </header>

      {/* `overscroll-contain` so reaching the end of the list stops there
          rather than handing the rest of the gesture to the page behind it. */}
      <div className="max-h-[440px] overflow-y-auto overscroll-contain divide-y divide-secondary-100">
        {isFetching && notifications.length === 0 ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} active paragraph={{ rows: 1 }} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10">
            <Empty
              description={
                <span className="text-secondary-500 text-sm">
                  No notifications yet
                </span>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationRow
              key={n._id}
              item={n}
              onMarkRead={handleMarkRead}
              isMarking={isMarkingOne}
            />
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <footer className="px-4 py-2.5 border-t border-secondary-100 bg-secondary-50/50 flex items-center justify-center">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/notifications");
            }}
            className="text-xs text-primary font-medium hover:text-primary-700 transition-colors flex items-center gap-1"
          >
            <Check size={12} />
            View all notifications
          </button>
        </footer>
      )}
    </div>
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      trigger={["click"]}
      placement="bottomRight"
      dropdownRender={() => dropdownContent}
    >
      <button
        type="button"
        aria-label="Notifications"
        className="relative p-2 text-secondary-500 hover:text-primary transition-colors"
      >
        <Badge
          count={unreadCount}
          overflowCount={99}
          size="small"
          offset={[-2, 2]}
          color="#e11d48"
        >
          <Bell size={20} />
        </Badge>
      </button>
    </Dropdown>
  );
};

export default NotificationBell;
