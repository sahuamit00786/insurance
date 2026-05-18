import { useEffect } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import useAuthStore from '../../store/authStore';
import { getMe } from '../../api/auth';
import { LayoutProvider, useLayout } from '../../context/LayoutContext';
import useAppointmentReminder from '../../hooks/useAppointmentReminder';

const BREADCRUMBS = {
  '/dashboard': [{ label: 'Dashboard' }],
  '/clients':   [{ label: 'Clients' }],
  '/staff':     [{ label: 'Staff Management' }],
  '/lookup':    [{ label: 'Lookup Settings' }],
  '/reports':   [{ label: 'Reports' }],
  '/templates':  [{ label: 'Message Templates' }],
  '/insurances': [{ label: 'Insurances' }],
};

function LayoutShell() {
  const { token, setAuth, logout } = useAuthStore();
  const { pathname } = useLocation();
  const { sidebarOpen, closeSidebar } = useLayout();
  useAppointmentReminder();
  useEffect(() => {
    if (!token) return;
    getMe()
      .then(r => setAuth(r.data.data.user, token, r.data.data.permissions))
      .catch(() => logout());
  }, [token]);

  useEffect(() => {
    closeSidebar();
  }, [pathname, closeSidebar]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  if (!token) return <Navigate to="/login" replace />;

  const base = Object.keys(BREADCRUMBS).find(k => pathname.startsWith(k));
  let crumbs = base ? [...BREADCRUMBS[base]] : [{ label: 'InsurVault' }];

  if (pathname.match(/^\/clients\/\d+/)) {
    crumbs = [
      { label: 'Clients', href: '/clients' },
      { label: 'Client Details' },
    ];
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden animate-fade-in"
          onClick={closeSidebar}
        />
      )}

      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen min-w-0 lg:ml-[260px]">
        <Header crumbs={crumbs} />
        <main className="flex-1 pt-[60px] min-w-0 overflow-x-hidden">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 sm:py-6 animate-fade-in min-w-0 w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Layout() {
  return (
    <LayoutProvider>
      <LayoutShell />
    </LayoutProvider>
  );
}
