import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { masterApi } from '../services';

const COLORS = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280', '#78716c'];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    masterApi
      .dashboard()
      .then(({ data: res }) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-slate-500">Loading dashboard...</div>;
  }

  const chartData = (data?.byStatus || []).map((s) => ({
    name: s.status.replace(/_/g, ' '),
    value: Number(s.count),
  }));

  const kpis = [
    { label: 'Total Assets', value: data?.totalAssets || 0, color: 'text-slate-900', border: 'border-slate-100 bg-white/70' },
    { label: 'Available Assets', value: data?.assetsAvailable || 0, color: 'text-violet-600', border: 'border-violet-100 bg-violet-50/20' },
    { label: 'Allocated Assets', value: data?.assetsAllocated || 0, color: 'text-blue-600', border: 'border-blue-100 bg-blue-50/20' },
    { label: 'Active Bookings', value: data?.activeBookings || 0, color: 'text-emerald-600', border: 'border-emerald-100 bg-emerald-50/20' },
    { label: 'Repairs (Today)', value: data?.maintenanceToday || 0, color: 'text-amber-600', border: 'border-amber-100 bg-amber-50/20' },
    { label: 'Pending Transfers', value: data?.pendingTransfers || 0, color: 'text-fuchsia-600', border: 'border-fuchsia-100 bg-fuchsia-50/20' },
    { label: 'Upcoming Returns', value: data?.upcomingReturns || 0, color: 'text-sky-600', border: 'border-sky-100 bg-sky-50/20' },
    { label: 'Overdue Returns ⚠️', value: data?.overdueReturns || 0, color: 'text-rose-600', border: 'border-rose-200 bg-rose-50/30' },
  ];

  return (
    <div className="space-y-8 p-1">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Portfolio Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">Real-time operational snapshot of enterprise resources</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`rounded-2xl border p-6 hover-lift transition ${kpi.border}`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{kpi.label}</p>
            <p className={`mt-3 text-3xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2 hover-lift transition">
          <h3 className="mb-4 text-base font-bold text-slate-900">Asset Distribution by Status</h3>
          <div className="h-72">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} innerRadius={55} label>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-500 text-center py-20">No asset data yet</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-1 hover-lift transition">
          <h3 className="mb-4 text-base font-bold text-slate-900">Quick Actions</h3>
          <div className="space-y-3">
            <a
              href="/assets"
              className="flex items-center justify-between rounded-xl border border-slate-100 p-4 text-sm font-semibold text-slate-700 bg-slate-50/50 hover:bg-brand-50/20 hover:border-brand-200 transition group"
            >
              <span>💻 View all assets</span>
              <span className="text-slate-400 group-hover:text-brand-600 transition">→</span>
            </a>
            <a
              href="/requests"
              className="flex items-center justify-between rounded-xl border border-slate-100 p-4 text-sm font-semibold text-slate-700 bg-slate-50/50 hover:bg-brand-50/20 hover:border-brand-200 transition group"
            >
              <span>📋 Manage assignment requests</span>
              <span className="text-slate-400 group-hover:text-brand-600 transition">→</span>
            </a>
            <a
              href="/assignments"
              className="flex items-center justify-between rounded-xl border border-slate-100 p-4 text-sm font-semibold text-slate-700 bg-slate-50/50 hover:bg-brand-50/20 hover:border-brand-200 transition group"
            >
              <span>🔄 View active assignments</span>
              <span className="text-slate-400 group-hover:text-brand-600 transition">→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
