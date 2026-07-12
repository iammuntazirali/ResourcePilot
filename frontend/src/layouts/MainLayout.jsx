import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MainLayout() {
  const { user, roles, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = roles.includes('super_admin');
  const isAuditor = roles.includes('auditor');
  const isManager = roles.includes('asset_manager');

  const navItems = [
    { to: '/', label: 'Dashboard', icon: '📊' },
    { to: '/assets', label: 'Assets', icon: '💻' },
    { to: '/requests', label: 'Requests', icon: '📋' },
    { to: '/assignments', label: 'Assignments', icon: '🔄' },
    { to: '/bookings', label: 'Bookings', icon: '📅' },
    { to: '/maintenance', label: 'Maintenance', icon: '🔧' },
  ];

  if (isAdmin || isAuditor) {
    navItems.push({ to: '/audits', label: 'Auditing', icon: '🔍' });
  }

  if (isAdmin || isManager || isAuditor) {
    navItems.push({ to: '/reports', label: 'Analytics', icon: '📈' });
  }

  if (isAdmin) {
    navItems.push({ to: '/org-setup', label: 'Org Setup', icon: '⚙️' });
  }

  navItems.push({ to: '/activity', label: 'Activity & Logs', icon: '🔔' });

  return (
    <div className="flex min-h-screen">
      <aside className="fixed flex h-full w-64 flex-col bg-sidebar text-white">
        <div className="border-b border-slate-700 px-6 py-5">
          <h1 className="text-xl font-bold tracking-tight">AssetFlow</h1>
          <p className="text-xs text-slate-400">Enterprise Asset Management</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-700 p-4">
          <div className="mb-3 truncate text-sm font-medium">
            {user?.firstName} {user?.lastName}
          </div>
          <div className="mb-3 truncate text-xs text-slate-400">{user?.email}</div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-8 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Odoo Hackathon</p>
              <h2 className="text-lg font-semibold text-slate-900">Asset & Resource Management</h2>
            </div>
          </div>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
