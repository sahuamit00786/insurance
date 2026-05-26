import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { resetPassword } from '../../api/auth';

const PW_CHECKS = [
  { label: 'At least 8 characters',         test: v => v.length >= 8 },
  { label: 'At least one number',            test: v => /[0-9]/.test(v) },
  { label: 'At least one special character', test: v => /[^A-Za-z0-9]/.test(v) },
];

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

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPw,     setNewPw]     = useState('');
  const [newPwConf, setNewPwConf] = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);

  const allPass = PW_CHECKS.every(c => c.test(newPw));
  const match   = newPw === newPwConf && newPwConf.length > 0;

  const handleSubmit = async () => {
    if (!token) return toast.error('Invalid or missing reset link. Please request a new one.');
    if (!newPw)           return toast.error('Enter a new password');
    if (!allPass)         return toast.error(PW_CHECKS.find(c => !c.test(newPw)).label);
    if (!match)           return toast.error('Passwords do not match');

    setLoading(true);
    try {
      await resetPassword({ token, password: newPw });
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Link expired or already used. Request a new one.');
    } finally {
      setLoading(false);
    }
  };

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

              {/* ── SUCCESS STATE ── */}
              {done ? (
                <div className="flex flex-col items-center gap-5 py-4 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                    <CheckCircle2 size={32} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Password updated!</h2>
                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                      Your new password has been saved. You can now sign in to your account.
                    </p>
                  </div>
                  <PrimaryBtn onClick={() => navigate('/login', { replace: true })}>
                    Go to sign in <ArrowRight size={16} strokeWidth={2.5} />
                  </PrimaryBtn>
                </div>
              ) : (
                /* ── FORM STATE ── */
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'linear-gradient(135deg,#5724c7,#3b13a0)' }}>
                      <KeyRound size={18} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Create new password</h2>
                      <p className="text-sm text-slate-500">Choose a strong password for your account</p>
                    </div>
                  </div>

                  {!token && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 font-medium">
                      This link is invalid or missing a reset token. Please request a new password reset.
                    </div>
                  )}

                  <div>
                    <label className="label-base text-slate-800">New password</label>
                    <div className="relative mt-1">
                      <input
                        type={showPw ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Create a strong password"
                        className="input-base pr-12 py-3 bg-slate-50 focus:bg-white"
                        value={newPw}
                        onChange={e => setNewPw(e.target.value)}
                        disabled={!token}
                      />
                      <button type="button" onClick={() => setShowPw(p => !p)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {newPw.length > 0 && (
                      <div className="mt-2.5 flex flex-col gap-1">
                        {PW_CHECKS.map(c => (
                          <span key={c.label}
                            className={`flex items-center gap-1.5 text-xs font-medium ${c.test(newPw) ? 'text-emerald-600' : 'text-red-500'}`}>
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
                    <input
                      type={showPw ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Re-enter new password"
                      className={`input-base mt-1 py-3 bg-slate-50 focus:bg-white ${newPwConf.length > 0 && !match ? 'error' : ''}`}
                      value={newPwConf}
                      onChange={e => setNewPwConf(e.target.value)}
                      disabled={!token}
                    />
                    {newPwConf.length > 0 && !match && (
                      <p className="text-xs text-red-500 mt-1.5 font-medium">Passwords do not match</p>
                    )}
                  </div>

                  <PrimaryBtn
                    loading={loading}
                    onClick={handleSubmit}
                    disabled={!token || !allPass || !match}
                  >
                    Set new password <ArrowRight size={16} strokeWidth={2.5} />
                  </PrimaryBtn>

                  <button type="button" onClick={() => navigate('/login')}
                    className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition">
                    <ArrowLeft size={14} /> Back to sign in
                  </button>
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
