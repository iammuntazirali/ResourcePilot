import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { assetApi } from '../services';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ArrowRight, User, Calendar, MapPin, Activity } from 'lucide-react';

export default function AssetDetailPage() {
  const { id } = useParams();
  const { hasPermission } = useAuth();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    assetApi
      .getById(id)
      .then(({ data }) => setAsset(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleTransition = async (toStatus) => {
    const reason = prompt(`Reason for transition to ${toStatus}:`);
    if (reason === null) return;
    try {
      await assetApi.transition(id, toStatus, reason);
      load();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Transition failed');
    }
  };

  if (loading) return <div className="text-[#5B6470] font-bold p-6">Loading asset details...</div>;
  if (!asset) return <div className="p-6 text-sm text-[#C0392B] font-bold">Asset not found in registry</div>;

  const transitions = {
    in_stock: ['assigned', 'under_maintenance', 'retired'],
    assigned: ['in_stock', 'under_maintenance', 'lost'],
    under_maintenance: ['in_stock', 'assigned', 'retired'],
    draft: ['in_stock'],
    lost: ['retired'],
    retired: ['disposed'],
  };

  const available = transitions[asset.status] || [];

  return (
    <div className="space-y-6">
      <div>
        <Link to="/assets" className="text-xs text-[#3D6FE0] hover:underline font-bold uppercase tracking-wider flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" /> Back to Catalog
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="asset-tag-chip text-sm py-1 px-3">{asset.assetTag}</span>
          <h1 className="text-2xl font-extrabold text-[#14171C]">{asset.name}</h1>
          <StatusBadge status={asset.status} />
        </div>
        <p className="text-xs text-[#5B6470] mt-1.5 mono-text font-semibold">Serial #: {asset.serialNumber || 'N/A'}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Details and History columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <div className="border border-[#E1E1DC] rounded-md bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#14171C] uppercase tracking-wider border-b pb-3 mb-4">Registry Specifications</h3>
            
            <dl className="grid gap-4 sm:grid-cols-2 text-xs">
              <div className="border border-[#E1E1DC]/60 rounded p-3 bg-[#F5F6F4]/30">
                <dt className="text-[10px] font-bold text-[#5B6470] uppercase">Category</dt>
                <dd className="font-bold text-[#14171C] mt-1 text-sm">{asset.category?.name || 'Uncategorized'}</dd>
              </div>
              <div className="border border-[#E1E1DC]/60 rounded p-3 bg-[#F5F6F4]/30">
                <dt className="text-[10px] font-bold text-[#5B6470] uppercase">Current Condition</dt>
                <dd className="font-bold text-[#14171C] mt-1 text-sm capitalize">{asset.condition}</dd>
              </div>
              <div className="border border-[#E1E1DC]/60 rounded p-3 bg-[#F5F6F4]/30">
                <dt className="text-[10px] font-bold text-[#5B6470] uppercase">Cost Center Dept</dt>
                <dd className="font-bold text-[#14171C] mt-1 text-sm">{asset.department?.name || 'Unassigned'}</dd>
              </div>
              <div className="border border-[#E1E1DC]/60 rounded p-3 bg-[#F5F6F4]/30">
                <dt className="text-[10px] font-bold text-[#5B6470] uppercase">Current Location</dt>
                <dd className="font-bold text-[#14171C] mt-1 text-sm flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>{asset.location?.name || 'Main Office'}</span>
                </dd>
              </div>
              <div className="border border-[#E1E1DC]/60 rounded p-3 bg-[#F5F6F4]/30">
                <dt className="text-[10px] font-bold text-[#5B6470] uppercase">Acquisition Cost</dt>
                <dd className="font-bold text-[#14171C] mt-1 text-sm mono-text">₹{Number(asset.purchaseCost || 0).toLocaleString('en-IN')}</dd>
              </div>
              <div className="border border-[#E1E1DC]/60 rounded p-3 bg-[#F5F6F4]/30">
                <dt className="text-[10px] font-bold text-[#5B6470] uppercase">Custodian Assignee</dt>
                <dd className="font-bold text-[#14171C] mt-1 text-sm flex items-center gap-1.5">
                  <User className="h-4 w-4 text-slate-400" />
                  <span>{asset.assignedTo ? `${asset.assignedTo.firstName} ${asset.assignedTo.lastName}` : 'Unassigned'}</span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Timeline History Card */}
          <div className="border border-[#E1E1DC] rounded-md bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-[#14171C] uppercase tracking-wider border-b pb-3 mb-5 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-[#3D6FE0]" /> Operations State History
            </h3>
            
            <div className="relative border-l border-[#E1E1DC] pl-6 ml-3 space-y-6">
              {(asset.statusHistory || []).map((h) => (
                <div key={h.id} className="relative">
                  {/* Timeline point */}
                  <span className="absolute -left-8 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white border border-[#E1E1DC] text-[8px] font-bold text-[#5B6470]">
                    ●
                  </span>
                  
                  <div className="space-y-1 bg-[#F5F6F4]/30 border border-[#E1E1DC]/60 rounded p-3 text-xs">
                    <div className="flex items-center gap-2 font-bold text-[#14171C] uppercase tracking-wide">
                      <span className="text-slate-400">{h.fromStatus || 'Created'}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-[#3D6FE0]">{h.toStatus}</span>
                    </div>
                    <p className="text-[10px] text-[#5B6470] font-semibold mt-0.5">
                      Changer: {h.changer?.firstName} {h.changer?.lastName || 'System'} | <span className="mono-text">{new Date(h.createdAt).toLocaleString()}</span>
                    </p>
                    {h.reason && (
                      <p className="mt-2 p-2 bg-white rounded border border-[#E1E1DC]/40 text-[#5B6470] font-medium leading-relaxed italic">
                        "{h.reason}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Actions column */}
        <div className="space-y-4">
          {hasPermission('asset.transition') && available.length > 0 && (
            <div className="border border-[#E1E1DC] rounded-md bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#14171C] uppercase tracking-wider border-b pb-2">Transitions Control</h3>
              <div className="space-y-2">
                {available.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleTransition(s)}
                    className="w-full rounded border border-[#E1E1DC] px-4 py-2.5 text-left text-xs font-bold text-[#14171C] bg-[#F5F6F4]/50 hover:bg-[#F5F6F4] hover:border-[#5B6470] transition uppercase tracking-wider cursor-pointer"
                  >
                    Move to {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
