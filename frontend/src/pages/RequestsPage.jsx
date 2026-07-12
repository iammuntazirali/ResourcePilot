import { useEffect, useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import { assignmentApi, assetApi } from '../services';
import { useAuth } from '../context/AuthContext';
import { FileText, AlertTriangle, ArrowRight, CheckCircle, Clock } from 'lucide-react';

export default function RequestsPage() {
  const { hasPermission } = useAuth();
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ purpose: '', assetId: '', neededFrom: '', submit: true });

  const load = () => {
    assignmentApi.listRequests().then(({ data }) => setRequests(data.data));
  };

  useEffect(() => {
    load();
    // Fetch all assets (both in_stock and assigned) to support transfer requests
    assetApi.list({ limit: 100 }).then(({ data }) => setAssets(data.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await assignmentApi.createRequest({
        ...form,
        assetId: form.assetId ? Number(form.assetId) : undefined,
        submit: true,
      });
      setShowForm(false);
      setForm({ purpose: '', assetId: '', neededFrom: '', submit: true });
      load();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to submit request');
    }
  };

  const handleApprove = async (req) => {
    const assetId = req.assetId || assets[0]?.id;
    if (!assetId) return alert('No available asset to assign');
    try {
      await assignmentApi.approveRequest(req.id, { assetId });
      load();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Approval failed');
    }
  };

  const handleReject = async (req) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try {
      await assignmentApi.rejectRequest(req.id, reason);
      load();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Rejection failed');
    }
  };

  const selectedAsset = assets.find(a => a.id === Number(form.assetId));
  const isConflict = selectedAsset && selectedAsset.status === 'assigned';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#E1E1DC] pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#14171C]">Assignment Requests</h1>
          <p className="text-sm text-[#5B6470] mt-1">Submit allocation requests, approve department hand-backs, or initiate transfers</p>
        </div>
        {hasPermission('assignment.request') && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="glow-btn text-xs uppercase tracking-wider"
          >
            {showForm ? 'Collapse Form' : '+ New Request'}
          </button>
        )}
      </div>

      {/* Transfer Stepper Visualization Banner */}
      <div className="border border-[#E1E1DC] rounded-md bg-white p-4 shadow-sm">
        <h4 className="text-xs font-bold text-[#5B6470] uppercase tracking-wider mb-3">Asset Allocation Workflow Stepper</h4>
        <div className="flex items-center justify-around text-xs max-w-lg">
          <div className="flex items-center gap-1.5 text-[#3D6FE0] font-bold">
            <Clock className="h-4 w-4" /> <span>Requested</span>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-350" />
          <div className="flex items-center gap-1.5 text-[#E3A72E] font-bold">
            <CheckCircle className="h-4 w-4" /> <span>Approved</span>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-350" />
          <div className="flex items-center gap-1.5 text-[#2E8B57] font-bold">
            <CheckCircle className="h-4 w-4" /> <span>Re-allocated</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Create form with inline conflicts alert card */}
        <div className="lg:col-span-1 space-y-6">
          {showForm && (
            <form onSubmit={handleSubmit} className="border border-[#E1E1DC] bg-white rounded-md p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-[#14171C] uppercase tracking-wider border-b pb-2 mb-2">Create Request</h3>
              
              <div>
                <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Purpose / Business Case</label>
                <textarea
                  placeholder="Justify need for this asset allocation..."
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  className="w-full rounded border border-[#E1E1DC] px-3 py-2 text-sm focus:border-[#3D6FE0] focus:outline-none"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Select Asset</label>
                <select
                  value={form.assetId}
                  onChange={(e) => setForm({ ...form, assetId: e.target.value })}
                  className="w-full rounded border border-[#E1E1DC] px-3 py-2.5 text-sm focus:border-[#3D6FE0] focus:outline-none"
                >
                  <option value="">Select asset (optional)...</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.assetTag}) — {a.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conflict State inline warning card */}
              {isConflict && (
                <div className="rounded border border-[#C0392B]/20 bg-[#C0392B]/5 p-4 space-y-3">
                  <div className="flex items-start gap-2 text-xs text-red-800">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold uppercase tracking-wide">Allocation Conflict</p>
                      <p className="mt-1 font-medium leading-relaxed">
                        This asset is currently held by <strong>{selectedAsset.assignedTo?.firstName || 'another user'}</strong>. Direct allocation is blocked.
                      </p>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded bg-[#E3A72E] text-white font-bold text-xs uppercase tracking-wider py-2 hover:bg-[#c58d20] cursor-pointer shadow-sm"
                  >
                    Request Transfer
                  </button>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Needed From Date</label>
                <input
                  type="date"
                  value={form.neededFrom}
                  onChange={(e) => setForm({ ...form, neededFrom: e.target.value })}
                  className="w-full rounded border border-[#E1E1DC] px-3 py-2 text-sm focus:border-[#3D6FE0] focus:outline-none mono-text"
                  required
                />
              </div>

              {!isConflict && (
                <button type="submit" className="glow-btn w-full text-xs py-2.5 uppercase tracking-wider">
                  Submit Allocation Request
                </button>
              )}
            </form>
          )}
        </div>

        {/* Right Side: Requests lists */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-sm text-[#14171C] uppercase tracking-wider">Active Requests Feed</h3>
          
          <div className="overflow-hidden border border-[#E1E1DC] rounded-md bg-white shadow-sm">
            <table className="table-industrial text-xs">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left">Request Code</th>
                  <th className="px-4 py-3 text-left">Requester</th>
                  <th className="px-4 py-3 text-left">Purpose</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#F5F6F4]/30">
                    <td className="px-4 py-3">
                      <span className="asset-tag-chip">{req.requestNumber}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#14171C]">
                      {req.requester?.firstName} {req.requester?.lastName}
                    </td>
                    <td className="px-4 py-3 text-[#5B6470] max-w-xs truncate font-medium">{req.purpose}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-4 py-3">
                      {req.status === 'submitted' && hasPermission('assignment.approve') && (
                        <div className="flex gap-2">
                          <button type="button" onClick={() => handleApprove(req)} className="text-[#2E8B57] font-bold hover:underline">Approve</button>
                          <button type="button" onClick={() => handleReject(req)} className="text-rose-600 font-bold hover:underline">Reject</button>
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
    </div>
  );
}
