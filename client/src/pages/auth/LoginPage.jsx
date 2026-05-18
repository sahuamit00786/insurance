import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Eye, EyeOff, ShieldCheck, ArrowRight, Users, FileText, BarChart3, Lock,
  Mail, KeyRound, CheckCircle2, Building2, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { login } from '../../api/auth';
import useAuthStore from '../../store/authStore';

const FEATURES = [
  { icon: Users,     title: 'Client lifecycle',      desc: 'Profiles, policies, and contacts in one record' },
  { icon: FileText,  title: 'Document vault',      desc: 'Encrypted storage with instant retrieval' },
  { icon: BarChart3, title: 'Compliance reporting', desc: 'CSV & PDF exports with custom filters' },
  { icon: Lock,      title: 'Access governance',   desc: 'Role-based permissions per module' },
];

const TRUST = [
  '256-bit encryption',
  'Role-based access',
  'Audit-ready exports',
];

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { setAuth, token } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const MODULE_PATHS = {
    dashboard:  '/dashboard',
    clients:    '/clients',
    insurances: '/insurances',
    staff:      '/staff',
    lookup:     '/lookup',
    reports:    '/reports',
    templates:  '/templates',
  };

  if (token) { navigate('/dashboard', { replace: true }); return null; }

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await login(data);
      const { token: t, user, permissions } = res.data.data;

      const isPrivileged = user.role === 'admin' || user.role === 'superadmin';

      if (!isPrivileged) {
        const hasAny = permissions.some(p => p.can_view || p.can_edit || p.can_delete || p.can_update);
        if (!hasAny) {
          toast.error('No menu permissions assigned. Contact your admin.');
          return;
        }
      }

      setAuth(user, t, permissions);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);

      let targetPath = '/dashboard';
      if (!isPrivileged) {
        const first = permissions.find(p => p.can_view);
        if (first && MODULE_PATHS[first.module]) targetPath = MODULE_PATHS[first.module];
      }
      navigate(targetPath, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col overflow-hidden text-white">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(165deg, #080318 0%, #130830 42%, #1e0e50 100%)',
          }}
        />
        <div className="absolute inset-0 login-grid opacity-60" />
        <div
          className="absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full opacity-25 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6b35de 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 -left-32 h-[300px] w-[300px] rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #c21c34 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-0 h-[280px] w-full opacity-50 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #080318, transparent)' }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center h-full px-10 xl:px-14 text-center gap-0">
          <img src="/logo.png" alt="InsurVault" className="h-[300px] w-[300px] object-contain -mb-16"
            style={{ filter: 'saturate(1.4) brightness(1.1) contrast(1.05)' }} />
          <p className="text-[#9d7cc4] text-sm font-medium max-w-xs leading-relaxed mt-2.5">
            A secure operations hub for client records, policy tracking, payments, and reporting.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col min-h-screen bg-[#f4f6f9] login-dots relative">
        <div className="lg:hidden flex items-center gap-3 px-6 pt-6">
          <img src="/logo.png" alt="InsurVault" className="h-14 w-14 object-contain"
            style={{ filter: 'saturate(1.4) brightness(1.1) contrast(1.05)' }} />
          <span className="font-bold text-slate-900 text-lg">InsurVault</span>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-[440px] animate-fade-in">
            <div className="login-form-card p-8 sm:p-10">
              <div className="flex items-center gap-3 mb-8">
                <img src="/logo.png" alt="InsurVault" className="hidden sm:block h-16 w-16 object-contain shrink-0"
                  style={{ filter: 'saturate(1.4) brightness(1.1) contrast(1.05)' }} />
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
                  <p className="text-slate-500 text-sm mt-0.5 font-medium">
                    Sign in to your workspace
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                <div>
                  <label htmlFor="email" className="label-base text-slate-800">
                    Work email
                  </label>
                  <div className="relative">
                    <Mail
                      size={17}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@agency.com"
                      className={`input-base !pl-10 py-3 bg-slate-50/80 focus:bg-white ${errors.email ? 'error' : ''}`}
                      {...register('email', { required: 'Email is required' })}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-800 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <KeyRound
                      size={17}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10"
                    />
                    <input
                      id="password"
                      type={showPw ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className={`input-base !pl-10 !pr-11 py-3 bg-slate-50/80 focus:bg-white ${errors.password ? 'error' : ''}`}
                      {...register('password', { required: 'Password is required' })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => !p)}
                      className="absolute right-2 top-1/2 z-20 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.password.message}</p>
                  )}
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 shrink-0 rounded border-slate-300 text-brand-700 focus:ring-brand-500/20"
                  />
                  <span className="text-sm text-slate-600 font-medium">Keep me signed in for 30 days</span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="relative z-0 w-full shrink-0 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-lg"
                  style={{
                    background: 'linear-gradient(180deg, #5724c7 0%, #421b86 100%)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 4px 14px rgba(66, 27, 134, 0.4)',
                  }}
                >
                  {loading ? (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                  ) : (
                    <>
                      Continue to dashboard
                      <ArrowRight size={16} strokeWidth={2.5} className="shrink-0" />
                    </>
                  )}
                </button>
              </form>

            </div>

            <p className="text-center text-[11px] text-slate-400 mt-6 leading-relaxed">
              © {new Date().getFullYear()} InsurVault · Authorized personnel only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
