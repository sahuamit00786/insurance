import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import Layout          from './components/layout/Layout';
import LoginPage       from './pages/auth/LoginPage';
import DashboardPage   from './pages/dashboard/DashboardPage';
import ClientsPage     from './pages/clients/ClientsPage';
import ClientDetailPage from './pages/clients/ClientDetailPage';
import StaffPage       from './pages/staff/StaffPage';
import LookupPage      from './pages/lookup/LookupPage';
import ReportsPage     from './pages/reports/ReportsPage';
import TemplatesPage    from './pages/templates/TemplatesPage';
import InsurancesPage  from './pages/insurances/InsurancesPage';
import useAuthStore    from './store/authStore';

const MODULE_PATHS = [
  { module: 'dashboard',  path: '/dashboard'  },
  { module: 'clients',    path: '/clients'    },
  { module: 'insurances', path: '/insurances' },
  { module: 'staff',      path: '/staff'      },
  { module: 'lookup',     path: '/lookup'     },
  { module: 'reports',    path: '/reports'    },
  { module: 'templates',  path: '/templates'  },
];

function SmartRedirect() {
  const { user, permissions, hasPermission } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin' || user.role === 'superadmin') return <Navigate to="/dashboard" replace />;
  if (permissions.length === 0) return null;
  const first = MODULE_PATHS.find(({ module }) => hasPermission(module, 'view'));
  return <Navigate to={first ? first.path : '/login'} replace />;
}

function RequirePermission({ module, children }) {
  const { user, permissions, hasPermission } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin' || user.role === 'superadmin') return children;
  if (permissions.length === 0) return null;
  if (!hasPermission(module, 'view')) return <SmartRedirect />;
  return children;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage/>}/>
          <Route element={<Layout/>}>
            <Route index element={<SmartRedirect/>}/>
            <Route path="/dashboard"   element={<RequirePermission module="dashboard"><DashboardPage/></RequirePermission>}/>
            <Route path="/clients"     element={<RequirePermission module="clients"><ClientsPage/></RequirePermission>}/>
            <Route path="/clients/:id" element={<RequirePermission module="clients"><ClientDetailPage/></RequirePermission>}/>
            <Route path="/staff"       element={<RequirePermission module="staff"><StaffPage/></RequirePermission>}/>
            <Route path="/lookup"      element={<RequirePermission module="lookup"><LookupPage/></RequirePermission>}/>
            <Route path="/reports"     element={<RequirePermission module="reports"><ReportsPage/></RequirePermission>}/>
            <Route path="/templates"   element={<RequirePermission module="templates"><TemplatesPage/></RequirePermission>}/>
            <Route path="/insurances"  element={<RequirePermission module="insurances"><InsurancesPage/></RequirePermission>}/>
          </Route>
          <Route path="*" element={<SmartRedirect/>}/>
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#0f172a',
            borderRadius: '10px',
            fontSize: '13px',
            padding: '12px 16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
          },
          success: {
            iconTheme: { primary: '#059669', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#fff' },
          },
        }}
      />
    </QueryClientProvider>
  );
}
