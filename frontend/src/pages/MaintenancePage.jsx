import { useEffect, useState } from 'react';
import { maintenanceApi, assetApi, masterApi } from '../services';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

export default function MaintenancePage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [assets, setAssets] = useState([]);
  const [techs, setTechs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ assetId: '', issue: '', priority: 'medium' });
  const [assigningTicketId, setAssigningTicketId] = useState(null);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [resolvingTicketId, setResolvingTicketId] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const isManagerOrAdmin = user?.roles?.includes('super_admin') || user?.roles?.includes('asset_manager');
  const isTechnician = user?.roles?.includes('maintenance_technician');

  const load = () => {
    maintenanceApi.list().then(({ data }) => setTickets(data.data));
    assetApi.list({ limit: 100 }).then(({ data }) => setAssets(data.data));
    masterApi.listUsers().then(({ data }) => {
      setTechs(data.data.filter((u) => u.roles?.some((r) => r.name === 'maintenance_technician' || r.name === 'employee')));
    });
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await maintenanceApi.create({
        assetId: Number(form.assetId),
        issue: form.issue,
        priority: form.priority,
      });
      setShowForm(false);
      setForm({ assetId: '', issue: '', priority: 'medium' });
      load();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to submit request');
    }
  };

  const handleApprove = async (id, approve) => {
    try {
      await maintenanceApi.approve(id, { approve });
      load();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Action failed');
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await maintenanceApi.assign(assigningTicketId, { technicianId: Number(selectedTechId) });
      setAssigningTicketId(null);
      setSelectedTechId('');
      load();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to assign technician');
    }
  };

  const handleStart = async (id) => {
    try {
      await maintenanceApi.start(id);
      load();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to start repair');
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    try {
      await maintenanceApi.resolve(resolvingTicketId, { resolutionNotes });
      setResolvingTicketId(null);
      setResolutionNotes('');
      load();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to resolve maintenance');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance & Repairs</h1>
          <p className="text-slate-500">Submit, approve, assign, and resolve asset repair tickets</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700"
        >
          {showForm ? 'Cancel' : '+ Request Repair'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 shadow-sm space-y-4 max-w-lg">
          <h3 className="font-semibold text-slate-950">Raise Maintenance Ticket</h3>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Select Asset</label>
            <select
              value={form.assetId}
              onChange={(e) => setForm({ ...form, assetId: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              required
            >
              <option value="">Choose asset...</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.assetTag} — {a.name} ({a.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Issue Description</label>
            <textarea
              value={form.issue}
              onChange={(e) => setForm({ ...form, issue: e.target.value })}
              placeholder="Explain the problem in detail..."
              className="w-full rounded-lg border px-3 py-2 text-sm"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700">
            Submit Ticket
          </button>
        </form>
      )}

      {assigningTicketId && (
        <form onSubmit={handleAssign} className="rounded-xl border bg-white p-6 shadow-sm space-y-4 max-w-sm">
          <h3 className="font-semibold text-slate-950">Assign Technician</h3>
          <select
            value={selectedTechId}
            onChange={(e) => setSelectedTechId(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            required
          >
            <option value="">Select technician...</option>
            {techs.map((t) => (
              <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button type="submit" className="rounded bg-brand-600 px-3 py-1.5 text-xs text-white">Assign</button>
            <button type="button" onClick={() => setAssigningTicketId(null)} className="rounded bg-slate-200 px-3 py-1.5 text-xs text-slate-800">Cancel</button>
          </div>
        </form>
      )}

      {resolvingTicketId && (
        <form onSubmit={handleResolve} className="rounded-xl border bg-white p-6 shadow-sm space-y-4 max-w-sm">
          <h3 className="font-semibold text-slate-950">Resolve Maintenance Ticket</h3>
          <textarea
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="Describe what was repaired..."
            className="w-full rounded-lg border px-3 py-2 text-sm"
            rows={3}
            required
          />
          <div className="flex gap-2">
            <button type="submit" className="rounded bg-brand-600 px-3 py-1.5 text-xs text-white">Submit Resolution</button>
            <button type="button" onClick={() => setResolvingTicketId(null)} className="rounded bg-slate-200 px-3 py-1.5 text-xs text-slate-800">Cancel</button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="min-w-full divide-y text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left">Asset</th>
              <th className="px-4 py-3 text-left">Issue</th>
              <th className="px-4 py-3 text-left">Priority</th>
              <th className="px-4 py-3 text-left">Technician</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No maintenance requests found
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {t.asset?.assetTag} — {t.asset?.name}
                  </td>
                  <td className="px-4 py-3 text-slate-700 max-w-xs truncate">{t.issue}</td>
                  <td className="px-4 py-3 text-slate-700 capitalize">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${t.priority === 'urgent' ? 'bg-red-100 text-red-800' : t.priority === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-800'}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {t.technician ? `${t.technician.firstName} ${t.technician.lastName}` : 'Unassigned'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {t.status === 'pending' && isManagerOrAdmin && (
                        <>
                          <button type="button" onClick={() => handleApprove(t.id, true)} className="text-emerald-600 hover:underline font-medium text-xs">Approve</button>
                          <button type="button" onClick={() => handleApprove(t.id, false)} className="text-red-600 hover:underline font-medium text-xs">Reject</button>
                        </>
                      )}
                      {(t.status === 'approved' || t.status === 'technician_assigned') && isManagerOrAdmin && !t.technicianId && (
                        <button type="button" onClick={() => setAssigningTicketId(t.id)} className="text-brand-600 hover:underline font-medium text-xs">Assign Tech</button>
                      )}
                      {(t.status === 'approved' || t.status === 'technician_assigned') && (t.technicianId === user?.id || isManagerOrAdmin) && (
                        <button type="button" onClick={() => handleStart(t.id)} className="text-blue-600 hover:underline font-medium text-xs">Start Work</button>
                      )}
                      {t.status === 'in_progress' && (t.technicianId === user?.id || isManagerOrAdmin) && (
                        <button type="button" onClick={() => setResolvingTicketId(t.id)} className="text-emerald-600 hover:underline font-medium text-xs">Complete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
