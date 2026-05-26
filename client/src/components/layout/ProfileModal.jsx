import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { PageLoader } from '../ui/Spinner';
import { getMe, updateProfile } from '../../api/auth';
import useAuthStore from '../../store/authStore';
import { formatDate } from '../../utils/formatters';

const ROLE_VARIANT = {
  admin: 'purple',
  manager: 'blue',
  staff: 'gray',
};

export default function ProfileModal({ open, onClose }) {
  const storeUser  = useAuthStore(s => s.user);
  const updateUser = useAuthStore(s => s.updateUser);
  const [form, setForm] = useState({
    name:             storeUser?.name  || '',
    email:            storeUser?.email || '',
    current_password: '',
    password:         '',
    confirm_password: '',
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => getMe().then(r => r.data.data),
    enabled: open,
  });

  const profile = data?.user;

  useEffect(() => {
    if (!open) {
      setForm(p => ({
        ...p,
        current_password: '',
        password:         '',
        confirm_password: '',
      }));
      setShowCurrentPw(false);
      setShowNewPw(false);
      return;
    }
    setForm(p => ({
      ...p,
      name:  storeUser?.name  || p.name,
      email: storeUser?.email || p.email,
    }));
    refetch();
  }, [open, refetch, storeUser?.name, storeUser?.email]);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        email: profile.email || '',
        current_password: '',
        password: '',
        confirm_password: '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.email.trim()) return toast.error('Email is required');

    if (form.password || form.confirm_password || form.current_password) {
      if (!form.current_password) return toast.error('Enter your current password');
      if (!form.password) return toast.error('Enter a new password');
      if (form.password.length < 8)           return toast.error('Password must be at least 8 characters');
      if (!/[0-9]/.test(form.password))        return toast.error('Password must contain at least one digit');
      if (!/[^A-Za-z0-9]/.test(form.password)) return toast.error('Password must contain at least one special character');
      if (form.password !== form.confirm_password) return toast.error('New passwords do not match');
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
      };
      if (form.password) {
        payload.current_password = form.current_password;
        payload.password = form.password;
      }

      const res = await updateProfile(payload);
      const updated = res.data.data.user;
      updateUser(updated);
      toast.success('Profile updated');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const initials = profile?.name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '??';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="My Profile"
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={saving} onClick={handleSave} disabled={isLoading}>
            Save changes
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="py-8">
          <PageLoader />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4 rounded-xl bg-slate-50 border border-slate-100 px-4 py-4">
            <div className="avatar avatar-lg text-base">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-slate-900 truncate">{profile?.name}</p>
              <p className="text-sm text-slate-500 truncate">{profile?.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant={ROLE_VARIANT[profile?.role] || 'gray'} dot className="capitalize">
                  {profile?.role}
                </Badge>
                <Badge dot className="capitalize">{profile?.status}</Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-base">Full name</label>
              <input
                className="input-base mt-1"
                placeholder="Your full name"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="label-base">Email address</label>
              <input
                type="email"
                className="input-base mt-1"
                placeholder="email@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="label-base text-slate-500">Role</label>
              <p className="mt-2 text-sm font-medium text-slate-700 capitalize">{profile?.role}</p>
            </div>
            <div>
              <label className="label-base text-slate-500">Account status</label>
              <p className="mt-2 text-sm font-medium text-slate-700 capitalize">{profile?.status}</p>
            </div>
            <div>
              <label className="label-base text-slate-500">Member since</label>
              <p className="mt-2 text-sm font-medium text-slate-700">
                {profile?.created_at ? formatDate(profile.created_at) : '—'}
              </p>
            </div>
            <div>
              <label className="label-base text-slate-500">Last updated</label>
              <p className="mt-2 text-sm font-medium text-slate-700">
                {profile?.updated_at ? formatDate(profile.updated_at) : '—'}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 p-4 space-y-4">
            <p className="text-sm font-semibold text-slate-800">Change password</p>
            <p className="text-xs text-slate-500">Leave blank to keep your current password.</p>

            <div>
              <label className="label-base">Current password</label>
              <div className="relative mt-1">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  className="input-base pr-16"
                  placeholder="Enter current password"
                  value={form.current_password}
                  onChange={e => setForm(p => ({ ...p, current_password: e.target.value }))}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-brand-700"
                >
                  {showCurrentPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-base">New password</label>
                <div className="relative mt-1">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    className="input-base pr-16"
                    placeholder="Create a strong password"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-brand-700"
                  >
                    {showNewPw ? 'Hide' : 'Show'}
                  </button>
                </div>
                {form.password.length > 0 && (() => {
                  const checks = [
                    { ok: form.password.length >= 8,           label: 'Min 8 characters' },
                    { ok: /[0-9]/.test(form.password),          label: 'At least one digit' },
                    { ok: /[^A-Za-z0-9]/.test(form.password),   label: 'At least one special character' },
                  ];
                  return (
                    <div className="mt-2 flex flex-col gap-1">
                      {checks.map(c => (
                        <span key={c.label} className={`flex items-center gap-1.5 text-xs font-medium ${c.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                          <span className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-white text-[9px] font-bold ${c.ok ? 'bg-emerald-500' : 'bg-red-400'}`}>
                            {c.ok ? '✓' : '✕'}
                          </span>
                          {c.label}
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>
              <div>
                <label className="label-base">Confirm new password</label>
                <input
                  type={showNewPw ? 'text' : 'password'}
                  className="input-base mt-1"
                  placeholder="Re-enter new password"
                  value={form.confirm_password}
                  onChange={e => setForm(p => ({ ...p, confirm_password: e.target.value }))}
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
