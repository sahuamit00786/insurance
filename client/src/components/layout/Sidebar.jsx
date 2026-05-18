import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCog, Settings,
  BarChart3, MessageSquare, ShieldCheck, X,
} from 'lucide-react';

import useAuthStore from '../../store/authStore';
import { useLayout } from '../../context/LayoutContext';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' },
    ],
  },
  {
    label: 'Management',
    items: [
      { path: '/clients',    label: 'Clients',    icon: Users,        module: 'clients' },
      { path: '/insurances', label: 'Policy Details', icon: ShieldCheck,  module: 'insurances' },
      { path: '/staff',      label: 'Staff',      icon: UserCog,      module: 'staff'   },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { path: '/lookup',    label: 'Lookup',    icon: Settings,      module: 'lookup', adminOnly: true },
      { path: '/reports',   label: 'Reports',   icon: BarChart3,     module: 'reports' },
      { path: '/templates', label: 'Templates', icon: MessageSquare, module: 'templates' },
    ],
  },
];

export default function Sidebar() {
  const { user, hasPermission } = useAuthStore();
  const { sidebarOpen, closeSidebar } = useLayout();

  const initials = user?.name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '??';

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full w-[260px] max-w-[85vw] flex flex-col z-50
        bg-sidebar border-r border-sidebar-border
        transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:z-40
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      aria-hidden={!sidebarOpen ? undefined : false}
    >
      <div className="relative flex items-center justify-center px-5 pt-2 pb-0 h-[100px] border-b border-sidebar-border shrink-0">
        <img src="/logo.png" alt="InsurVault" className="h-[158px] w-[158px] object-contain" style={{ filter: 'saturate(1.4) brightness(1.1) contrast(1.05)' }} />
        <button
          type="button"
          onClick={closeSidebar}
          className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 overscroll-contain">
        {NAV_GROUPS.map(({ label, items }) => {
          const visible = items.filter(({ module, adminOnly }) => {
            if (adminOnly && user?.email !== 'admin@insurance.com') return false;
            return user?.role === 'admin' || hasPermission(module, 'view');
          });
          if (visible.length === 0) return null;
          return (
            <div key={label}>
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                {label}
              </p>
              <div className="space-y-0.5">
                {visible.map(({ path, label: lbl, icon: Icon }) => (
                  <NavLink
                    key={path}
                    to={path}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                        isActive
                          ? 'bg-brand-600/20 text-white'
                          : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={17}
                          className={`shrink-0 ${isActive ? 'text-brand-300' : 'text-white/50'}`}
                        />
                        <span>{lbl}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="relative shrink-0">
            <div className="avatar avatar-md">{initials}</div>
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 border-2 border-sidebar" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate leading-tight">{user?.name}</p>
            <p className="text-white/40 text-xs capitalize mt-0.5">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
