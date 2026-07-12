import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { masterApi } from '../services';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Calendar, ShieldAlert, ClipboardList } from 'lucide-react';

const COLORS = ['#2E8B57', '#3D6FE0', '#E3A72E', '#D9622B', '#C0392B', '#6B7280'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    masterApi
      .dashboard()
      .then(({ data: res }) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-slate-500 font-semibold p-6">Loading dashboard...</div>;
  }

  const chartData = (data?.byStatus || []).map((s) => ({
    name: s.status.replace(/_/g, ' ').toUpperCase(),
    value: Number(s.count),
  }));

  const kpis = [
    { label: 'Available', value: data?.assetsAvailable || 0, color: 'text-[#2E8B57]', bg: 'bg-[#2E8B57]/5 border-[#2E8B57]/10' },
    { label: 'Allocated', value: data?.assetsAllocated || 0, color: 'text-[#3D6FE0]', bg: 'bg-[#3D6FE0]/5 border-[#3D6FE0]/10' },
    { label: 'Active Bookings', value: data?.activeBookings || 0, color: 'text-[#E3A72E]', bg: 'bg-[#E3A72E]/5 border-[#E3A72E]/10' },
    { label: 'Repairs Today', value: data?.maintenanceToday || 0, color: 'text-[#D9622B]', bg: 'bg-[#D9622B]/5 border-[#D9622B]/10' },
    { label: 'Pending Transfers', value: data?.pendingTransfers || 0, color: 'text-[#C0392B]', bg: 'bg-[#C0392B]/5 border-[#C0392B]/10' },
    { label: 'Upcoming Returns', value: data?.upcomingReturns || 0, color: 'text-[#6B7280]', bg: 'bg-[#6B7280]/5 border-[#6B7280]/10' },
  ];

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E1E1DC] pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#14171C]">System Dashboard</h1>
          <p className="text-sm text-[#5B6470] mt-1">Real-time status check for physical hardware assets</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#5B6470] uppercase">Role:</span>
          <span className="rounded bg-[#12151B] px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider mono-text">
            {user?.roles?.map((r) => r.displayName).join(', ') || 'Employee'}
          </span>
        </div>
      </div>

      {/* KPI Cards (styled as inventory tag layout with left notch) */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`relative overflow-hidden rounded-md border p-4 shadow-sm flex flex-col justify-between h-28 bg-white border-[#E1E1DC]`}>
            {/* Tag Cutout Notch */}
            <div className="absolute top-1/2 -left-2 transform -translate-y-1/2 w-4 h-4 bg-[#F5F6F4] rounded-full border border-[#E1E1DC]"></div>
            <p className="text-[10px] font-bold text-[#5B6470] uppercase tracking-wider pl-2">{kpi.label}</p>
            <p className={`text-3xl font-extrabold tracking-tight pl-2 mono-text ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions & Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Quick actions & visual distribution */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick actions panel */}
          <div className="border border-[#E1E1DC] rounded-md bg-white p-6">
            <h3 className="text-base font-bold text-[#14171C] mb-4">Quick Operations</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <a
                href="/assets"
                className="flex items-center gap-3 border border-[#E1E1DC] rounded-md p-4 text-sm font-semibold text-[#14171C] bg-[#F5F6F4]/50 hover:bg-[#F5F6F4] hover:border-[#5B6470] transition"
              >
                <PlusCircle className="h-5 w-5 text-[#3D6FE0]" />
                <span>Register Asset</span>
              </a>
              <a
                href="/bookings"
                className="flex items-center gap-3 border border-[#E1E1DC] rounded-md p-4 text-sm font-semibold text-[#14171C] bg-[#F5F6F4]/50 hover:bg-[#F5F6F4] hover:border-[#5B6470] transition"
              >
                <Calendar className="h-5 w-5 text-[#E3A72E]" />
                <span>Book Resource</span>
              </a>
              <a
                href="/maintenance"
                className="flex items-center gap-3 border border-[#E1E1DC] rounded-md p-4 text-sm font-semibold text-[#14171C] bg-[#F5F6F4]/50 hover:bg-[#F5F6F4] hover:border-[#5B6470] transition"
              >
                <ShieldAlert className="h-5 w-5 text-[#D9622B]" />
                <span>Request Repair</span>
              </a>
            </div>
          </div>

          {/* Overdue (red-tinted) vs Upcoming (neutral) panels */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Overdue Section */}
            <div className="border border-[#C0392B]/20 rounded-md bg-[#C0392B]/5 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#C0392B] font-bold text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <span className="status-dot bg-[#C0392B] m-0" /> Overdue Returns
                </span>
                <span className="bg-[#C0392B]/10 text-[#C0392B] text-[10px] font-bold rounded px-1.5 py-0.5 mono-text">
                  {data?.overdueList?.length || 0} Overdue
                </span>
              </div>
              <div className="space-y-2">
                {(data?.overdueList || []).length === 0 ? (
                  <p className="text-xs text-[#5B6470] py-4 text-center">No overdue asset returns recorded</p>
                ) : (
                  data.overdueList.map((item) => (
                    <div key={item.id} className="bg-white border border-[#E1E1DC] rounded p-3 text-xs flex justify-between items-center">
                      <div>
                        <div className="asset-tag-chip mb-1">{item.asset?.assetTag}</div>
                        <p className="font-semibold text-[#14171C]">{item.asset?.name}</p>
                        <p className="text-[10px] text-[#5B6470] mt-1">Custodian: {item.custodian?.firstName} {item.custodian?.lastName}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-rose-600 font-bold mono-text block">OVERDUE</span>
                        <span className="text-[9px] text-[#5B6470] mono-text">{new Date(item.expectedReturnDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Returns Section */}
            <div className="border border-[#E1E1DC] rounded-md bg-white p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#14171C] font-bold text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <span className="status-dot bg-[#3D6FE0] m-0" /> Upcoming Returns
                </span>
                <span className="bg-slate-100 text-[#5B6470] text-[10px] font-bold rounded px-1.5 py-0.5 mono-text">
                  {data?.upcomingList?.length || 0} Pending
                </span>
              </div>
              <div className="space-y-2">
                {(data?.upcomingList || []).length === 0 ? (
                  <p className="text-xs text-[#5B6470] py-4 text-center">No upcoming asset returns scheduled</p>
                ) : (
                  data.upcomingList.map((item) => (
                    <div key={item.id} className="bg-[#F5F6F4]/40 border border-[#E1E1DC] rounded p-3 text-xs flex justify-between items-center">
                      <div>
                        <div className="asset-tag-chip mb-1">{item.asset?.assetTag}</div>
                        <p className="font-semibold text-[#14171C]">{item.asset?.name}</p>
                        <p className="text-[10px] text-[#5B6470] mt-1">Custodian: {item.custodian?.firstName} {item.custodian?.lastName}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[#3D6FE0] font-bold mono-text block">EXPECTED</span>
                        <span className="text-[9px] text-[#5B6470] mono-text">{new Date(item.expectedReturnDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Visual Distribution Chart */}
        <div className="lg:col-span-1 border border-[#E1E1DC] rounded-md bg-white p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-[#14171C] mb-1">Asset Status Map</h3>
            <p className="text-xs text-[#5B6470] mb-6">Percentage share of asset catalog</p>
          </div>
          <div className="h-44 flex items-center justify-center">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={40} labelLine={false}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-[#5B6470] text-center py-10">No asset data yet</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-bold uppercase text-[#5B6470] border-t border-[#E1E1DC] pt-4">
            {chartData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="truncate">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
