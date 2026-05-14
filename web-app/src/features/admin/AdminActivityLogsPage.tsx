import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '@/store/admin.store';
import { adminApi } from '@/api/admin.api';
import type { ActivityLogResponse } from '@/types/admin.types';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export const AdminActivityLogsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, hasPermission } = useAdminStore();
  const [logs, setLogs] = useState<ActivityLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    action: '',
    resource: '',
    search: '',
  });

  useEffect(() => {
    if (!isAuthenticated || !hasPermission('AUDIT_LOGS_VIEW')) {
      navigate('/admin/login');
      return;
    }

    loadLogs();
  }, [isAuthenticated, hasPermission, navigate, page, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const result = await adminApi.getActivityLogs({
        page,
        limit: 20,
        action: filters.action || undefined,
        resource: filters.resource || undefined,
      });
      setLogs(result.data);
      setTotalPages(result.totalPages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    const colorMap: Record<string, string> = {
      create: 'bg-green-100 text-green-800',
      read: 'bg-blue-100 text-blue-800',
      update: 'bg-yellow-100 text-yellow-800',
      delete: 'bg-red-100 text-red-800',
      login: 'bg-purple-100 text-purple-800',
      logout: 'bg-gray-100 text-gray-800',
    };
    return colorMap[action] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    return status === 'success'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading activity logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Filter className="text-gray-400 w-5 h-5" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action
            </label>
            <select
              value={filters.action}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, action: e.target.value }));
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
            >
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="read">Read</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resource
            </label>
            <select
              value={filters.resource}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, resource: e.target.value }));
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
            >
              <option value="">All Resources</option>
              <option value="users">Users</option>
              <option value="shops">Shops</option>
              <option value="products">Products</option>
              <option value="orders">Orders</option>
              <option value="settings">Settings</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
              <Search className="text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, search: e.target.value }));
                  setPage(1);
                }}
                className="flex-1 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Admin
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Action
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Resource
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No activity logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {log.adminUser.name}
                      </p>
                      <p className="text-sm text-gray-600">{log.adminUser.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getActionColor(
                        log.action
                      )}`}
                    >
                      {log.action.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {log.resource}
                    {log.resourceId && (
                      <p className="text-sm text-gray-600">{log.resourceId}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        log.status
                      )}`}
                    >
                      {log.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    <div>
                      <p>{new Date(log.createdAt).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-2 rounded-lg ${
                  page === p
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 text-gray-900 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminActivityLogsPage;
