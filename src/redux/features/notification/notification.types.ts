export type NotificationType =
  | "time_member_contact"
  | "contact_message"
  | "quotation_request"
  | "system";

export type NotificationPriority = "low" | "normal" | "high";

export interface INotification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  audience: { roles: string[] };
  source: { module: string; refModel?: string; refId?: string };
  metadata?: Record<string, unknown>;
  actionUrl?: string;
  readBy: string[];
  isRead?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  success: boolean;
  message: string;
  data: {
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPage: number;
      unread: number;
    };
    data: INotification[];
  };
}
