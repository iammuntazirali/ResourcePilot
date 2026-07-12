import { useEffect, useState } from 'react';
import { reportApi } from '../services';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280', '#78716c'];

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportApi
      .get()
      .then(({ data: res }) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-500">Loading reports...</div>;

  const utilizationData = (data?.utilization || []).map((u) => ({
    name: u.status.replace(/_/g, ' ').toUpperCase(),
    value: Number(u.count),
  }));

  const deptData = (data?.deptAllocations || []).map((d) => ({
    name: d.department?.code || 'UNASSIGNED',
    count: Number(d.count),
  }));

  const maintenanceData = (data?.maintenanceStats || []).map((m) => ({
    name: m.categoryName || 'Uncategorized',
    count: Number(m.count),
  }));

  const heatmapData = (data?.bookingHeatmap || []).map((h) => ({
    hour: `${h.hour}:00`,
    count: Number(h.count),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
        <p className="text-slate-500">Enterprise operational reports, usage rates, and audit highlights</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Utilization Chart */}
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900">Asset Utilization (Current Status)</h3>
          <div className="h-64">
            {utilizationData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={utilizationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {utilizationData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-500 text-center py-16">No utilization metrics yet</p>
            )}
          </div>
        </div>

        {/* Dept allocations Bar Chart */}
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900">Department Allocations</h3>
          <div className="h-64">
            {deptData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-500 text-center py-16">No department data yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Maintenance frequency */}
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900">Maintenance Tickets by Category</h3>
          <div className="h-64">
            {maintenanceData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maintenanceData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-500 text-center py-16">No repairs registered yet</p>
            )}
          </div>
        </div>

        {/* Booking Heatmap */}
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900">Resource Booking Heatmap (Hourly)</h3>
          <div className="h-64">
            {heatmapData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={heatmapData}>
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-500 text-center py-16">No bookings recorded yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Nearing retirement listing */}
      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <h3 className="font-semibold text-slate-900">Depreciation & Retirement Alerts</h3>
        <div className="overflow-hidden rounded-lg border">
          <table className="min-w-full divide-y text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left">Asset</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Acquisition Date</th>
                <th className="px-4 py-3 text-left">Depreciation Period</th>
                <th className="px-4 py-3 text-left">Retirement Status</th>
              </tr>
            </thead>
            <tbody className="divide-y text-slate-700">
              {(data?.nearingRetirement || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No active assets recorded for depreciation tracking.
                  </td>
                </tr>
              ) : (
                data.nearingRetirement.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-semibold">{item.tag} — {item.name}</td>
                    <td className="px-4 py-3">{item.category}</td>
                    <td className="px-4 py-3">{item.purchaseDate || 'N/A'}</td>
                    <td className="px-4 py-3">{item.depreciationYears} Years ({item.yearsUsed} years elapsed)</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.nearingRetirement ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {item.nearingRetirement ? 'Due for Retirement' : 'Operating'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
