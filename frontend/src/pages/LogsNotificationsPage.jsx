import { useEffect, useState } from 'react';
import { masterApi } from '../services';
import { Bell, Shield, Calendar, User, Wrench, RefreshCw, Filter } from 'lucide-react';

const NOTIF_ICONS = {
  assignment_approved: Calendar,
  assignment_rejected: XCircleIcon,
  approval_pending: Wrench,
};

function XCircleIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

export default function LogsNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const load = () => {
    Promise.all([masterApi.notifications(), masterApi.listAuditLogs()])
      .then(([notifRes, logsRes]) => {
        setNotifications(notifRes.data.data);
        setLogs(logsRes.data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await masterApi.markRead(id);
      load();
    } catch (err) {
      alert('Failed to mark notification as read');
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!actionFilter) return true;
    return log.action.toLowerCase() === actionFilter.toLowerCase();
  });

  if (loading) return <div className="text-[#5B6470] font-bold p-6">Loading activity feed...</div>;

  return (
    <div className="space-y-6">
      <div className="border-b border-[#E1E1DC] pb-5">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#14171C]">Activity & Notifications</h1>
        <p className="text-sm text-[#5B6470] mt-1">Review live alerts and filterable system-wide security audit trails</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Notifications Column */}
        <div className="border border-[#E1E1DC] rounded-md bg-white p-5 space-y-4 lg:col-span-1">
          <h3 className="font-bold text-sm text-[#14171C] uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-2">🔔 Alerts Feed</span>
            {notifications.filter((n) => !n.isRead).length > 0 && (
              <span className="rounded bg-[#C0392B] px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wide mono-text">
                {notifications.filter((n) => !n.isRead).length} new
              </span>
            )}
          </h3>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-[#5B6470] text-center py-10 font-bold uppercase tracking-wider">No active alerts</p>
            ) : (
              notifications.map((n) => {
                const Icon = NOTIF_ICONS[n.type] || Bell;
                return (
                  <div
                    key={n.id}
                    className={`p-4 rounded border text-xs transition ${
                      n.isRead ? 'bg-[#F5F6F4]/40 border-[#E1E1DC]' : 'bg-[#3D6FE0]/5 border-[#3D6FE0]/30'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex gap-2">
                        <Icon className="h-4 w-4 text-[#3D6FE0] shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-[#14171C]">{n.title}</p>
                          <p className="text-[#5B6470] mt-1 text-[11px] font-medium leading-relaxed">{n.message}</p>
                        </div>
                      </div>
                      {!n.isRead && (
                        <button
                          onClick={() => handleMarkRead(n.id)}
                          className="text-[#3D6FE0] hover:underline text-[9px] font-bold uppercase cursor-pointer"
                        >
                          Read
                        </button>
                      )}
                    </div>
                    <p className="text-[9px] text-[#5B6470] mt-3 mono-text text-right">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Audit Logs Column */}
        <div className="border border-[#E1E1DC] rounded-md bg-white p-5 space-y-4 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E1E1DC]/60 pb-3">
            <h3 className="font-bold text-sm text-[#14171C] uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-[#3D6FE0]" /> Operations Log Trail
            </h3>

            {/* Filter toolbar */}
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-[#5B6470]" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="rounded border border-[#E1E1DC] px-2 py-1 text-xs text-[#14171C] font-semibold bg-[#F5F6F4]"
              >
                <option value="">All Operations</option>
                <option value="create">CREATE</option>
                <option value="update">UPDATE</option>
                <option value="transition">TRANSITION</option>
                <option value="approve">APPROVE</option>
                <option value="reject">REJECT</option>
                <option value="return">RETURN</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded border border-[#E1E1DC]">
            <table className="table-industrial text-xs">
              <thead>
                <tr>
                  <th className="px-3 py-2.5 text-left">Timestamp</th>
                  <th className="px-3 py-2.5 text-left">Operator</th>
                  <th className="px-3 py-2.5 text-left">Action</th>
                  <th className="px-3 py-2.5 text-left">Entity</th>
                  <th className="px-3 py-2.5 text-left">Data Changes</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[#5B6470] font-bold uppercase tracking-wider">
                      No matching audit logs
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F5F6F4]/30">
                      <td className="px-3 py-2.5 text-[#5B6470] mono-text whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-[#14171C]">
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="rounded bg-[#12151B]/5 px-1.5 py-0.5 text-[10px] font-bold text-[#14171C] uppercase tracking-wide mono-text">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[#5B6470] font-semibold capitalize">
                        {log.entityType}
                      </td>
                      <td className="px-3 py-2.5 text-[#5B6470] max-w-xs truncate font-medium mono-text">
                        {log.newValues || log.oldValues
                          ? JSON.stringify(log.newValues || log.oldValues)
                          : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
