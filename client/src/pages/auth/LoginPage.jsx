import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Eye, EyeOff, ArrowRight, Mail, KeyRound, ArrowLeft,
  ShieldCheck, RefreshCw, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { login, forgotPassword, verifyOtp, resetPassword } from '../../api/auth';
import useAuthStore from '../../store/authStore';

const MODULE_PATHS = {
  dashboard:  '/dashboard',
  clients:    '/clients',
  insurances: '/insurances',
  staff:      '/staff',
  lookup:     '/lookup',
  reports:    '/reports',
  templates:  '/templates',
};

// ─── Password strength checks ────────────────────────────────────────────────
const PW_CHECKS = [
  { label: 'At least 8 characters',      test: v => v.length >= 8 },
  { label: 'At least one number',         test: v => /[0-9]/.test(v) },
  { label: 'At least one special character', test: v => /[^A-Za-z0-9]/.test(v) },
];

// ─── Brand panel (shared) ─────────────────────────────────────────────────────
function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col overflow-hidden text-white">
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(165deg,#080318 0%,#130830 42%,#1e0e50 100%)' }} />
      <div className="absolute inset-0 login-grid opacity-60" />
      <div className="absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full opacity-25 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle,#6b35de 0%,transparent 70%)' }} />
      <div className="absolute top-1/2 -left-32 h-[300px] w-[300px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle,#c21c34 0%,transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 h-[280px] w-full opacity-50 pointer-events-none"
        style={{ background: 'linear-gradient(to top,#080318,transparent)' }} />
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-10 xl:px-14 text-center">
        <img src="/logo.png" alt="InsurVault" className="h-[300px] w-[300px] object-contain -mb-16"
          style={{ filter: 'saturate(1.4) brightness(1.1) contrast(1.05)' }} />
        <p className="text-[#9d7cc4] text-sm font-medium max-w-xs leading-relaxed mt-2.5">
          A secure operations hub for client records, policy tracking, payments, and reporting.
        </p>
      </div>
    </div>
  );
}

// ─── Gradient button ──────────────────────────────────────────────────────────
function PrimaryBtn({ children, loading, disabled, onClick, type = 'button' }) {
  return (
    <button type={type} onClick={onClick} disabled={loading || disabled}
      className="relative w-full flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-lg"
      style={{
        background: 'linear-gradient(180deg,#5724c7 0%,#421b86 100%)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05),0 4px 14px rgba(66,27,134,0.4)',
      }}
    >
      {loading
        ? <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        : children}
    </button>
  );
}

