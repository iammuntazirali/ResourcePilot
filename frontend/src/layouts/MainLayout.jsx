import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Laptop,
  FileText,
  ClipboardList,
  CalendarRange,
  Wrench,
  ShieldCheck,
  BarChart3,
  Settings,
  Bell,
  LogOut,
} from 'lucide-react';

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
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/assets', label: 'Assets', icon: Laptop },
    { to: '/requests', label: 'Requests', icon: FileText },
    { to: '/assignments', label: 'Assignments', icon: ClipboardList },
    { to: '/bookings', label: 'Bookings', icon: CalendarRange },
    { to: '/maintenance', label: 'Maintenance', icon: Wrench },
  ];

  if (isAdmin || isAuditor) {
    navItems.push({ to: '/audits', label: 'Auditing', icon: ShieldCheck });
  }

  if (isAdmin || isManager || isAuditor) {
    navItems.push({ to: '/reports', label: 'Analytics', icon: BarChart3 });
  }

  if (isAdmin) {
    navItems.push({ to: '/org-setup', label: 'Org Setup', icon: Settings });
  }

  navItems.push({ to: '/activity', label: 'Activity & Logs', icon: Bell });

  return (
    <div className="flex min-h-screen">
      <aside className="fixed flex h-full w-64 flex-col bg-sidebar text-white shadow-2xl">
        <div className="border-b border-slate-800 px-6 py-6 flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Asset<span className="text-brand-500">Flow</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Enterprise Resource ERP
          </p>
        </div>
        
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-[0_4px_12px_rgba(124,58,237,0.25)] border-l-4 border-brand-100'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`
                }
              >
                <Icon className="h-5 w-5 opacity-90 transition-transform duration-200" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-850 bg-slate-950/40 p-5 space-y-4">
          <div className="flex flex-col gap-0.5">
            <div className="truncate text-sm font-bold text-slate-100">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="truncate text-xs text-slate-500 font-medium">{user?.email}</div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition duration-200 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1 bg-surface p-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
