import { useEffect, useState } from 'react';
import { masterApi } from '../services';

export default function LogsNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="text-slate-500">Loading activity...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Activity Logs & Notifications</h1>
        <p className="text-slate-500">View real-time alerts and comprehensive system audit records</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Notifications Column */}
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4 lg:col-span-1">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            🔔 In-App Notifications
            {notifications.filter((n) => !n.isRead).length > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                {notifications.filter((n) => !n.isRead).length} new
              </span>
            )}
          </h3>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No notifications</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-lg border text-sm transition ${
                    n.isRead ? 'bg-slate-50/50 border-slate-200' : 'bg-brand-50/10 border-brand-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-slate-900">{n.title}</p>
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="text-brand-600 hover:underline text-xs font-semibold"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                  <p className="text-slate-600 mt-1 text-xs">{n.message}</p>
                  <p className="text-[10px] text-slate-400 mt-2">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Audit Logs Column */}
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4 lg:col-span-2">
          <h3 className="font-semibold text-slate-900">🛡️ System Audit Logs</h3>

          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full divide-y text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2.5 text-left">Timestamp</th>
                  <th className="px-3 py-2.5 text-left">User</th>
                  <th className="px-3 py-2.5 text-left">Action</th>
                  <th className="px-3 py-2.5 text-left">Entity</th>
                  <th className="px-3 py-2.5 text-left">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-700">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No audit logs recorded
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/30">
                      <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-slate-800">
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 uppercase">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 capitalize text-slate-500">
                        {log.entityType} ({log.entityId || 'N/A'})
                      </td>
                      <td className="px-3 py-2.5 text-slate-500 max-w-xs truncate">
                        {log.newValues || log.oldValues
                          ? JSON.stringify(log.newValues || log.oldValues)
                          : 'No extra details'}
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
