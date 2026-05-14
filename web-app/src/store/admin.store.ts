import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminUser, AdminAuthResponse } from '@/types/admin.types';

interface AdminStore {
  admin: AdminUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: string[];
  role: string | null;

  // Actions
  setAdmin: (admin: AdminUser) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  login: (response: AdminAuthResponse) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateAdmin: (admin: Partial<AdminUser>) => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      admin: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      permissions: [],
      role: null,

      setAdmin: (admin) =>
        set({
          admin,
          permissions: admin.permissions || [],
          role: admin.role,
        }),

      setTokens: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
        }),

      login: (response) =>
        set({
          admin: {
            id: response.id,
            email: response.email,
            firstName: response.firstName,
            lastName: response.lastName,
            role: response.role,
            permissions: response.permissions || [],
            isActive: true,
            createdAt: new Date(),
          },
          accessToken: response.tokens.accessToken,
          refreshToken: response.tokens.refreshToken,
          isAuthenticated: true,
          isLoading: false,
          permissions: response.permissions || [],
          role: response.role,
        }),

      logout: () =>
        set({
          admin: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          permissions: [],
          role: null,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      updateAdmin: (adminData) =>
        set((state) => ({
          admin: state.admin ? { ...state.admin, ...adminData } : null,
        })),

      hasPermission: (permission: string) => {
        const { permissions } = get();
        return permissions.includes(permission);
      },

      hasRole: (role: string | string[]) => {
        const { role: userRole } = get();
        if (Array.isArray(role)) {
          return role.includes(userRole || '');
        }
        return userRole === role;
      },
    }),
    {
      name: 'admin-store',
    }
  )
);
