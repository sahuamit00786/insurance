import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2, Pencil, Settings, Search, X } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import {
  getCategories, getAllLookups, createValue, updateValue, deleteValue,
} from '../../api/lookup';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import usePermission from '../../hooks/usePermission';

const EMPTY_FORM = {
  lookup_name: '',
  category_id: '',
  is_active:   true,
};

function ActiveBadge({ active }) {
  const on = Boolean(active);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
        on
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-slate-100 text-slate-500 border-slate-200'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${on ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {on ? 'Active' : 'Inactive'}
    </span>
  );
}

export default function LookupPage() {
  const qc = useQueryClient();
  const canEdit   = usePermission('lookup', 'edit');
  const canUpdate = usePermission('lookup', 'update');
  const canDelete = usePermission('lookup', 'delete');

  const [modal, setModal]       = useState({ open: false, item: null });
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [delId, setDelId]       = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [search,     setSearch]     = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: ['lookup-categories'],
    queryFn:  () => getCategories().then(r => r.data.data),
  });

  const { data: lookups = [], isLoading } = useQuery({
    queryKey: ['lookup-items'],
    queryFn:  () => getAllLookups().then(r => r.data.data),
  });

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      category_id: categories[0]?.id?.toString() || '',
    });
    setModal({ open: true, item: null });
  };

  const openEdit = (row) => {
    setForm({
      lookup_name: row.lookup_name || '',
      category_id: String(row.category_id),
      is_active:   Boolean(row.is_active),
    });
    setModal({ open: true, item: row });
  };

  const closeModal = () => {
    setModal({ open: false, item: null });
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.lookup_name.trim()) return toast.error('Lookup name is required');
    if (!form.category_id) return toast.error('Lookup type is required');

    setSaving(true);
    try {
      const payload = {
        category_id: Number(form.category_id),
        value:       form.lookup_name.trim(),
        is_active:   form.is_active,
      };

      if (modal.item) {
        await updateValue(modal.item.id, payload);
        toast.success('Lookup updated');
      } else {
        await createValue(payload);
        toast.success('Lookup created');
      }

      qc.invalidateQueries({ queryKey: ['lookup-items'] });
      categories.forEach(c => qc.invalidateQueries({ queryKey: ['lookup', c.slug] }));
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save lookup');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteValue(delId);
      toast.success('Lookup deleted');
      qc.invalidateQueries({ queryKey: ['lookup-items'] });
      categories.forEach(c => qc.invalidateQueries({ queryKey: ['lookup', c.slug] }));
      setDelId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    let rows = lookups;
    if (search)       rows = rows.filter(r => r.lookup_name?.toLowerCase().includes(search.toLowerCase()));
    if (filterType)   rows = rows.filter(r => String(r.category_id) === filterType);
    if (filterStatus === 'active')   rows = rows.filter(r => r.is_active);
    if (filterStatus === 'inactive') rows = rows.filter(r => !r.is_active);
    return rows;
  }, [lookups, search, filterType, filterStatus]);

  const activeFilters = [search, filterType, filterStatus].filter(Boolean).length;

  const lookupColumns = [
    {
      key: 'lookup_name', label: 'Lookup Name', sortable: true,
      render: r => <span className="font-medium text-slate-900">{r.lookup_name}</span>,
    },
    {
      key: 'lookup_type', label: 'Lookup Type', sortable: true,
      render: r => (
        <span className="flex items-center gap-2">
          <span className="text-sm text-slate-600">{r.lookup_type}</span>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{r.lookup_type_slug}</span>
        </span>
      ),
    },
    {
      key: 'is_active', label: 'Status', sortable: true,
      render: r => <ActiveBadge active={r.is_active}/>,
    },
    ...((canUpdate || canDelete) ? [{
      key: '_actions', label: '', width: '80px', align: 'right',
      render: r => (
        <div className="flex items-center justify-end gap-1">
          {canUpdate && (
            <button type="button" onClick={() => openEdit(r)}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-brand-50 text-brand-600 transition">
              <Pencil size={14}/>
            </button>
          )}
          {canDelete && (
            <button type="button" onClick={() => setDelId(r.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-red-50 text-red-400 transition">
              <Trash2 size={14}/>
            </button>
          )}
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Lookup Settings"
        subtitle="Manage dropdown values used across the system"
        icon={Settings}
        color="amber"
        badge={`${lookups.length} entries`}
        actions={canEdit && (
          <Button icon={<Plus size={15} />} onClick={openCreate}>
            Add Lookup
          </Button>
        )}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input
            className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-3 focus:ring-sky-500/10 focus:border-sky-500 w-full shadow-sm transition-all"
            placeholder="Search lookup name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-3 focus:ring-sky-500/10 focus:border-sky-500 transition-all"
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="">All types</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-3 focus:ring-sky-500/10 focus:border-sky-500 transition-all"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {activeFilters > 0 && (
          <button
            onClick={() => { setSearch(''); setFilterType(''); setFilterStatus(''); }}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-500 hover:text-red-600 hover:border-red-200 transition-all"
          >
            <X size={11}/> Clear
          </button>
        )}

        <span className="ml-auto text-xs text-slate-400 font-medium">
          {filtered.length} of {lookups.length}
        </span>
      </div>

      <DataTable
        columns={lookupColumns}
        rows={filtered}
        loading={isLoading}
        rowKey={r => r.id}
        defaultSort={{ key: 'lookup_type', dir: 'asc' }}
        emptyMessage={activeFilters > 0 ? 'No entries match your filters' : 'No lookup entries yet'}
        emptyIcon={<Settings size={24} className="text-slate-300"/>}
      />

      <Modal
        open={modal.open}
        onClose={closeModal}
        title={modal.item ? 'Edit Lookup' : 'Create Lookup'}
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}>
              {modal.item ? 'Save Changes' : 'Create Lookup'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label-base">Lookup Name <span className="text-red-500">*</span></label>
            <input
              className="input-base"
              placeholder="e.g. Life Basic, Monthly, Active"
              value={form.lookup_name}
              onChange={e => setForm(p => ({ ...p, lookup_name: e.target.value }))}
            />
          </div>

          <div>
            <label className="label-base">Lookup Type <span className="text-red-500">*</span></label>
            <select
              className="input-base"
              value={form.category_id}
              onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}
            >
              <option value="">Select type...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500/20"
            />
            <div>
              <p className="text-sm font-medium text-slate-800">Active</p>
              <p className="text-xs text-slate-500 mt-0.5">Inactive entries are hidden from dropdowns</p>
            </div>
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!delId}
        onClose={() => setDelId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Lookup"
        message="This lookup value will be permanently deleted. Records using it may show as blank."
      />
    </div>
  );
}
