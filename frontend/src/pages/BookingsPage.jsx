import { useEffect, useState } from 'react';
import { bookingApi, assetApi } from '../services';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { CalendarRange, Clock, AlertTriangle } from 'lucide-react';

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookableAssets, setBookableAssets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ assetId: '', startTime: '', endTime: '' });
  const [error, setError] = useState('');

  const load = () => {
    assetApi.list({ limit: 100 }).then(({ data }) => {
      setBookableAssets(data.data.filter((a) => a.isBookable));
    });
    bookingApi.list().then(({ data }) => setBookings(data.data));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await bookingApi.create({
        assetId: Number(form.assetId),
        startTime: form.startTime,
        endTime: form.endTime,
      });
      setShowForm(false);
      setForm({ assetId: '', startTime: '', endTime: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Booking slot conflict or error');
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await bookingApi.cancel(id);
      load();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to cancel booking');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#E1E1DC] pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#14171C]">Resource Reservations</h1>
          <p className="text-sm text-[#5B6470] mt-1">Book shared conference rooms, workspaces, and testing hardware blocks</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm(!showForm);
            setError('');
          }}
          className="glow-btn text-xs uppercase tracking-wider"
        >
          {showForm ? 'Collapse Form' : '+ Request Reservation'}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Booking Form or resource timeline blocks */}
        <div className="lg:col-span-1 space-y-6">
          {showForm ? (
            <form onSubmit={handleSubmit} className="border border-[#E1E1DC] rounded-md bg-white p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-[#14171C] uppercase tracking-wider border-b pb-2 mb-2">Reserve Resource Slot</h3>
              {error && (
                <div className="rounded border border-red-200 bg-red-50 p-4 text-xs text-red-700 font-semibold flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold uppercase tracking-wide">Slot Conflict Rejected</p>
                    <p className="mt-1 font-medium">{error}</p>
                  </div>
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Select Resource</label>
                <select
                  value={form.assetId}
                  onChange={(e) => setForm({ ...form, assetId: e.target.value })}
                  className="w-full rounded border border-[#E1E1DC] px-3 py-2.5 text-sm focus:border-[#3D6FE0] focus:outline-none"
                  required
                >
                  <option value="">Select shared resource...</option>
                  {bookableAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.assetTag})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">Start Date/Time</label>
                  <input
                    type="datetime-local"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full rounded border border-[#E1E1DC] px-3 py-2 text-sm focus:border-[#3D6FE0] focus:outline-none mono-text"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#5B6470] uppercase">End Date/Time</label>
                  <input
                    type="datetime-local"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full rounded border border-[#E1E1DC] px-3 py-2 text-sm focus:border-[#3D6FE0] focus:outline-none mono-text"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="glow-btn w-full text-xs py-2.5 uppercase tracking-wider">
                Confirm Booking
              </button>
            </form>
          ) : (
            <div className="border border-[#E1E1DC] rounded-md bg-white p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-[#14171C] uppercase tracking-wider border-b pb-2">Active Resources</h3>
              <p className="text-xs text-[#5B6470]">List of shared bookable spaces & hardware tag blocks.</p>
              <div className="space-y-2">
                {bookableAssets.map((a) => (
                  <div key={a.id} className="flex justify-between items-center text-xs border border-[#E1E1DC] rounded p-3 bg-[#F5F6F4]/40">
                    <div>
                      <p className="font-bold text-[#14171C]">{a.name}</p>
                      <p className="text-[10px] text-[#5B6470] mt-0.5">{a.location?.name || 'Main Office'}</p>
                    </div>
                    <span className="asset-tag-chip">{a.assetTag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Timeline colored blocks list of Bookings */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-sm text-[#14171C] uppercase tracking-wider">Reservation Calendar Feed</h3>
          
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <div className="border border-[#E1E1DC] rounded-md bg-white p-8 text-center text-xs text-[#5B6470]">
                No active or upcoming reservations recorded.
              </div>
            ) : (
              bookings.map((b) => (
                <div key={b.id} className="border border-[#E1E1DC] rounded-md bg-white p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 border border-[#E1E1DC] rounded bg-[#F5F6F4]">
                      <CalendarRange className="h-5 w-5 text-[#3D6FE0]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="asset-tag-chip">{b.asset?.assetTag}</span>
                        <p className="font-bold text-[#14171C] text-sm">{b.asset?.name}</p>
                      </div>
                      <p className="text-xs text-[#5B6470] font-semibold">Reservee: {b.user?.firstName} {b.user?.lastName}</p>
                      <p className="text-[10px] text-[#5B6470] flex items-center gap-1 mt-1 font-medium">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span className="mono-text">{new Date(b.startTime).toLocaleString()}</span>
                        <span>➔</span>
                        <span className="mono-text">{new Date(b.endTime).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col sm:items-end justify-between items-center gap-2">
                    <StatusBadge status={b.status} />
                    {b.status === 'upcoming' && (b.userId === user?.id || user?.roles?.some(r => r.name === 'super_admin')) && (
                      <button
                        type="button"
                        onClick={() => handleCancel(b.id)}
                        className="text-rose-600 hover:underline font-bold text-xs cursor-pointer"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
