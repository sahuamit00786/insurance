import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Search, ShieldCheck,
  AlertTriangle, Clock, Filter, X, Plus, Pencil, Trash2,
} from 'lucide-react';
import {
  getAllInsurances, getClients, getInsurances,
  createInsurance, updateInsurance, deleteInsurance,
} from '../../api/clients';
import { getValues } from '../../api/lookup';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PageHeader from '../../components/ui/PageHeader';
import ClientNameLink from '../../components/clients/ClientNameLink';
import { formatDate, formatCurrency } from '../../utils/formatters';
import useLookup from '../../hooks/useLookup';
import usePermission from '../../hooks/usePermission';
import SearchableSelect from '../../components/ui/SearchableSelect';
import { createValueBySlug } from '../../api/lookup';

/* ── Client search picker ────────────────────────────────────────────── */
function ClientPicker({ value, onChange }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const { data } = useQuery({
    queryKey: ['clients-pick', q],
    queryFn:  () => getClients({ search: q, limit: 20 }).then(r => r.data.data),
    keepPreviousData: true,
  });
  const clients = data?.rows || [];
  const selected = value?.name;

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input
          className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-3 focus:ring-brand-500/10 focus:border-brand-500 transition-all shadow-sm"
          placeholder="Search client…"
          value={selected && !open ? selected : q}
          onFocus={() => { setOpen(true); setQ(''); }}
          onChange={e => { setQ(e.target.value); onChange(null); }}
        />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            {clients.length === 0 && <p className="px-3.5 py-3 text-sm text-slate-400">No clients found</p>}
            {clients.map(c => (
              <button key={c.id} type="button"
                onClick={() => { onChange(c); setOpen(false); setQ(''); }}
                className={`w-full text-left px-3.5 py-2 text-sm hover:bg-slate-50 transition-colors ${value?.id === c.id ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-slate-700'}`}>
                <span className="font-medium">{c.name}</span>
                {c.identification_no && <span className="ml-2 text-slate-400 text-xs">{c.identification_no}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Insurance form ─────────────────────────────────────────────────── */
const EMPTY_FORM = {
  client: null,
  policy_no: '', identification_no: '',
  buying_for_id: '',
  plan_code_id: '', status_id: '',
  payment_mode_id: '', payment_method_id: '',
  issued_date: '', maturity_date: '', premium_due_date: '',
  premium: '', note: '',
};

function toDate(v) { return v ? String(v).slice(0, 10) : ''; }

function InsuranceForm({ form, setForm, planCodes, statuses, payModes, payMethods, coverageProviders, onCreateCoverageProvider, onCreatePlanCode, isEdit }) {
  const inp = (key, label, type = 'text') => (
    <div key={key}>
      <label className="label-base">{label}</label>
      <input type={type} step={type === 'number' ? '0.01' : undefined}
        className="input-base" value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}/>
    </div>
  );
  const sel = (key, label, options, onCreate) => (
    <div key={key}>
      <label className="label-base">{label}</label>
      <SearchableSelect
        value={form[key]}
        onChange={v => setForm(p => ({ ...p, [key]: v }))}
        options={options}
        placeholder="Select…"
        onCreateNew={onCreate}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      {!isEdit && (
        <div>
          <label className="label-base">Client <span className="text-red-500">*</span></label>
          <ClientPicker
            value={form.client}
            onChange={c => setForm(p => ({ ...p, client: c, identification_no: c?.identification_no || p.identification_no }))}
          />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {inp('policy_no',        'Policy No *')}
        {inp('identification_no','IC / Passport No')}
        {sel('buying_for_id',    'Coverage Provider', coverageProviders, onCreateCoverageProvider)}
        {sel('plan_code_id',     'Plan Code',         planCodes,         onCreatePlanCode)}
        {sel('status_id',        'Status',         statuses)}
        {sel('payment_mode_id',  'Payment Mode',   payModes)}
        {sel('payment_method_id','Payment Method', payMethods)}
        {inp('issued_date',      'Issued Date',    'date')}
        {inp('maturity_date',    'Maturity Date',  'date')}
        {inp('premium_due_date', 'Premium Due Date','date')}
        {inp('premium',          'Premium (RM)',   'number')}
      </div>
      <div>
        <label className="label-base">Note</label>
        <textarea
          className="input-base resize-none"
          rows={3}
          placeholder="Add a note for this policy…"
          value={form.note}
          onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
        />
      </div>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────── */
function humanTime(days) {
  const n = Math.abs(parseInt(days));
  if (n < 30)  return `${n}d`;
  if (n < 365) { const m = Math.round(n / 30); return `${m} mo`; }
  const y = Math.floor(n / 365), rem = Math.round((n % 365) / 30);
  return rem > 0 ? `${y}y ${rem}mo` : `${y}y`;
}

function TimeLabel({ days }) {
  if (days == null) return <span className="text-slate-400">—</span>;
  const n = parseInt(days); const label = humanTime(n);
  if (n < 0)    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full"><AlertTriangle size={10}/> {label} ago</span>;
  if (n <= 30)  return <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full"><AlertTriangle size={10}/> {label}</span>;
  if (n <= 90)  return <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"><Clock size={10}/> {label}</span>;
  return <span className="text-xs font-medium text-slate-500">{label}</span>;
}

const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm focus:outline-none focus:ring-3 focus:ring-brand-500/10 focus:border-brand-500 transition-all shadow-sm';

const TABS = [
  { key: 'upcoming', label: 'Due'     },
  { key: 'expired',  label: 'Expired' },
];

const EXPIRY_PRESETS = [
  { label: '30 days',  value: '30'  },
  { label: '60 days',  value: '60'  },
  { label: '90 days',  value: '90'  },
  { label: '6 months', value: '180' },
];

/* ── Page ─────────────────────────────────────────────────────────────── */
export default function InsurancesPage() {
  const qc = useQueryClient();
  const canEdit   = usePermission('insurances', 'edit');
  const canUpdate = usePermission('insurances', 'update');
  const canDelete = usePermission('insurances', 'delete');

  const [tab,              setTab]             = useState('upcoming');
  const [search,           setSearch]          = useState('');
  const [planCodeId,       setPlanCodeId]      = useState('');
  const [statusId,         setStatusId]        = useState('');
  const [paymentModeId,    setPaymentModeId]   = useState('');
  const [coverageProviderId, setCoverageProviderId] = useState('');
  const [expiryDays,       setExpiryDays]      = useState('');
  const [dateType,      setDateType]     = useState('issued');
  const [dateFrom,      setDateFrom]     = useState('');
  const [dateTo,        setDateTo]       = useState('');
  const [page,          setPage]         = useState(1);
  const [pageSize,      setPageSize]     = useState(20);
  const [showFilters,   setShowFilters]  = useState(false);

  const [modal,   setModal]   = useState({ open: false, ins: null });
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [delId,   setDelId]   = useState(null);
  const [deleting,setDeleting]= useState(false);

  const { data: clientPolicies = [] } = useQuery({
    queryKey: ['insurances', form.client?.id],
    queryFn:  () => getInsurances(form.client.id).then(r => r.data.data),
    enabled:  modal.open && !modal.ins && !!form.client?.id,
  });

  const planCodes         = useLookup('plan_code');
  const statuses          = useLookup('client_status');
  const payModes          = useLookup('payment_mode');
  const payMethods        = useLookup('payment_method');
  const coverageProviders = useLookup('coverage_provider');

  const handleCreateCoverageProvider = async (label) => {
    const r = await createValueBySlug('coverage_provider', label);
    qc.invalidateQueries({ queryKey: ['lookup', 'coverage_provider'] });
    return { value: String(r.data.data.id), label: r.data.data.lookup_name };
  };

  const handleCreatePlanCode = async (label) => {
    const r = await createValueBySlug('plan_code', label);
    qc.invalidateQueries({ queryKey: ['lookup', 'plan_code'] });
    return { value: String(r.data.data.id), label: r.data.data.lookup_name };
  };

  const switchTab = t => { setTab(t); setPage(1); setExpiryDays(''); };

  const filters = {
    search:            search              || undefined,
    plan_code_id:      planCodeId          || undefined,
    status_id:         statusId            || undefined,
    payment_mode_id:   paymentModeId       || undefined,
    buying_for_id:     coverageProviderId  || undefined,
    expiry_days:       expiryDays          || undefined,
    date_type:       dateType,
    date_from:       dateFrom      || undefined,
    date_to:         dateTo        || undefined,
    expired:         tab === 'expired' ? 'true' : 'false',
    page, limit: pageSize,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['insurances-all', filters],
    queryFn:  () => getAllInsurances(filters).then(r => r.data.data),
    keepPreviousData: true,
  });

  const { data: planCodesLookup = [] } = useQuery({ queryKey: ['lookup','plan_code'],     queryFn: () => getValues('plan_code').then(r=>r.data.data) });
  const { data: statusesLookup  = [] } = useQuery({ queryKey: ['lookup','client_status'], queryFn: () => getValues('client_status').then(r=>r.data.data) });
  const { data: payModesLookup  = [] } = useQuery({ queryKey: ['lookup','payment_mode'],  queryFn: () => getValues('payment_mode').then(r=>r.data.data) });

  const rows  = data?.rows  || [];
  const total = data?.total || 0;

  const resetFilters = () => {
    setSearch(''); setPlanCodeId(''); setStatusId('');
    setPaymentModeId(''); setCoverageProviderId(''); setExpiryDays('');
    setDateType('issued'); setDateFrom(''); setDateTo(''); setPage(1);
  };

  const activeFilterCount = [planCodeId, statusId, paymentModeId, coverageProviderId, expiryDays, dateFrom, dateTo].filter(Boolean).length;
  const dateTypeLabel = dateType === 'due' ? 'Due' : dateType === 'maturity' ? 'Maturity' : 'Issued';

  const openCreate = () => { setForm(EMPTY_FORM); setModal({ open: true, ins: null }); };

  const openEdit = (row) => {
    setForm({
      client:            { id: row.client_id, name: row.client_name },
      policy_no:         row.policy_no         || '',
      identification_no: row.identification_no || '',
      plan_code_id:      row.plan_code_id  != null ? String(row.plan_code_id)  : '',
      status_id:         row.status_id     != null ? String(row.status_id)     : '',
      payment_mode_id:   row.payment_mode_id   != null ? String(row.payment_mode_id)   : '',
      payment_method_id: row.payment_method_id != null ? String(row.payment_method_id) : '',
      issued_date:       toDate(row.issued_date),
      maturity_date:     toDate(row.maturity_date),
      premium_due_date:  toDate(row.premium_due_date),
      premium:           row.premium != null ? String(row.premium) : '',
      note:              row.note || '',
      buying_for_id:     row.buying_for_id != null ? String(row.buying_for_id) : '',
    });
    setModal({ open: true, ins: row });
  };

  const closeModal = () => { setModal({ open: false, ins: null }); setForm(EMPTY_FORM); };

  const handleSave = async () => {
    if (!form.policy_no.trim()) return toast.error('Policy No is required');
    if (!modal.ins && !form.client) return toast.error('Please select a client');
    setSaving(true);
    try {
      const payload = {
        policy_no:         form.policy_no.trim(),
        identification_no: form.identification_no || null,
        plan_code_id:      form.plan_code_id      || null,
        status_id:         form.status_id         || null,
        payment_mode_id:   form.payment_mode_id   || null,
        payment_method_id: form.payment_method_id || null,
        issued_date:       form.issued_date       || null,
        maturity_date:     form.maturity_date     || null,
        premium_due_date:  form.premium_due_date  || null,
        premium:           form.premium           || null,
        note:              form.note              || null,
        buying_for_id:     form.buying_for_id     || null,
      };
      if (modal.ins) {
        await updateInsurance(modal.ins.id, payload);
        toast.success('Insurance updated');
      } else {
        await createInsurance(form.client.id, payload);
        toast.success('Insurance added');
      }
      qc.invalidateQueries({ queryKey: ['insurances-all'] });
      qc.invalidateQueries({ queryKey: ['dashboard-expiry'] });
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteInsurance(delId);
      toast.success('Insurance deleted');
      qc.invalidateQueries({ queryKey: ['insurances-all'] });
      qc.invalidateQueries({ queryKey: ['dashboard-expiry'] });
      setDelId(null);
    } catch { toast.error('Failed to delete'); } finally { setDeleting(false); }
  };

  const insColumns = [
    {
      key: 'client_name', label: 'Client', sortable: false,
      render: row => (
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full text-white text-[9px] font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #6e3ae0, #421b86)' }}>
            {row.client_name?.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()}
          </div>
          <ClientNameLink clientId={row.client_id} className="text-xs font-semibold">
            {row.client_name}
          </ClientNameLink>
        </div>
      ),
    },
    {
      key: 'buying_for', label: 'Coverage Provider', sortable: false,
      render: row => row.buying_for
        ? <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{row.buying_for}</span>
        : <span className="text-slate-400">—</span>,
    },
    {
      key: 'policy_no', label: 'Policy No', sortable: false,
      render: row => <span className="font-mono text-xs bg-slate-50 px-2 py-0.5 rounded-md text-slate-600 border border-slate-100">{row.policy_no}</span>,
    },
    {
      key: 'plan_code', label: 'Plan Code', sortable: false,
      render: row => row.plan_code
        ? <span className="text-xs font-semibold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-md border border-violet-100">{row.plan_code}</span>
        : <span className="text-slate-400">—</span>,
    },
    {
      key: 'issued_date', label: 'Issued Date', sortable: false,
      render: row => <span className="text-slate-600 text-xs">{formatDate(row.issued_date)}</span>,
    },
    {
      key: 'premium_due_date', label: 'Due Date', sortable: false,
      render: row => <span className="text-slate-600 text-xs">{formatDate(row.premium_due_date)}</span>,
    },
    {
      key: 'days_left', label: 'Due In', sortable: false,
      render: row => <TimeLabel days={row.days_left}/>,
    },
    {
      key: 'premium', label: 'Premium (RM)', sortable: false, align: 'right',
      render: row => <span className="font-semibold text-slate-800 text-xs">{formatCurrency(row.premium)}</span>,
    },
    {
      key: 'payment_mode', label: 'Payment Mode', sortable: false,
      render: row => row.payment_mode
        ? <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100">{row.payment_mode}</span>
        : <span className="text-slate-400">—</span>,
    },
    {
      key: 'status', label: 'Status', sortable: false,
      render: row => <Badge dot>{row.status || 'Unknown'}</Badge>,
    },
    ...((canUpdate || canDelete) ? [{
      key: '_actions', label: '', width: '72px', align: 'right',
      render: row => (
        <div className="flex items-center justify-end gap-1">
          {canUpdate && (
            <button type="button" onClick={() => openEdit(row)}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-brand-50 text-brand-600 transition">
              <Pencil size={13}/>
            </button>
          )}
          {canDelete && (
            <button type="button" onClick={() => setDelId(row.id)}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-50 text-red-400 transition">
              <Trash2 size={13}/>
            </button>
          )}
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-5 min-w-0">
      <PageHeader
        title="Policy Details"
        subtitle="All insurance policies across all clients"
        icon={ShieldCheck}
        color="brand"
        badge={total > 0 ? `${total} records` : undefined}
        actions={canEdit && (
          <Button icon={<Plus size={15}/>} onClick={openCreate}>Add Insurance</Button>
        )}
      />

      {/* Tabs */}
      <div className="overflow-x-auto -mx-1 px-1 scrollbar-thin max-w-full">
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit min-w-max">
        {TABS.map(t => (
          <button key={t.key} onClick={() => switchTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>
      </div>

      {/* Search + filters bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-3 focus:ring-brand-500/10 focus:border-brand-500 w-full shadow-sm transition-all"
            placeholder="Search client or policy no…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}/>
        </div>

        <button onClick={() => setShowFilters(p => !p)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${showFilters || activeFilterCount > 0 ? 'bg-brand-50 border-brand-300 text-brand-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
          <Filter size={13}/>
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-white text-[10px] font-bold">{activeFilterCount}</span>
          )}
        </button>

        {tab === 'upcoming' && (
          <>
            <div className="h-4 w-px bg-slate-200"/>
            {EXPIRY_PRESETS.map(p => (
              <button key={p.value}
                onClick={() => { setExpiryDays(expiryDays === p.value ? '' : p.value); setPage(1); }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${expiryDays === p.value ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-200 hover:border-amber-400 hover:text-amber-600'}`}>
                {p.label}
              </button>
            ))}
          </>
        )}

        {activeFilterCount > 0 && (
          <button onClick={resetFilters}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-500 hover:text-red-600 hover:border-red-200 transition-all">
            <X size={11}/> Clear
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 animate-slide-up">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Coverage Provider</label>
            <SearchableSelect value={coverageProviderId} onChange={v => { setCoverageProviderId(v); setPage(1); }} options={coverageProviders} placeholder="All providers"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Plan Code</label>
            <SearchableSelect value={planCodeId} onChange={v => { setPlanCodeId(v); setPage(1); }} options={planCodesLookup.map(o => ({ value: o.id, label: o.lookup_name }))} placeholder="All plans"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
            <SearchableSelect value={statusId} onChange={v => { setStatusId(v); setPage(1); }} options={statusesLookup.map(o => ({ value: o.id, label: o.lookup_name }))} placeholder="All statuses"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Payment Mode</label>
            <SearchableSelect value={paymentModeId} onChange={v => { setPaymentModeId(v); setPage(1); }} options={payModesLookup.map(o => ({ value: o.id, label: o.lookup_name }))} placeholder="All modes"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Date type</label>
            <select
              className={inputCls}
              value={dateType}
              onChange={e => { setDateType(e.target.value); setPage(1); }}
            >
              <option value="issued">Issued date</option>
              <option value="due">Due date</option>
              <option value="maturity">Maturity date</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{dateTypeLabel} start date</label>
            <input
              type="date"
              className={inputCls}
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{dateTypeLabel} end date</label>
            <input
              type="date"
              className={inputCls}
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={insColumns}
        rows={rows}
        loading={isLoading}
        rowKey={r => r.id}
        serverSide
        totalRows={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={v => { setPageSize(v); setPage(1); }}
        emptyMessage="No insurance records found"
        emptyIcon={<ShieldCheck size={22} className="text-slate-300"/>}
        dense
      />

      {/* Add / Edit Modal */}
      <Modal
        open={modal.open}
        onClose={closeModal}
        title={modal.ins ? `Edit — ${modal.ins.policy_no}` : 'Add Insurance'}
        size="md"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={closeModal} className="flex-1">Cancel</Button>
            <Button loading={saving} onClick={handleSave} className="flex-1">
              {modal.ins ? 'Save Changes' : 'Add Insurance'}
            </Button>
          </div>
        }
      >
        {/* Load from existing policy — create mode only */}
        {!modal.ins && form.client && clientPolicies.length > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-brand-50 border border-brand-100">
            <label className="text-xs font-semibold text-brand-700 mb-1.5 block">Load from existing policy</label>
            <select
              className="input-base text-sm"
              defaultValue=""
              onChange={e => {
                const pol = clientPolicies.find(p => String(p.id) === e.target.value);
                if (!pol) return;
                setForm(prev => ({
                  ...prev,
                  policy_no:         pol.policy_no         || '',
                  identification_no: pol.identification_no || '',
                  plan_code_id:      pol.plan_code_id  != null ? String(pol.plan_code_id)  : '',
                  status_id:         pol.status_id     != null ? String(pol.status_id)     : '',
                  payment_mode_id:   pol.payment_mode_id   != null ? String(pol.payment_mode_id)   : '',
                  payment_method_id: pol.payment_method_id != null ? String(pol.payment_method_id) : '',
                  issued_date:       toDate(pol.issued_date),
                  maturity_date:     toDate(pol.maturity_date),
                  premium_due_date:  toDate(pol.premium_due_date),
                  premium:           pol.premium != null ? String(pol.premium) : '',
                  buying_for_id:     pol.buying_for_id != null ? String(pol.buying_for_id) : '',
                  note:              pol.note || '',
                }));
              }}
            >
              <option value="">Select policy to load…</option>
              {clientPolicies.map(p => (
                <option key={p.id} value={p.id}>
                  {p.policy_no}{p.plan_code ? ` — ${p.plan_code}` : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-brand-500 mt-1">Selecting a policy pre-fills the form below.</p>
          </div>
        )}
        <InsuranceForm
          form={form} setForm={setForm}
          planCodes={planCodes} statuses={statuses}
          payModes={payModes} payMethods={payMethods}
          coverageProviders={coverageProviders}
          onCreateCoverageProvider={handleCreateCoverageProvider}
          onCreatePlanCode={handleCreatePlanCode}
          isEdit={!!modal.ins}
        />
      </Modal>

      <ConfirmDialog
        open={!!delId}
        onClose={() => setDelId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Insurance"
        message="This insurance policy will be permanently deleted."
      />
    </div>
  );
}
