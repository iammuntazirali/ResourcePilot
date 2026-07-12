import { useEffect, useState } from 'react';
import { maintenanceApi, assetApi, masterApi } from '../services';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { ShieldAlert, User, CheckCircle2, ChevronRight, Play } from 'lucide-react';

const COLUMNS = [
  { status: 'pending', label: 'Pending Approval', border: 'border-t-4 border-t-amber-500' },
  { status: 'approved', label: 'Approved Tickets', border: 'border-t-4 border-t-blue-500' },
  { status: 'technician_assigned', label: 'Technician Assigned', border: 'border-t-4 border-t-purple-500' },
  { status: 'in_progress', label: 'Repairs In Progress', border: 'border-t-4 border-t-orange-500' },
  { status: 'resolved', label: 'Resolved / Closed', border: 'border-t-4 border-t-emerald-500' },
];

const PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-[#3d6fe0]/10 text-[#3d6fe0]',
  high: 'bg-[#e3a72e]/10 text-[#e3a72e]',
  urgent: 'bg-rose-100 text-rose-700 font-bold',
};

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

  const isManagerOrAdmin = user?.roles?.some(r => r.name === 'super_admin' || r.name === 'asset_manager');

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
      <div className="flex items-center justify-between border-b border-[#E1E1DC] pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#14171C]">Maintenance & Repairs</h1>
          <p className="text-sm text-[#5B6470] mt-1">Submit tickets, assign engineers, and track physical hardware repairs</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="glow-btn text-xs uppercase tracking-wider"
        >
          {showForm ? 'Collapse Form' : '+ Raise Ticket'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border border-[#E1E1DC] rounded-md bg-white p-6 shadow-sm space-y-4 max-w-lg">
          <h3 className="font-bold text-sm text-[#14171C] uppercase tracking-wider border-b pb-2 mb-2">Raise Maintenance Ticket</h3>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Select Asset</label>
            <select
              value={form.assetId}
              onChange={(e) => setForm({ ...form, assetId: e.target.value })}
              className="w-full rounded border border-[#E1E1DC] px-3 py-2.5 text-sm focus:border-[#3D6FE0] focus:outline-none"
              required
            >
              <option value="">Choose asset...</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.assetTag})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Issue Description</label>
            <textarea
              value={form.issue}
              onChange={(e) => setForm({ ...form, issue: e.target.value })}
              placeholder="Explain the damage or issue in detail..."
              className="w-full rounded border border-[#E1E1DC] px-3 py-2 text-sm focus:border-[#3D6FE0] focus:outline-none"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Priority Rating</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full rounded border border-[#E1E1DC] px-3 py-2.5 text-sm focus:border-[#3D6FE0] focus:outline-none"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Critical / Urgent Priority</option>
            </select>
          </div>

          <button type="submit" className="glow-btn text-xs py-2.5 uppercase tracking-wider">
            Confirm Registry
          </button>
        </form>
      )}

      {assigningTicketId && (
        <form onSubmit={handleAssign} className="border border-[#E1E1DC] rounded-md bg-white p-6 shadow-sm space-y-4 max-w-sm">
          <h3 className="font-bold text-sm text-[#14171C] uppercase tracking-wider border-b pb-2 mb-2">Assign Engineer</h3>
          <select
            value={selectedTechId}
            onChange={(e) => setSelectedTechId(e.target.value)}
            className="w-full rounded border border-[#E1E1DC] px-3 py-2.5 text-sm focus:border-[#3D6FE0] focus:outline-none"
            required
          >
            <option value="">Select engineer...</option>
            {techs.map((t) => (
              <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button type="submit" className="glow-btn text-xs py-1.5 uppercase tracking-wider">Assign</button>
            <button type="button" onClick={() => setAssigningTicketId(null)} className="glow-btn-secondary text-xs py-1.5 uppercase tracking-wider">Cancel</button>
          </div>
        </form>
      )}

      {resolvingTicketId && (
        <form onSubmit={handleResolve} className="border border-[#E1E1DC] rounded-md bg-white p-6 shadow-sm space-y-4 max-w-sm">
          <h3 className="font-bold text-sm text-[#14171C] uppercase tracking-wider border-b pb-2 mb-2">Close Ticket (Resolve)</h3>
          <textarea
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="Provide work notes for the repair log..."
            className="w-full rounded border border-[#E1E1DC] px-3 py-2 text-sm focus:border-[#3D6FE0] focus:outline-none"
            rows={3}
            required
          />
          <div className="flex gap-2">
            <button type="submit" className="glow-btn text-xs py-1.5 uppercase tracking-wider">Resolve</button>
            <button type="button" onClick={() => setResolvingTicketId(null)} className="glow-btn-secondary text-xs py-1.5 uppercase tracking-wider">Cancel</button>
          </div>
        </form>
      )}

      {/* Kanban Board Layout */}
      <div className="grid gap-4 lg:grid-cols-5 items-start">
        {COLUMNS.map((col) => {
          const colTickets = tickets.filter((t) => t.status === col.status);
          return (
            <div key={col.status} className="space-y-4">
              {/* Header card */}
              <div className={`bg-white border border-[#E1E1DC] rounded p-3 flex justify-between items-center shadow-sm ${col.border}`}>
                <span className="text-[10px] font-bold text-[#14171C] uppercase tracking-wider">{col.label}</span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-[#5B6470] mono-text">{colTickets.length}</span>
              </div>

              {/* Lane body */}
              <div className="space-y-3 min-h-[500px] bg-[#F5F6F4]/30 rounded border border-dashed border-[#E1E1DC] p-2">
                {colTickets.length === 0 ? (
                  <p className="text-[10px] text-[#5B6470]/60 text-center py-10 font-bold uppercase tracking-wider">No tickets</p>
                ) : (
                  colTickets.map((t) => (
                    <div key={t.id} className="bg-white border border-[#E1E1DC] rounded-md p-4 space-y-3 hover:border-[#c1c1bc] transition shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="asset-tag-chip">{t.asset?.assetTag}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${PRIORITY_COLORS[t.priority] || 'bg-slate-100 text-slate-700'}`}>
                          {t.priority}
                        </span>
                      </div>
                      
                      <p className="text-xs text-[#14171C] font-semibold leading-relaxed line-clamp-3">{t.issue}</p>

                      <div className="flex items-center gap-2 border-t pt-2 border-[#E1E1DC]/60 text-[10px] text-[#5B6470] font-bold uppercase">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate">{t.technician ? `${t.technician.firstName} ${t.technician.lastName}` : 'Unassigned'}</span>
                      </div>

                      {/* Lane-specific action buttons */}
                      <div className="flex justify-end gap-1.5 pt-1.5 border-t border-dashed border-[#E1E1DC]/40">
                        {t.status === 'pending' && isManagerOrAdmin && (
                          <>
                            <button type="button" onClick={() => handleApprove(t.id, true)} className="text-[#2E8B57] text-[10px] font-bold uppercase hover:underline">Approve</button>
                            <button type="button" onClick={() => handleApprove(t.id, false)} className="text-rose-600 text-[10px] font-bold uppercase hover:underline">Reject</button>
                          </>
                        )}
                        {(t.status === 'approved' || t.status === 'technician_assigned') && isManagerOrAdmin && !t.technicianId && (
                          <button type="button" onClick={() => setAssigningTicketId(t.id)} className="text-[#3D6FE0] text-[10px] font-bold uppercase hover:underline">Assign</button>
                        )}
                        {(t.status === 'approved' || t.status === 'technician_assigned') && (t.technicianId === user?.id || isManagerOrAdmin) && (
                          <button type="button" onClick={() => handleStart(t.id)} className="text-[#3D6FE0] text-[10px] font-bold uppercase hover:underline flex items-center gap-0.5"><Play className="h-2.5 w-2.5" /> Start</button>
                        )}
                        {t.status === 'in_progress' && (t.technicianId === user?.id || isManagerOrAdmin) && (
                          <button type="button" onClick={() => setResolvingTicketId(t.id)} className="text-[#2E8B57] text-[10px] font-bold uppercase hover:underline flex items-center gap-0.5"><CheckCircle2 className="h-2.5 w-2.5" /> Complete</button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
