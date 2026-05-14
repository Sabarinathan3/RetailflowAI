import { Link } from 'react-router-dom';

/**
 * Placeholder for admin user create/edit UI (API supports PUT /admin/users/:id).
 */
export function AdminUserStubPage() {
  return (
    <div className="max-w-lg mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Admin user editor</h1>
      <p className="text-gray-600 text-sm">
        Full create/edit forms are not wired in the UI yet. Use the admin API or manage users from the
        list page where supported.
      </p>
      <Link to="/admin/users" className="text-blue-600 font-medium text-sm">
        ← Back to admin users
      </Link>
    </div>
  );
}

export default AdminUserStubPage;
