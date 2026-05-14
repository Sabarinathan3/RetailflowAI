import { create } from 'zustand';
import { notificationsApi } from '@/api/notifications.api';

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  decrementUnread: () => void;
  clearUnread: () => void;
  fetchUnreadCount: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  
  setUnreadCount: (count) => set({ unreadCount: count }),
  
  decrementUnread: () => set((state) => ({ 
    unreadCount: Math.max(0, state.unreadCount - 1) 
  })),
  
  clearUnread: () => set({ unreadCount: 0 }),
  
  fetchUnreadCount: async () => {
    try {
      const res = await notificationsApi.getUnreadCount();
      if (res.success && res.data) {
        set({ unreadCount: res.data.count });
      }
    } catch (error) {
      console.error('Failed to fetch unread notifications count:', error);
    }
  },
}));
