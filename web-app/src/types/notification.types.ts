import type { NotificationType, NotificationPriority } from './enums';

export interface Notification {
  id: string;
  shopId: string;
  branchId: string | null;
  userId: string | null;
  type: NotificationType;
  category: string;
  priority: NotificationPriority;
  title: string;
  message: string;
  isRead: boolean;
  metadata: Record<string, any> | null;
  createdAt: string;
}
