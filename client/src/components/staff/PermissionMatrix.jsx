import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getPermissions, updatePermissions } from '../../api/staff';
import Button from '../ui/Button';

const MODULES = ['dashboard','clients','insurances','staff','lookup','reports','templates'];
const ACTIONS = [
  { key: 'can_view',   label: 'View'   },
  { key: 'can_edit',   label: 'Add'    },
  { key: 'can_delete', label: 'Delete' },
  { key: 'can_update', label: 'Update' },
];

export default function PermissionMatrix({ userId, role }) {
  const qc = useQueryClient();
  const [perms, setPerms] = useState([]);
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ['permissions', userId],
    queryFn:  () => getPermissions(userId).then(r => r.data.data),
    enabled: !!userId,
  });

  useEffect(() => {
    if (data) setPerms(data);
  }, [data]);

  const toggle = (module, key) => {
    if (role === 'admin') return;
    setPerms(prev => prev.map(p => {
      if (p.module !== module) return p;
      const next = { ...p, [key]: p[key] ? 0 : 1 };
      // auto-enable view if any other permission is on
      if (!next.can_view && (next.can_edit || next.can_delete || next.can_update)) {
        next.can_view = 1;
      }
      return next;
    }));
  };

  const toggleAll = (module) => {
    if (role === 'admin') return;
    setPerms(prev => prev.map(p => {
      if (p.module !== module) return p;
      const allOn = ACTIONS.every(a => p[a.key]);
      const val = allOn ? 0 : 1;
      return { ...p, can_view: val, can_edit: val, can_delete: val, can_update: val };
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePermissions(userId, perms);
      toast.success('Permissions updated');
      qc.invalidateQueries({ queryKey: ['permissions', userId] });
    } catch { toast.error('Failed'); } finally { setSaving(false); }
  };

  if (role === 'admin') {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-700">
        Admin role has all permissions automatically — no restrictions apply.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Module</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">All</th>
              {ACTIONS.map(a => (
                <th key={a.key} className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">{a.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {MODULES.filter(mod => mod !== 'lookup').map(mod => {
              const p = perms.find(x => x.module === mod) || { module: mod, can_view:0, can_edit:0, can_delete:0, can_update:0 };
              const allChecked = ACTIONS.every(a => !!p[a.key]);
              const someChecked = ACTIONS.some(a => !!p[a.key]);
              return (
                <tr key={mod} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 text-sm font-medium text-slate-700 capitalize">{mod}</td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                      onChange={() => toggleAll(mod)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                  </td>
                  {ACTIONS.map(a => (
                    <td key={a.key} className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={!!p[a.key]}
                        onChange={() => toggle(mod, a.key)}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <Button size="sm" loading={saving} onClick={handleSave}>Save Permissions</Button>
      </div>
    </div>
  );
}