// ─── OTP digit boxes ──────────────────────────────────────────────────────────
function OtpInput({ value, onChange }) {
  const refs = useRef([]);

  const handleChange = (i, raw) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const next = [...value];
    next[i] = digit;
    onChange(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = ['', '', '', '', '', ''];
    pasted.split('').forEach((c, i) => { next[i] = c; });
    onChange(next);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex gap-2.5 justify-center">
      {value.map((d, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={`w-11 h-13 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none
            ${d
              ? 'border-violet-500 bg-violet-50 text-violet-800'
              : 'border-slate-200 bg-slate-50 text-slate-800 focus:border-violet-400 focus:bg-white'
            }`}
          style={{ height: '52px' }}
        />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { setAuth, token } = useAuthStore();
  const navigate = useNavigate();

  const [loading, setLoading]     = useState(false);
  const [showPw,  setShowPw]      = useState(false);

  // Forgot-password flow state
  const [mode,        setMode]        = useState('login'); // login | email | otp | newpw
  const [fpEmail,     setFpEmail]     = useState('');
  const [otp,         setOtp]         = useState(['','','','','','']);
  const [fpToken,     setFpToken]     = useState('');
  const [newPw,       setNewPw]       = useState('');
  const [newPwConf,   setNewPwConf]   = useState('');
  const [showNewPw,   setShowNewPw]   = useState(false);
  const [resendSecs,  setResendSecs]  = useState(0);
  const [fpLoading,   setFpLoading]   = useState(false);

  if (token) { navigate('/dashboard', { replace: true }); return null; }

  // Resend countdown
  useEffect(() => {
    if (resendSecs <= 0) return;
    const id = setInterval(() => setResendSecs(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [resendSecs]);

  // ── Login submit ────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await login(data);
      const { token: t, user, permissions } = res.data.data;
      const isPrivileged = user.role === 'admin' || user.role === 'superadmin';
      if (!isPrivileged) {
        const hasAny = permissions.some(p => p.can_view || p.can_edit || p.can_delete || p.can_update);
        if (!hasAny) { toast.error('No menu permissions assigned. Contact your admin.'); return; }
      }
      setAuth(user, t, permissions);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      let path = '/dashboard';
      if (!isPrivileged) {
        const first = permissions.find(p => p.can_view);
        if (first && MODULE_PATHS[first.module]) path = MODULE_PATHS[first.module];
      }
      navigate(path, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: send OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!fpEmail.trim()) return toast.error('Enter your email address');
    setFpLoading(true);
    try {
      await forgotPassword({ email: fpEmail.trim() });
      toast.success('OTP sent! Check your inbox.');
      setOtp(['','','','','','']);
      setMode('otp');
      setResendSecs(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setFpLoading(false);
    }
  };

  // ── Step 2: verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) return toast.error('Enter all 6 digits');
    setFpLoading(true);
    try {
      const res = await verifyOtp({ email: fpEmail.trim(), otp: code });
      setFpToken(res.data.data.reset_token);
      setMode('newpw');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired code');
    } finally {
      setFpLoading(false);
    }
  };

  // ── Step 3: set new password ────────────────────────────────────────────────
  const handleResetPw = async () => {
    if (!newPw) return toast.error('Enter a new password');
    if (newPw !== newPwConf) return toast.error('Passwords do not match');
    const failed = PW_CHECKS.find(c => !c.test(newPw));
    if (failed) return toast.error(failed.label);
    setFpLoading(true);
    try {
      await resetPassword({ token: fpToken, password: newPw });
      toast.success('Password updated! Please sign in.');
      setMode('login');
      setFpEmail(''); setOtp(['','','','','','']); setFpToken('');
      setNewPw(''); setNewPwConf('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setFpLoading(false);
    }
  };

  const resetToLogin = () => {
    setMode('login');
    setFpEmail(''); setOtp(['','','','','','']); setFpToken('');
    setNewPw(''); setNewPwConf('');
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">
      <BrandPanel />

      <div className="flex-1 flex flex-col min-h-screen bg-[#f4f6f9] login-dots relative">
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-[440px] animate-fade-in">
            <div className="login-form-card p-8 sm:p-10">

              {/* Mobile logo */}
              <div className="flex justify-center mb-4 sm:hidden">
                <img src="/logo.png" alt="Logo" className="h-40 w-40 object-contain"
                  style={{ filter: 'saturate(1.4) brightness(1.1) contrast(1.05)' }} />
              </div>

              {/* ── LOGIN ── */}
              {mode === 'login' && (
                <>
                  <div className="flex items-center gap-3 mb-8">
                    <img src="/logo.png" alt="InsurVault" className="hidden sm:block h-16 w-16 object-contain shrink-0"
                      style={{ filter: 'saturate(1.4) brightness(1.1) contrast(1.05)' }} />
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
                      <p className="text-slate-500 text-sm mt-0.5 font-medium">Sign in to your workspace</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                    <div>
                      <label className="label-base text-slate-800">Work email</label>
                      <div className="relative">
                        <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="email" autoComplete="email" placeholder="name@agency.com"
                          className={`input-base !pl-10 py-3 bg-slate-50/80 focus:bg-white ${errors.email ? 'error' : ''}`}
                          {...register('email', { required: 'Email is required' })} />
                      </div>
                      {errors.email && <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.email.message}</p>}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-semibold text-slate-800">Password</label>
                        <button type="button" onClick={() => { setFpEmail(''); setMode('email'); }}
                          className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition">
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <KeyRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                        <input type={showPw ? 'text' : 'password'} autoComplete="current-password"
                          placeholder="Enter your password"
                          className={`input-base !pl-10 !pr-11 py-3 bg-slate-50/80 focus:bg-white ${errors.password ? 'error' : ''}`}
                          {...register('password', { required: 'Password is required' })} />
                        <button type="button" onClick={() => setShowPw(p => !p)}
                          className="absolute right-2 top-1/2 z-20 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
                          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.password.message}</p>}
                    </div>

                    <PrimaryBtn type="submit" loading={loading}>
                      Continue to dashboard <ArrowRight size={16} strokeWidth={2.5} className="shrink-0" />
                    </PrimaryBtn>
                  </form>
                </>
              )}

              {/* ── FORGOT — enter email ── */}
              {mode === 'email' && (
                <div className="flex flex-col gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg,#5724c7,#3b13a0)' }}>
                        <ShieldCheck size={18} className="text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">Reset password</h2>
                        <p className="text-sm text-slate-500">We'll send a one-time code to your email</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="label-base text-slate-800">Email address</label>
                    <div className="relative mt-1">
                      <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="email" autoComplete="email" placeholder="name@agency.com"
                        className="input-base !pl-10 py-3 bg-slate-50 focus:bg-white"
                        value={fpEmail} onChange={e => setFpEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendOtp()} />
                    </div>
                  </div>

                  <PrimaryBtn loading={fpLoading} onClick={handleSendOtp}>
                    Send verification code <ArrowRight size={16} strokeWidth={2.5} />
                  </PrimaryBtn>

                  <button type="button" onClick={resetToLogin}
                    className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition">
                    <ArrowLeft size={14} /> Back to sign in
                  </button>
                </div>
              )}

              {/* ── FORGOT — enter OTP ── */}
              {mode === 'otp' && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Check your email</h2>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      We sent a 6-digit code to <span className="font-semibold text-slate-700">{fpEmail}</span>
                    </p>
                  </div>

                  <OtpInput value={otp} onChange={setOtp} />

                  <PrimaryBtn loading={fpLoading} onClick={handleVerifyOtp}>
                    Verify code
                  </PrimaryBtn>

                  <div className="text-center space-y-2">
                    {resendSecs > 0 ? (
                      <p className="text-sm text-slate-400">
                        Resend code in{' '}
                        <span className="font-semibold text-violet-600">
                          {String(Math.floor(resendSecs / 60)).padStart(2, '0')}:{String(resendSecs % 60).padStart(2, '0')}
                        </span>
                      </p>
                    ) : (
                      <button type="button" onClick={handleSendOtp}
                        className="flex items-center justify-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-800 mx-auto transition">
                        <RefreshCw size={13} /> Resend code
                      </button>
                    )}
                    <button type="button" onClick={() => setMode('email')}
                      className="flex items-center justify-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mx-auto transition">
                      <ArrowLeft size={13} /> Change email
                    </button>
                  </div>
                </div>
              )}

              {/* ── FORGOT — set new password ── */}
              {mode === 'newpw' && (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={18} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Set new password</h2>
                      <p className="text-sm text-slate-500">Code verified — choose a strong password</p>
                    </div>
                  </div>

                  <div>
                    <label className="label-base text-slate-800">New password</label>
                    <div className="relative mt-1">
                      <input type={showNewPw ? 'text' : 'password'} autoComplete="new-password"
                        placeholder="Create a strong password"
                        className="input-base pr-12 py-3 bg-slate-50 focus:bg-white"
                        value={newPw} onChange={e => setNewPw(e.target.value)} />
                      <button type="button" onClick={() => setShowNewPw(p => !p)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
                        {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {newPw.length > 0 && (
                      <div className="mt-2.5 flex flex-col gap-1">
                        {PW_CHECKS.map(c => (
                          <span key={c.label} className={`flex items-center gap-1.5 text-xs font-medium ${c.test(newPw) ? 'text-emerald-600' : 'text-red-500'}`}>
                            <span className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold text-white ${c.test(newPw) ? 'bg-emerald-500' : 'bg-red-400'}`}>
                              {c.test(newPw) ? '✓' : '✕'}
                            </span>
                            {c.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="label-base text-slate-800">Confirm new password</label>
                    <input type={showNewPw ? 'text' : 'password'} autoComplete="new-password"
                      placeholder="Re-enter new password"
                      className="input-base mt-1 py-3 bg-slate-50 focus:bg-white"
                      value={newPwConf} onChange={e => setNewPwConf(e.target.value)} />
                  </div>

                  <PrimaryBtn loading={fpLoading} onClick={handleResetPw}
                    disabled={!PW_CHECKS.every(c => c.test(newPw)) || newPw !== newPwConf}>
                    Save password <ArrowRight size={16} strokeWidth={2.5} />
                  </PrimaryBtn>
                </div>
              )}

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
