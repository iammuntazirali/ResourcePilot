const STATUS_COLORS = {
  // Asset states
  in_stock: 'chip-available',
  assigned: 'chip-allocated',
  under_maintenance: 'chip-maintenance',
  lost: 'chip-lost-damaged',
  damaged: 'chip-lost-damaged',
  retired: 'chip-disposed',
  disposed: 'chip-disposed',

  // Request / Assignment states
  draft: 'bg-slate-100 text-slate-700 border border-slate-200',
  submitted: 'bg-[#3d6fe0]/10 text-[#3d6fe0] border border-[#3d6fe0]/20',
  approved: 'bg-[#2e8b57]/10 text-[#2e8b57] border border-[#2e8b57]/20',
  rejected: 'bg-[#c0392b]/10 text-[#c0392b] border border-[#c0392b]/20',
  active: 'bg-[#3d6fe0]/10 text-[#3d6fe0] border border-[#3d6fe0]/20',
  returned: 'bg-[#2e8b57]/10 text-[#2e8b57] border border-[#2e8b57]/20',
  overdue: 'bg-[#d9622b]/10 text-[#d9622b] border border-[#d9622b]/20',
  
  // Bookings
  upcoming: 'chip-reserved',
  ongoing: 'chip-allocated',
  completed: 'chip-available',
  cancelled: 'chip-disposed',
};

const DOT_COLORS = {
  in_stock: 'dot-available',
  assigned: 'dot-allocated',
  under_maintenance: 'dot-maintenance',
  lost: 'dot-lost-damaged',
  damaged: 'dot-lost-damaged',
  retired: 'dot-disposed',
  disposed: 'dot-disposed',
  upcoming: 'dot-reserved',
  ongoing: 'dot-allocated',
  completed: 'dot-available',
  cancelled: 'dot-disposed',
};

export default function StatusBadge({ status }) {
  const label = status?.replace(/_/g, ' ') || 'unknown';
  const colors = STATUS_COLORS[status] || 'bg-slate-100 text-slate-700 border border-slate-200';
  const dotColor = DOT_COLORS[status];

  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold capitalize ${colors}`}>
      {dotColor && <span className={`status-dot ${dotColor}`} />}
      {label}
    </span>
  );
}
