import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2, Key, UserCog, Edit2 } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { getStaff, createStaff, updateStaff, deleteStaff } from '../../api/staff';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PermissionMatrix from '../../components/staff/PermissionMatrix';
import { formatDate } from '../../utils/formatters';
import usePermission from '../../hooks/usePermission';

const ROLES = ['admin', 'manager', 'staff'];
const EMPTY_FORM = { name: '', email: '', phone: '', password: '', role: 'staff', status: 'active' };

export default function StaffPage() {
  const qc = useQueryClient();
  const canEdit = usePermission('staff', 'edit');
  const canUpdate = usePermission('staff', 'update');
  const canDelete = usePermission('staff', 'delete');

  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [permUser, setPermUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [delId, setDelId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPw, setShowPw] = useState(false);

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => getStaff().then(r => r.data.data),
  });

  const openEdit = (member) => {
    setEditUser(member);
    setForm({
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      password: '',
      role: member.role || 'staff',
      status: member.status || 'active',
    });
    setShowPw(false);
  };

  const closeEdit = () => {
    setEditUser(null);
    setForm(EMPTY_FORM);
    setShowPw(false);
  };

  const validatePassword = (pw) => {
    if (!pw || pw.length < 8) return 'Password must be at least 8 characters';
    if (!/[0-9]/.test(pw))   return 'Password must contain at least one digit';
    if (!/[^A-Za-z0-9]/.test(pw)) return 'Password must contain at least one special character';
    return null;
  };

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.password) {
      return toast.error('Name, email and password required');
    }
    const pwErr = validatePassword(form.password);
    if (pwErr) return toast.error(pwErr);
    setSaving(true);
    try {
      await createStaff(form);
      toast.success('Staff member created');
      qc.invalidateQueries({ queryKey: ['staff'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setAddOpen(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!form.name || !form.email) return toast.error('Name and email required');
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        role: form.role,
        status: form.status,
      };
      if (form.password) payload.password = form.password;
      await updateStaff(editUser.id, payload);
      toast.success('Staff member updated');
      qc.invalidateQueries({ queryKey: ['staff'] });
      closeEdit();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteStaff(delId);
      toast.success('Staff deleted');
      qc.invalidateQueries({ queryKey: ['staff'] });
      setDelId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setDeleting(false);
    }
  };

  const roleVariant = (r) => (r === 'admin' ? 'purple' : r === 'manager' ? 'blue' : 'gray');

  const columns = [
    {
      key: 'name', label: 'Member', sortable: true,
      render: s => (
        <div className="flex items-center gap-3">
          <div className="avatar avatar-md">{s.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()}</div>
          <p className="font-semibold text-slate-800">{s.name}</p>
        </div>
      ),
    },
    { key: 'email',  label: 'Email',  sortable: true,  render: s => <span className="text-slate-500">{s.email}</span> },
    { key: 'phone',  label: 'Phone',  sortable: false, render: s => <span className="text-slate-500">{s.phone || '—'}</span> },
    { key: 'role',   label: 'Role',   sortable: true,  render: s => <Badge variant={roleVariant(s.role)} dot>{s.role}</Badge> },
    { key: 'status', label: 'Status', sortable: true,  render: s => <Badge dot>{s.status}</Badge> },
    { key: 'created_at', label: 'Joined', sortable: true, render: s => <span className="text-slate-500">{formatDate(s.created_at)}</span> },
    {
      key: '_actions', label: '', width: '90px', align: 'right',
      render: s => (
        <div className="flex items-center justify-end gap-1">
          {canUpdate && (
            <button type="button" onClick={() => openEdit(s)}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-amber-50 text-amber-500 transition" title="Edit">
              <Edit2 size={13}/>
            </button>
          )}
          {canUpdate && (
            <button type="button" onClick={() => setPermUser(s)}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-sky-50 text-sky-500 transition" title="Permissions">
              <Key size={13}/>
            </button>
          )}
          {canDelete && (
            <button type="button" onClick={() => setDelId(s.id)}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-50 text-red-400 transition">
              <Trash2 size={13}/>
            </button>
          )}
        </div>
      ),
    },
  ];

  const staffFormFields = (requirePassword) => (
    <>
      {[
        ['name',  'Full Name',     'text',  'e.g. Ahmad bin Ali'],
        ['email', 'Email Address', 'email', 'staff@example.com'],
        ['phone', 'Phone Number',  'tel',   '+60 12-345 6789'],
      ].map(([k, l, t, ph]) => (
        <div key={k}>
          <label className="label-base">
            {l}
            {(k === 'name' || k === 'email') && <span className="text-red-500"> *</span>}
          </label>
          <input
            type={t}
            className="input-base"
            placeholder={ph}
            value={form[k]}
            onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
          />
        </div>
      ))}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Password {requirePassword && <span className="text-red-400">*</span>}
        </label>
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-16 text-sm focus:outline-none focus:ring-3 focus:ring-sky-500/10 focus:border-sky-500 transition-all"
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            placeholder={requirePassword ? '' : 'Leave blank to keep current'}
          />
          <button
            type="button"
            onClick={() => setShowPw(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-sky-600 transition"
          >
            {showPw ? 'Hide' : 'Show'}
          </button>
        </div>
        {requirePassword && form.password.length > 0 && (() => {
          const checks = [
            { ok: form.password.length >= 8,          label: 'Min 8 characters' },
            { ok: /[0-9]/.test(form.password),         label: 'At least one digit' },
            { ok: /[^A-Za-z0-9]/.test(form.password),  label: 'At least one special character' },
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
          <select
            className="input-base"
            value={form.role}
            onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
          >
            {ROLES.map(r => (
              <option key={r} value={r} className="capitalize">
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
          <select
            className="input-base"
            value={form.status}
            onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Staff Management"
        subtitle="Manage team members, roles, and permissions"
        icon={UserCog}
        color="violet"
        badge={staff.length > 0 ? `${staff.length} member${staff.length !== 1 ? 's' : ''}` : undefined}
        actions={canEdit && (
          <Button icon={<Plus size={15} />} onClick={() => setAddOpen(true)}>
            Add Staff
          </Button>
        )}
      />

      <DataTable
        columns={columns}
        rows={staff}
        loading={isLoading}
        rowKey={s => s.id}
        defaultSort={{ key: 'name', dir: 'asc' }}
        emptyMessage="No staff members yet"
        emptyIcon={<UserCog size={24} className="text-slate-300"/>}
      />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Staff Member" size="sm">
        <div className="space-y-4">
          {staffFormFields(true)}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setAddOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={handleAdd}
              className="flex-1"
              disabled={saving || !form.password || form.password.length < 8 || !/[0-9]/.test(form.password) || !/[^A-Za-z0-9]/.test(form.password)}
            >
              Create Member
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!editUser} onClose={closeEdit} title={`Edit — ${editUser?.name}`} size="sm">
        <div className="space-y-4">
          {staffFormFields(false)}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={closeEdit} className="flex-1">
              Cancel
            </Button>
            <Button loading={saving} onClick={handleEdit} className="flex-1">
              Save changes
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!permUser} onClose={() => setPermUser(null)} title={`Permissions — ${permUser?.name}`} size="md">
        {permUser && <PermissionMatrix userId={permUser.id} role={permUser.role} />}
      </Modal>

      <ConfirmDialog
        open={!!delId}
        onClose={() => setDelId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Staff Member"
        message="This staff account will be permanently deleted. This action cannot be undone."
      />
    </div>
  );
}
