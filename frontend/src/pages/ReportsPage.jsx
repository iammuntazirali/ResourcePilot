import { useEffect, useState } from 'react';
import { reportApi } from '../services';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Download } from 'lucide-react';

const COLORS = ['#2E8B57', '#3D6FE0', '#E3A72E', '#D9622B', '#C0392B', '#6B7280'];

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportApi
      .get()
      .then(({ data: res }) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleExportCSV = (title, dataArray) => {
    if (!dataArray || !dataArray.length) return alert('No data to export');
    const headers = Object.keys(dataArray[0]).join(',');
    const rows = dataArray.map(row => 
      Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.toLowerCase().replace(/ /g, "_")}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="text-[#5B6470] font-bold p-6">Compiling Analytics Data...</div>;

  const utilizationData = (data?.utilization || []).map((u) => ({
    status: u.status.replace(/_/g, ' ').toUpperCase(),
    count: Number(u.count),
  }));

  const deptData = (data?.deptAllocations || []).map((d) => ({
    department: d.department?.code || 'UNASSIGNED',
    count: Number(d.count),
  }));

  const maintenanceData = (data?.maintenanceStats || []).map((m) => ({
    category: m.categoryName || 'Uncategorized',
    count: Number(m.count),
  }));

  const heatmapData = (data?.bookingHeatmap || []).map((h) => ({
    hour: `${h.hour}:00`,
    count: Number(h.count),
  }));

  return (
    <div className="space-y-8 p-1">
      <div className="flex items-center justify-between border-b border-[#E1E1DC] pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#14171C]">Operational Analytics</h1>
          <p className="text-sm text-[#5B6470] mt-1">Audit highlights, booking frequencies, and hardware lifecycle charts</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Utilization Chart */}
        <div className="border border-[#E1E1DC] rounded-md bg-white p-5 space-y-4 flex flex-col justify-between h-96">
          <div className="flex justify-between items-center border-b border-[#E1E1DC]/60 pb-3">
            <h3 className="font-bold text-sm text-[#14171C] uppercase tracking-wider">Asset Utilization Share</h3>
            <button
              onClick={() => handleExportCSV('asset_utilization', utilizationData)}
              className="text-[#3D6FE0] hover:text-[#305cb8] flex items-center gap-1 text-xs font-bold uppercase cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          </div>
          <div className="h-64 flex-1 mt-2">
            {utilizationData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={utilizationData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} innerRadius={45} labelLine={false}>
                    {utilizationData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-[#5B6470] text-center py-20">No utilization metrics yet</p>
            )}
          </div>
        </div>

        {/* Dept allocations Bar Chart */}
        <div className="border border-[#E1E1DC] rounded-md bg-white p-5 space-y-4 flex flex-col justify-between h-96">
          <div className="flex justify-between items-center border-b border-[#E1E1DC]/60 pb-3">
            <h3 className="font-bold text-sm text-[#14171C] uppercase tracking-wider">Department Allocations</h3>
            <button
              onClick={() => handleExportCSV('department_allocations', deptData)}
              className="text-[#3D6FE0] hover:text-[#305cb8] flex items-center gap-1 text-xs font-bold uppercase cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          </div>
          <div className="h-64 flex-1 mt-2">
            {deptData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData}>
                  <XAxis dataKey="department" stroke="#5B6470" fontSize={10} fontStyle="bold" />
                  <YAxis stroke="#5B6470" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3D6FE0" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-[#5B6470] text-center py-20">No department data yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Maintenance frequency */}
        <div className="border border-[#E1E1DC] rounded-md bg-white p-5 space-y-4 flex flex-col justify-between h-96">
          <div className="flex justify-between items-center border-b border-[#E1E1DC]/60 pb-3">
            <h3 className="font-bold text-sm text-[#14171C] uppercase tracking-wider">Repairs by Category</h3>
            <button
              onClick={() => handleExportCSV('category_maintenance', maintenanceData)}
              className="text-[#3D6FE0] hover:text-[#305cb8] flex items-center gap-1 text-xs font-bold uppercase cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          </div>
          <div className="h-64 flex-1 mt-2">
            {maintenanceData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maintenanceData}>
                  <XAxis dataKey="category" stroke="#5B6470" fontSize={10} />
                  <YAxis stroke="#5B6470" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#D9622B" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-[#5B6470] text-center py-20">No repairs registered yet</p>
            )}
          </div>
        </div>

        {/* Booking Heatmap */}
        <div className="border border-[#E1E1DC] rounded-md bg-white p-5 space-y-4 flex flex-col justify-between h-96">
          <div className="flex justify-between items-center border-b border-[#E1E1DC]/60 pb-3">
            <h3 className="font-bold text-sm text-[#14171C] uppercase tracking-wider">Hourly Booking Load</h3>
            <button
              onClick={() => handleExportCSV('booking_heatmap', heatmapData)}
              className="text-[#3D6FE0] hover:text-[#305cb8] flex items-center gap-1 text-xs font-bold uppercase cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          </div>
          <div className="h-64 flex-1 mt-2">
            {heatmapData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={heatmapData}>
                  <XAxis dataKey="hour" stroke="#5B6470" fontSize={10} />
                  <YAxis stroke="#5B6470" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#E3A72E" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-[#5B6470] text-center py-20">No bookings recorded yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Nearing retirement listing */}
      <div className="border border-[#E1E1DC] rounded-md bg-white p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-[#E1E1DC]/60 pb-3">
          <h3 className="font-bold text-sm text-[#14171C] uppercase tracking-wider">Depreciation & Retirement Alerts</h3>
          <button
            onClick={() => handleExportCSV('depreciation_retirement', data?.nearingRetirement || [])}
            className="text-[#3D6FE0] hover:text-[#305cb8] flex items-center gap-1 text-xs font-bold uppercase cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        </div>
        <div className="overflow-hidden border border-[#E1E1DC] rounded-md bg-white mt-4">
          <table className="table-industrial">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">Asset</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Acquisition Date</th>
                <th className="px-4 py-3 text-left">Period Elapsed</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.nearingRetirement || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[#5B6470] text-xs">
                    No active assets recorded for depreciation tracking.
                  </td>
                </tr>
              ) : (
                data.nearingRetirement.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F5F6F4]/50">
                    <td className="px-4 py-3 font-semibold text-[#14171C]">
                      <span className="asset-tag-chip mr-2">{item.tag}</span>
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-[#5B6470]">{item.category}</td>
                    <td className="px-4 py-3 text-[#5B6470] mono-text">{item.purchaseDate || 'N/A'}</td>
                    <td className="px-4 py-3 text-[#5B6470] mono-text">{item.depreciationYears} Yrs ({item.yearsUsed} yrs elapsed)</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${item.nearingRetirement ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                        {item.nearingRetirement ? 'RETIREMENT DUE' : 'OPERATIVE'}
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
