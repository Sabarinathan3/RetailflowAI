import { createBrowserRouter } from 'react-router-dom';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { PinLoginPage } from '@/features/auth/PinLoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ProductsPage } from '@/features/products/ProductsPage';
import { CustomersPage } from '@/features/customers/CustomersPage';
import { InventoryPage } from '@/features/inventory/InventoryPage';
import { BillingPage } from '@/features/billing/BillingPage';
import { POSPage } from '@/features/pos/POSPage';
import { CreditPage } from '@/features/credit/CreditPage';
import { SuppliersPage } from '@/features/suppliers/SuppliersPage';
import { SupplierDetailsPage } from '@/features/suppliers/SupplierDetailsPage.tsx';
// trigger re-parse
import { PurchaseOrderPage } from '@/features/suppliers/PurchaseOrderPage';
import { NotificationsPage } from '@/features/notifications/NotificationsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { AdminPage } from '@/features/admin/AdminPage';
import { AdminLoginPage } from '@/features/admin/AdminLoginPage';
import { AdminRegisterPage } from '@/features/admin/AdminRegisterPage';
import { AdminDashboard } from '@/features/admin/AdminDashboard';
import { AdminUsersPage } from '@/features/admin/AdminUsersPage';
import { AdminReportsPage } from '@/features/admin/AdminReportsPage';
import { AdminActivityLogsPage } from '@/features/admin/AdminActivityLogsPage';
import { AdminUserStubPage } from '@/features/admin/AdminUserStubPage';
import { ProtectedAdminRoute } from '@/routes/ProtectedAdminRoute';

import { LandingPage } from '@/features/landing/LandingPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: 'admin/login',
    element: <AdminLoginPage />,
  },
  {
    path: 'admin/register',
    element: <AdminRegisterPage />,
  },
  {
    path: 'admin/dashboard',
    element: (
      <ProtectedAdminRoute requiredPermission="ANALYTICS_VIEW">
        <AdminDashboard />
      </ProtectedAdminRoute>
    ),
  },
  {
    path: 'admin/users',
    element: (
      <ProtectedAdminRoute requiredRole={['ADMIN']}>
        <AdminUsersPage />
      </ProtectedAdminRoute>
    ),
  },
  {
    path: 'admin/users/new',
    element: (
      <ProtectedAdminRoute requiredRole={['ADMIN']}>
        <AdminUserStubPage />
      </ProtectedAdminRoute>
    ),
  },
  {
    path: 'admin/users/:id/edit',
    element: (
      <ProtectedAdminRoute requiredRole={['ADMIN']}>
        <AdminUserStubPage />
      </ProtectedAdminRoute>
    ),
  },
  {
    path: 'admin/reports',
    element: (
      <ProtectedAdminRoute requiredPermission="REPORTS_VIEW">
        <AdminReportsPage />
      </ProtectedAdminRoute>
    ),
  },
  {
    path: 'admin/logs',
    element: (
      <ProtectedAdminRoute requiredPermission="AUDIT_LOGS_VIEW">
        <AdminActivityLogsPage />
      </ProtectedAdminRoute>
    ),
  },
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'pin-login', element: <PinLoginPage /> },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'billing', element: <BillingPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'pos', element: <POSPage /> },
      { path: 'credit', element: <CreditPage /> },
      { path: 'suppliers', element: <SuppliersPage /> },
      { path: 'suppliers/:id', element: <SupplierDetailsPage /> },
      { path: 'purchase-orders', element: <PurchaseOrderPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'admin', element: <AdminPage /> },
    ],
  },
]);
