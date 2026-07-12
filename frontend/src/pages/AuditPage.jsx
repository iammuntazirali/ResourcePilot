import { useEffect, useState } from 'react';
import { auditApi, masterApi } from '../services';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

export default function AuditPage() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({ name: '', scopeType: 'all', scopeId: '', startDate: '', endDate: '' });

  const isManagerOrAdmin = user?.roles?.includes('super_admin') || user?.roles?.includes('asset_manager');

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
  const missingCount = selectedCycle?.items?.filter((i) => i.status === 'missing').length || 0;
  const damagedCount = selectedCycle?.items?.filter((i) => i.status === 'damaged').length || 0;
  const verifiedCount = selectedCycle?.items?.filter((i) => i.status === 'verified').length || 0;
  const pendingCount = selectedCycle?.items?.filter((i) => i.status === 'pending').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Asset Verification & Auditing</h1>
          <p className="text-slate-500">Run structured physical audit cycles, assign auditors, and resolve discrepancies</p>
        </div>
        {isManagerOrAdmin && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700"
          >
            {showForm ? 'Cancel' : '+ Create Audit Cycle'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border bg-white p-6 shadow-sm space-y-4 max-w-lg">
          <h3 className="font-semibold text-slate-950">New Audit Cycle</h3>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Audit Cycle Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Q3 IT Hardware Audit"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Scope Type</label>
              <select
                value={form.scopeType}
                onChange={(e) => setForm({ ...form, scopeType: e.target.value, scopeId: '' })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="all">All Assets</option>
                <option value="department">By Department</option>
                <option value="location">By Location</option>
              </select>
            </div>
            {form.scopeType !== 'all' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Select Target</label>
                <select
                  value={form.scopeId}
                  onChange={(e) => setForm({ ...form, scopeId: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
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
              <label className="mb-1 block text-sm font-medium text-slate-700">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700">
            Launch Audit Cycle
          </button>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cycles list */}
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4 lg:col-span-1">
          <h3 className="font-semibold text-slate-900">Audit Cycles</h3>
          {cycles.length === 0 ? (
            <p className="text-sm text-slate-500">No audit cycles created yet</p>
          ) : (
            <div className="space-y-2">
              {cycles.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCycle(c.id)}
                  className={`w-full text-left p-3 rounded-lg border text-sm transition hover:bg-slate-5 hover:border-slate-300 ${
                    selectedCycle?.id === c.id ? 'border-brand-500 bg-brand-50/20' : 'border-slate-200'
                  }`}
                >
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-500">Scope: {c.scopeType} | {c.startDate} to {c.endDate}</p>
                  <div className="mt-2">
                    <StatusBadge status={c.status} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Cycle detail */}
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-6 lg:col-span-2">
          {selectedCycle ? (
            <>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">{selectedCycle.name}</h2>
                  <p className="text-sm text-slate-500">
                    Scope: <span className="font-semibold uppercase">{selectedCycle.scopeType}</span> | Status: <span className="font-semibold uppercase">{selectedCycle.status}</span>
                  </p>
                </div>
                {selectedCycle.status === 'active' && isManagerOrAdmin && (
                  <button
                    onClick={handleCloseCycle}
                    className="rounded bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700"
                  >
                    Lock & Close Cycle
                  </button>
                )}
              </div>

              {/* Stats overview */}
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 font-medium">Pending</p>
                  <p className="text-lg font-bold text-slate-700">{pendingCount}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-xs text-emerald-600 font-medium">Verified</p>
                  <p className="text-lg font-bold text-emerald-700">{verifiedCount}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-xs text-orange-600 font-medium">Damaged</p>
                  <p className="text-lg font-bold text-orange-700">{damagedCount}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-xs text-red-600 font-medium">Missing</p>
                  <p className="text-lg font-bold text-red-700">{missingCount}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900">Assets In Scope</h3>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="min-w-full divide-y text-xs">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-3 py-2 text-left">Asset Tag</th>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Checked Status</th>
                        <th className="px-3 py-2 text-left">Checked By</th>
                        <th className="px-3 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700">
                      {selectedCycle.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 font-medium">{item.asset?.assetTag}</td>
                          <td className="px-3 py-2">{item.asset?.name}</td>
                          <td className="px-3 py-2">
                            <span className={`rounded px-1.5 py-0.5 text-xs font-medium uppercase ${
                              item.status === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                              item.status === 'missing' ? 'bg-red-100 text-red-800' :
                              item.status === 'damaged' ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {item.checkedBy ? `${item.checkedBy.firstName} ${item.checkedBy.lastName}` : 'N/A'}
                          </td>
                          <td className="px-3 py-2">
                            {selectedCycle.status === 'active' && (
                              <div className="flex gap-1">
                                <button type="button" onClick={() => handleAuditItem(item.id, 'verified')} className="text-emerald-600 hover:underline">Verify</button>
                                <button type="button" onClick={() => handleAuditItem(item.id, 'damaged')} className="text-orange-600 hover:underline">Damage</button>
                                <button type="button" onClick={() => handleAuditItem(item.id, 'missing')} className="text-red-600 hover:underline">Missing</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500 text-center py-12">Select an audit cycle from the list to view scope and execute audits</p>
          )}
        </div>
      </div>
    </div>
  );
}
