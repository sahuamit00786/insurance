import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, ChevronDown, ChevronRight, UserCog, Menu } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import ProfileModal from './ProfileModal';
import { useLayout } from '../../context/LayoutContext';

const ROLE_STYLES = {
  admin:   'bg-violet-50 text-violet-700 ring-violet-600/10',
  manager: 'bg-brand-50 text-brand-700 ring-brand-600/10',
  staff:   'bg-slate-100 text-slate-600 ring-slate-500/10',
};

export default function Header({ crumbs = [] }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { toggleSidebar } = useLayout();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = user?.name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '??';
  const roleStyle = ROLE_STYLES[user?.role] || ROLE_STYLES.staff;

  return (
    <header className="fixed top-0 left-0 lg:left-[260px] right-0 h-[60px] z-30 flex items-center justify-between gap-2 px-3 sm:px-6 bg-white border-b border-slate-200/80">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          type="button"
          onClick={toggleSidebar}
          className="lg:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-3 min-w-0">
          <span className="font-bold text-slate-900 text-base tracking-tight shrink-0">InsurVault</span>
          <nav className="flex items-center gap-1 min-w-0 overflow-hidden" aria-label="Breadcrumb">
            {crumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1 min-w-0">
                <ChevronRight size={12} className="text-slate-300 shrink-0" />
                {crumb.href ? (
                  <Link
                    to={crumb.href}
                    className="text-sm font-medium text-slate-500 hover:text-brand-700 transition truncate"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-slate-900 truncate">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
<div ref={ref} className="relative">
          <button
            type="button"
            onClick={() => setOpen(p => !p)}
            className="flex items-center gap-2 rounded-lg pl-1 pr-2 py-1 hover:bg-slate-50 transition border border-transparent hover:border-slate-200/80"
          >
            <div className="avatar avatar-md">{initials}</div>
            <div className="text-left hidden sm:block max-w-[120px] md:max-w-none">
              <p className="text-sm font-medium text-slate-800 leading-tight truncate">{user?.name}</p>
              <p className={`text-[10px] font-medium capitalize mt-0.5 px-1.5 py-0.5 rounded ring-1 inline-block truncate max-w-full ${roleStyle}`}>
                {user?.role}
              </p>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-1.5rem)] bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 z-50 animate-slide-down">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
              </div>
              <div className="px-2 py-1">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setProfileOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition"
                >
                  <UserCog size={15} />
                  Edit profile
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </header>
  );
}
