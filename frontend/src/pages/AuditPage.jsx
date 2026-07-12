import { useEffect, useState } from 'react';
import { auditApi, masterApi } from '../services';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { ShieldCheck, AlertOctagon, HelpCircle, XCircle } from 'lucide-react';

export default function AuditPage() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({ name: '', scopeType: 'all', scopeId: '', startDate: '', endDate: '' });

  const isManagerOrAdmin = user?.roles?.some(r => r.name === 'super_admin' || r.name === 'asset_manager');

  const loadCycles = () => {
    auditApi.list().then(({ data }) => setCycles(data.data));
  };

  useEffect(() => {
    loadCycles();
    masterApi.departments().then(({ data }) => setDepartments(data.data));
    masterApi.locations().then(({ data }) => setLocations(data.data));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await auditApi.create({
        ...form,
        scopeId: form.scopeId ? Number(form.scopeId) : null,
      });
      setShowForm(false);
      setForm({ name: '', scopeType: 'all', scopeId: '', startDate: '', endDate: '' });
      loadCycles();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to start audit cycle');
    }
  };

  const handleSelectCycle = async (id) => {
    try {
      const { data } = await auditApi.getById(id);
      setSelectedCycle(data.data);
    } catch (err) {
      alert('Failed to load cycle details');
    }
  };

  const handleAuditItem = async (itemId, status) => {
    const notes = prompt('Enter notes for this check (optional):', 'Checked during audit');
    if (notes === null) return;
    try {
      await auditApi.checkItem(selectedCycle.id, itemId, { status, notes });
      handleSelectCycle(selectedCycle.id);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to audit item');
    }
  };

  const handleCloseCycle = async () => {
    if (!confirm('Are you sure you want to close and lock this audit cycle? This will lock all checks and automatically mark missing items as lost.')) return;
    try {
      await auditApi.close(selectedCycle.id);
      handleSelectCycle(selectedCycle.id);
      loadCycles();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to close cycle');
    }
  };

  // Compute stats for selected cycle
  const missingItems = selectedCycle?.items?.filter((i) => i.status === 'missing') || [];
  const damagedItems = selectedCycle?.items?.filter((i) => i.status === 'damaged') || [];
  const verifiedItems = selectedCycle?.items?.filter((i) => i.status === 'verified') || [];
  const pendingItems = selectedCycle?.items?.filter((i) => i.status === 'pending') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#E1E1DC] pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#14171C]">Verification Audits</h1>
          <p className="text-sm text-[#5B6470] mt-1">Deploy verification check cycles, verify item locations, and log discrepancy metrics</p>
        </div>
        {isManagerOrAdmin && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="glow-btn text-xs uppercase tracking-wider"
          >
            {showForm ? 'Collapse Form' : '+ Launch Audit Cycle'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="border border-[#E1E1DC] rounded-md bg-white p-6 shadow-sm space-y-4 max-w-lg">
          <h3 className="font-bold text-sm text-[#14171C] uppercase tracking-wider border-b pb-2 mb-2">New Audit Cycle</h3>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Audit Cycle Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Q3 IT Hardware Audit"
              className="w-full rounded border border-[#E1E1DC] px-3 py-2 text-sm focus:border-[#3D6FE0] focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Scope Type</label>
              <select
                value={form.scopeType}
                onChange={(e) => setForm({ ...form, scopeType: e.target.value, scopeId: '' })}
                className="w-full rounded border border-[#E1E1DC] px-3 py-2.5 text-sm focus:border-[#3D6FE0] focus:outline-none"
              >
                <option value="all">All Assets</option>
                <option value="department">By Department</option>
                <option value="location">By Location</option>
              </select>
            </div>
            {form.scopeType !== 'all' && (
              <div>
                <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Select Target</label>
                <select
                  value={form.scopeId}
                  onChange={(e) => setForm({ ...form, scopeId: e.target.value })}
                  className="w-full rounded border border-[#E1E1DC] px-3 py-2.5 text-sm focus:border-[#3D6FE0] focus:outline-none"
                  required
                >
                  <option value="">Select...</option>
                  {form.scopeType === 'department'
                    ? departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)
                    : locations.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.type})</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded border border-[#E1E1DC] px-3 py-2 text-sm focus:border-[#3D6FE0] focus:outline-none mono-text"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded border border-[#E1E1DC] px-3 py-2 text-sm focus:border-[#3D6FE0] focus:outline-none mono-text"
                required
              />
            </div>
          </div>

          <button type="submit" className="glow-btn text-xs py-2.5 uppercase tracking-wider">
            Launch Cycle
          </button>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cycle List */}
        <div className="space-y-4 lg:col-span-1">
          <h3 className="font-bold text-sm text-[#14171C] uppercase tracking-wider">Audit Cycles</h3>
          
          <div className="space-y-3">
            {cycles.length === 0 ? (
              <div className="border border-[#E1E1DC] rounded-md bg-white p-6 text-center text-xs text-[#5B6470]">
                No audit cycles registered
              </div>
            ) : (
              cycles.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCycle(c.id)}
                  className={`w-full text-left p-4 rounded-md border shadow-sm transition hover:border-[#5B6470] bg-white ${
                    selectedCycle?.id === c.id ? 'border-[#3D6FE0]' : 'border-[#E1E1DC]'
                  }`}
                >
                  <p className="font-bold text-[#14171C] text-sm">{c.name}</p>
                  <p className="text-[10px] font-semibold text-[#5B6470] mt-1 uppercase tracking-wider">Scope: {c.scopeType}</p>
                  <p className="text-[10px] text-[#5B6470] mt-0.5 mono-text">{c.startDate} to {c.endDate}</p>
                  <div className="mt-3">
                    <StatusBadge status={c.status} />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Audit execution view / checklists */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCycle ? (
            <div className="border border-[#E1E1DC] rounded-md bg-white p-6 space-y-6 shadow-sm">
              <div className="flex justify-between items-start border-b border-[#E1E1DC]/60 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#14171C]">{selectedCycle.name}</h2>
                  <p className="text-[10px] font-bold text-[#5B6470] uppercase mt-1">STATUS: {selectedCycle.status}</p>
                </div>
                {selectedCycle.status === 'active' && isManagerOrAdmin && (
                  <button
                    onClick={handleCloseCycle}
                    className="rounded bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs uppercase tracking-wider px-3.5 py-2 cursor-pointer shadow-sm border border-rose-700"
                  >
                    Lock & Close Cycle
                  </button>
                )}
              </div>

              {/* Stats highlights */}
              <div className="grid grid-cols-4 gap-3 text-center text-xs">
                <div className="bg-[#F5F6F4] border border-[#E1E1DC] rounded-md p-3">
                  <p className="font-bold text-[#5B6470] uppercase tracking-wider text-[9px] mb-1">Pending</p>
                  <p className="text-lg font-bold mono-text text-[#14171C]">{pendingItems.length}</p>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-md p-3">
                  <p className="font-bold text-emerald-700 uppercase tracking-wider text-[9px] mb-1">Verified</p>
                  <p className="text-lg font-bold mono-text text-emerald-800">{verifiedItems.length}</p>
                </div>
                <div className="bg-orange-50/50 border border-orange-100 rounded-md p-3">
                  <p className="font-bold text-orange-700 uppercase tracking-wider text-[9px] mb-1">Damaged</p>
                  <p className="text-lg font-bold mono-text text-orange-800">{damagedItems.length}</p>
                </div>
                <div className="bg-red-50/50 border border-red-100 rounded-md p-3">
                  <p className="font-bold text-red-700 uppercase tracking-wider text-[9px] mb-1">Missing</p>
                  <p className="text-lg font-bold mono-text text-red-800">{missingItems.length}</p>
                </div>
              </div>

              {/* Discrepancies report panel (flagged items highlighted red/amber) */}
              {(missingItems.length > 0 || damagedItems.length > 0) && (
                <div className="border border-[#E1E1DC] rounded-md bg-[#F5F6F4]/50 p-4 space-y-3">
                  <h4 className="font-bold text-xs text-[#14171C] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                    <AlertOctagon className="h-4 w-4 text-[#D9622B]" /> Discrepancy Highlight Report
                  </h4>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {missingItems.map(item => (
                      <div key={item.id} className="text-xs flex justify-between items-center text-red-700 bg-red-50/60 border border-red-100 p-2 rounded">
                        <span className="font-bold mono-text">{item.asset?.assetTag}</span>
                        <span className="font-semibold">{item.asset?.name} — MISSING</span>
                      </div>
                    ))}
                    {damagedItems.map(item => (
                      <div key={item.id} className="text-xs flex justify-between items-center text-orange-700 bg-orange-50/60 border border-orange-100 p-2 rounded">
                        <span className="font-bold mono-text">{item.asset?.assetTag}</span>
                        <span className="font-semibold">{item.asset?.name} — DAMAGED</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Checklist Table */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs text-[#14171C] uppercase tracking-wider">Asset Checklist Scope</h3>
                <div className="overflow-x-auto rounded border border-[#E1E1DC]">
                  <table className="table-industrial text-xs">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left">Asset Code</th>
                        <th className="px-3 py-2 text-left">Asset Name</th>
                        <th className="px-3 py-2 text-left">Verification Status</th>
                        <th className="px-3 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCycle.items?.map((item) => (
                        <tr key={item.id} className="hover:bg-[#F5F6F4]/30">
                          <td className="px-3 py-2">
                            <span className="asset-tag-chip">{item.asset?.assetTag}</span>
                          </td>
                          <td className="px-3 py-2 font-semibold text-[#14171C]">{item.asset?.name}</td>
                          <td className="px-3 py-2">
                            <StatusBadge status={item.status} />
                          </td>
                          <td className="px-3 py-2">
                            {selectedCycle.status === 'active' && (
                              <div className="flex gap-1.5">
                                <button type="button" onClick={() => handleAuditItem(item.id, 'verified')} className="text-[#2E8B57] font-bold hover:underline">Verify</button>
                                <button type="button" onClick={() => handleAuditItem(item.id, 'damaged')} className="text-[#D9622B] font-bold hover:underline">Damage</button>
                                <button type="button" onClick={() => handleAuditItem(item.id, 'missing')} className="text-[#C0392B] font-bold hover:underline">Missing</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-[#E1E1DC] rounded-md bg-white p-8 text-center text-xs text-[#5B6470] shadow-sm">
              Select an active audit cycle from the left sidebar to execute audit checks.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
