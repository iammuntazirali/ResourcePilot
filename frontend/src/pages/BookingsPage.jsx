import { useEffect, useState } from 'react';
import { bookingApi, assetApi } from '../services';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookableAssets, setBookableAssets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ assetId: '', startTime: '', endTime: '' });
  const [error, setError] = useState('');

  const load = () => {
    // List bookable assets
    assetApi.list({ limit: 100 }).then(({ data }) => {
      setBookableAssets(data.data.filter((a) => a.isBookable));
    });
    // List all bookings
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Resource Bookings</h1>
          <p className="text-slate-500">Book shared resources (meeting rooms, projectors, vehicles, etc.)</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm(!showForm);
            setError('');
          }}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700"
        >
          {showForm ? 'Cancel' : '+ Book Resource'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 shadow-sm space-y-4 max-w-lg">
          <h3 className="font-semibold text-slate-950">Book a Resource Time Slot</h3>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Resource / Asset</label>
            <select
              value={form.assetId}
              onChange={(e) => setForm({ ...form, assetId: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              required
            >
              <option value="">Select shared resource...</option>
              {bookableAssets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.assetTag} — {a.name} ({a.location?.name || 'No location'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Start Date/Time</label>
              <input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">End Date/Time</label>
              <input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700">
            Confirm Booking
          </button>
        </form>
      )}

      {/* Bookings List */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="min-w-full divide-y text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left">Resource</th>
              <th className="px-4 py-3 text-left">Booked By</th>
              <th className="px-4 py-3 text-left">Time Slot</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No active or upcoming bookings
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {b.asset?.assetTag} — {b.asset?.name}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {b.user?.firstName} {b.user?.lastName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(b.startTime).toLocaleString()} - {new Date(b.endTime).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-4 py-3">
                    {b.status === 'upcoming' && (b.userId === user?.id || user?.roles?.includes('super_admin')) && (
                      <button
                        type="button"
                        onClick={() => handleCancel(b.id)}
                        className="text-red-600 hover:underline font-medium text-xs"
                      >
                        Cancel
                      </button>
                    )}
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
