import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { assetApi, masterApi } from '../services';
import { useAuth } from '../context/AuthContext';
import { Filter, Search } from 'lucide-react';

export default function AssetsPage() {
  const { hasPermission } = useAuth();
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState({});
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Registration Form
  const [form, setForm] = useState({ assetTag: '', name: '', categoryId: '', serialNumber: '', condition: 'excellent', isBookable: false });

  const loadAssets = () => {
    setLoading(true);
    assetApi
      .list({ search, status, categoryId: categoryId || undefined, limit: 50 })
      .then(({ data }) => {
        setAssets(data.data);
        setMeta(data.meta);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAssets();
    masterApi.categories().then(({ data }) => setCategories(data.data));
  }, [search, status, categoryId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await assetApi.create({
        ...form,
        categoryId: Number(form.categoryId),
        status: 'in_stock',
      });
      setShowForm(false);
      setForm({ assetTag: '', name: '', categoryId: '', serialNumber: '', condition: 'excellent', isBookable: false });
      loadAssets();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to create asset');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E1E1DC] pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#14171C]">Asset Catalog Directory</h1>
          <p className="text-sm text-[#5B6470] mt-1">{meta.total || 0} active physical hardware labels logged</p>
        </div>
        {hasPermission('asset.create') && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="glow-btn text-xs uppercase tracking-wider"
          >
            {showForm ? 'Collapse Form' : '+ Register Asset'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="border border-[#E1E1DC] bg-white rounded-md p-6 shadow-sm space-y-4 max-w-xl">
          <h3 className="font-bold text-sm text-[#14171C] uppercase tracking-wider border-b pb-2 mb-2">Register Hardware Asset</h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Asset Tag</label>
              <input
                placeholder="e.g. AF-0012"
                value={form.assetTag}
                onChange={(e) => setForm({ ...form, assetTag: e.target.value })}
                className="w-full rounded border border-[#E1E1DC] px-3 py-2 text-sm focus:border-[#3D6FE0] focus:outline-none mono-text"
                required
              />
              {form.assetTag && (
                <div className="mt-2 p-2 bg-[#F5F6F4]/50 border border-dashed rounded flex items-center gap-2">
                  <span className="text-[9px] font-bold text-[#5B6470] uppercase">Tag Preview:</span>
                  <span className="asset-tag-chip">{form.assetTag.toUpperCase()}</span>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Asset Name</label>
              <input
                placeholder="e.g. MacBook Pro 16"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded border border-[#E1E1DC] px-3 py-2 text-sm focus:border-[#3D6FE0] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Hardware Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full rounded border border-[#E1E1DC] px-3 py-2.5 text-sm focus:border-[#3D6FE0] focus:outline-none"
                required
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Serial / Manufacturer Code</label>
              <input
                placeholder="Serial Number"
                value={form.serialNumber}
                onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                className="w-full rounded border border-[#E1E1DC] px-3 py-2 text-sm focus:border-[#3D6FE0] focus:outline-none mono-text"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isBookable"
              checked={form.isBookable}
              onChange={(e) => setForm({ ...form, isBookable: e.target.checked })}
              className="rounded border-[#E1E1DC] text-[#3D6FE0] focus:ring-[#3D6FE0]"
            />
            <label htmlFor="isBookable" className="text-xs font-bold text-[#14171C] uppercase tracking-wide">
              Mark as shared bookable resource
            </label>
          </div>

          <button type="submit" className="glow-btn text-xs py-2.5 uppercase tracking-wider">
            Confirm Registry
          </button>
        </form>
      )}

      {/* Split filter and table layout */}
      <div className="grid gap-6 lg:grid-cols-4 items-start">
        {/* Left filter side pane */}
        <div className="border border-[#E1E1DC] rounded-md bg-white p-5 space-y-4 lg:col-span-1 shadow-sm">
          <h3 className="font-bold text-xs text-[#14171C] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
            <Filter className="h-4 w-4 text-[#3D6FE0]" /> Catalog Filters
          </h3>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-[10px] font-bold text-[#5B6470] uppercase">Search Label/Tag</label>
              <div className="relative">
                <input
                  placeholder="Tag or Serial..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded border border-[#E1E1DC] pl-8 pr-3 py-2 text-xs focus:border-[#3D6FE0] focus:outline-none"
                />
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold text-[#5B6470] uppercase">Lifecycle Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded border border-[#E1E1DC] px-2 py-2 text-xs focus:border-[#3D6FE0] bg-white text-[#14171C] font-semibold"
              >
                <option value="">All Statuses</option>
                <option value="in_stock">Available</option>
                <option value="assigned">Allocated</option>
                <option value="under_maintenance">Under Maintenance</option>
                <option value="lost">Lost / Damaged</option>
                <option value="retired">Retired / Disposed</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold text-[#5B6470] uppercase">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded border border-[#E1E1DC] px-2 py-2 text-xs focus:border-[#3D6FE0] bg-white text-[#14171C] font-semibold"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Data Grid Table */}
        <div className="lg:col-span-3 overflow-hidden border border-[#E1E1DC] rounded-md bg-white shadow-sm">
          <table className="table-industrial text-xs">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">Label Tag</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Lifecycle Status</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Condition</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#5B6470] font-bold uppercase tracking-wider">
                    Searching catalog...
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#5B6470] font-bold uppercase tracking-wider">
                    No hardware assets found
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-[#F5F6F4]/30">
                    <td className="px-4 py-3">
                      <Link to={`/assets/${asset.id}`} className="hover:opacity-85">
                        <span className="asset-tag-chip">{asset.assetTag}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#14171C]">{asset.name}</td>
                    <td className="px-4 py-3 text-[#5B6470]">{asset.category?.name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={asset.status} />
                    </td>
                    <td className="px-4 py-3 text-[#5B6470]">{asset.location?.name || 'Main Office'}</td>
                    <td className="px-4 py-3 capitalize text-[#5B6470] font-semibold">{asset.condition}</td>
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
