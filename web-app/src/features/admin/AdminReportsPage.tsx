import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '@/store/admin.store';
import { adminApi } from '@/api/admin.api';
import type { SalesReportResponse, InventoryReportResponse } from '@/types/admin.types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Download, Calendar } from 'lucide-react';

export const AdminReportsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, hasPermission } = useAdminStore();
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory'>('sales');
  const [salesReport, setSalesReport] = useState<SalesReportResponse | null>(null);
  const [inventoryReport, setInventoryReport] = useState<InventoryReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!isAuthenticated || !hasPermission('REPORTS_VIEW')) {
      navigate('/admin/login');
      return;
    }
  }, [isAuthenticated, hasPermission, navigate]);

  const generateSalesReport = async () => {
    try {
      setLoading(true);
      const report = await adminApi.generateSalesReport({
        startDate: new Date(dateRange.startDate),
        endDate: new Date(dateRange.endDate),
      });
      setSalesReport(report);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const generateInventoryReport = async () => {
    try {
      setLoading(true);
      const report = await adminApi.generateInventoryReport();
      setInventoryReport(report);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    const data = activeTab === 'sales' ? salesReport : inventoryReport;
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeTab}-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (activeTab === 'sales' && !salesReport) {
      generateSalesReport();
    } else if (activeTab === 'inventory' && !inventoryReport) {
      generateInventoryReport();
    }
  }, [activeTab]);

  return (
    <div className="space-y-8 p-8 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <button
          onClick={downloadReport}
          disabled={!salesReport && !inventoryReport}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition"
        >
          <Download className="w-5 h-5" />
          Download
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex-1 py-4 px-6 font-semibold ${
              activeTab === 'sales'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sales Report
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-4 px-6 font-semibold ${
              activeTab === 'inventory'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Inventory Report
          </button>
        </div>

        {/* Date Range (for Sales Report) */}
        {activeTab === 'sales' && (
          <div className="p-6 border-b bg-gray-50">
            <div className="flex items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="outline-none flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className="outline-none flex-1"
                  />
                </div>
              </div>
              <button
                onClick={generateSalesReport}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                {loading ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {activeTab === 'sales' && salesReport && (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                  <p className="text-gray-600 text-sm">Total Sales</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ₹{salesReport.totalSales.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                  <p className="text-gray-600 text-sm">Transactions</p>
                  <p className="text-2xl font-bold text-green-900">
                    {salesReport.totalTransactions}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                  <p className="text-gray-600 text-sm">Avg Transaction</p>
                  <p className="text-2xl font-bold text-purple-900">
                    ₹{salesReport.averageTransactionValue.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                  <p className="text-gray-600 text-sm">Total Tax</p>
                  <p className="text-2xl font-bold text-orange-900">
                    ₹{salesReport.totalTax.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Payment Mode Breakdown
                </h3>
                <div className="space-y-2">
                  {Object.entries(salesReport.paymentBreakdown).map(([mode, amount]) => (
                    <div key={mode} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium text-gray-700">{mode}</span>
                      <span className="text-gray-900 font-semibold">
                        ₹{amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Products & Customers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Top Products
                  </h3>
                  <div className="space-y-2">
                    {salesReport.topProducts.map((product, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{product.productName}</p>
                          <p className="text-sm text-gray-600">
                            {product.quantity} units
                          </p>
                        </div>
                        <span className="text-gray-900 font-semibold">
                          ₹{product.revenue.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Top Customers
                  </h3>
                  <div className="space-y-2">
                    {salesReport.topCustomers.map((customer, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{customer.customerName}</p>
                          <p className="text-sm text-gray-600">
                            {customer.transactions} transactions
                          </p>
                        </div>
                        <span className="text-gray-900 font-semibold">
                          ₹{customer.totalSpent.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && inventoryReport && (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                  <p className="text-gray-600 text-sm">Total Products</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {inventoryReport.totalProducts}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                  <p className="text-gray-600 text-sm">Inventory Value</p>
                  <p className="text-2xl font-bold text-green-900">
                    ₹{inventoryReport.totalValue.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
                  <p className="text-gray-600 text-sm">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {inventoryReport.lowStockItems}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
                  <p className="text-gray-600 text-sm">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-900">
                    {inventoryReport.outOfStockItems}
                  </p>
                </div>
              </div>

              {/* Fast & Slow Moving */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Fast Moving Items
                  </h3>
                  <div className="space-y-2">
                    {inventoryReport.fastMoving.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          <p className="text-sm text-gray-600">
                            {item.quantity} units
                          </p>
                        </div>
                        <span className="text-gray-900 font-semibold">
                          ₹{item.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Slow Moving Items
                  </h3>
                  <div className="space-y-2">
                    {inventoryReport.slowMoving.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          <p className="text-sm text-gray-600">
                            {item.quantity} units
                          </p>
                        </div>
                        <span className="text-gray-900 font-semibold">
                          ₹{item.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReportsPage;
