import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { getInsurances, createInsurance, updateInsurance, deleteInsurance } from '../../api/clients';
import { createValueBySlug } from '../../api/lookup';
import DataTable from '../ui/DataTable';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import ConfirmDialog from '../ui/ConfirmDialog';
import SearchableSelect from '../ui/SearchableSelect';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { AlertTriangle, Clock, ShieldCheck } from 'lucide-react';

function humanTime(days) {
  const n = Math.abs(parseInt(days));
  if (n < 30)  return `${n}d`;
  if (n < 365) { const m = Math.round(n / 30); return `${m} mo`; }
  const y = Math.floor(n / 365), rem = Math.round((n % 365) / 30);
  return rem > 0 ? `${y}y ${rem}mo` : `${y}y`;
}

function DueDateCell({ days }) {
  if (days == null) return <span className="text-slate-400">—</span>;
  const n = parseInt(days);
  const label = humanTime(n);
  if (n < 0)    return <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full"><AlertTriangle size={10}/> {label} ago</span>;
  if (n <= 30)  return <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full"><AlertTriangle size={10}/> {label}</span>;
  if (n <= 90)  return <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"><Clock size={10}/> {label}</span>;
  return <span className="text-xs font-medium text-slate-500">{label}</span>;
}
import useLookup from '../../hooks/useLookup';
import usePermission from '../../hooks/usePermission';

const EMPTY_FORM = {
  policy_no:            '',
  identification_no:    '',
  buying_for_id:        '',
  plan_code_id:         '',
  issued_date:       '',
  maturity_date:     '',
  premium_due_date:  '',
  premium:           '',
  status_id:         '',
  payment_mode_id:   '',
  payment_method_id: '',
  note:              '',
};

function toDateInput(val) {
  if (!val) return '';
  return String(val).slice(0, 10);
}

const FIELD_PLACEHOLDERS = {
  policy_no:         'e.g. POL-0001',
  identification_no: 'IC or passport no',
  premium:           '0.00',
};

function PolicyForm({ form, setForm, planCodes, statuses, payModes, payMethods, coverageProviders, onCreateCoverageProvider, onCreatePlanCode }) {
  const field = (key, label, type = 'text') => (
    <div key={key}>
      <label className="label-base">{label}</label>
      <input
        type={type}
        step={type === 'number' ? '0.01' : undefined}
        className="input-base"
        placeholder={FIELD_PLACEHOLDERS[key] || ''}
        value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
      />
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
      <div className="grid grid-cols-2 gap-3">
        {field('policy_no',         'Policy No *')}
        {field('identification_no', 'IC / Passport No')}
        {sel('buying_for_id',       'Coverage Provider', coverageProviders, onCreateCoverageProvider)}
        {sel('plan_code_id',        'Plan Code',         planCodes,         onCreatePlanCode)}
        {sel('status_id',           'Status',          statuses)}
        {sel('payment_mode_id',     'Payment Mode',    payModes)}
        {sel('payment_method_id',   'Payment Method',  payMethods)}
        {field('issued_date',       'Issued Date',     'date')}
        {field('maturity_date',     'Maturity Date',   'date')}
        {field('premium_due_date',  'Premium Due Date','date')}
        {field('premium',           'Premium (RM)',    'number')}
      </div>
      <div>
        <label className="label-base">Note</label>
        <textarea
          className="input-base resize-none"
          rows={2}
          placeholder="Add a note for this policy…"
          value={form.note}
          onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
        />
      </div>
    </div>
  );
}

export default function InsurancePoliciesTab({ clientId, clientIdentificationNo = '' }) {
  const qc = useQueryClient();
  const canEdit   = usePermission('clients', 'edit');
  const canUpdate = usePermission('clients', 'update');
  const canDelete = usePermission('clients', 'delete');

  const [modal, setModal]       = useState({ open: false, policy: null });
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [delId, setDelId]       = useState(null);
  const [deleting, setDeleting] = useState(false);

  const planCodes          = useLookup('plan_code');
  const statuses           = useLookup('client_status');
  const payModes           = useLookup('payment_mode');
  const payMethods         = useLookup('payment_method');
  const coverageProviders  = useLookup('coverage_provider');

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

  const { data: insurances = [] } = useQuery({
    queryKey: ['insurances', clientId],
    queryFn:  () => getInsurances(clientId).then(r => r.data.data),
  });

  const openCreate = () => { setForm({ ...EMPTY_FORM, identification_no: clientIdentificationNo }); setModal({ open: true, policy: null }); };

  const openEdit = (p) => {
    setForm({
      policy_no:         p.policy_no         || '',
      identification_no: p.identification_no || '',
      plan_code_id:      p.plan_code_id      != null ? String(p.plan_code_id)      : '',
      issued_date:       toDateInput(p.issued_date),
      maturity_date:     toDateInput(p.maturity_date),
      premium_due_date:  toDateInput(p.premium_due_date),
      premium:           p.premium           != null  ? String(p.premium)           : '',
      status_id:         p.status_id         != null ? String(p.status_id)          : '',
      payment_mode_id:   p.payment_mode_id   != null ? String(p.payment_mode_id)   : '',
      payment_method_id: p.payment_method_id != null ? String(p.payment_method_id) : '',
      buying_for_id:     p.buying_for_id     != null ? String(p.buying_for_id)     : '',
      note:              p.note || '',
    });
    setModal({ open: true, policy: p });
  };

  const closeModal = () => { setModal({ open: false, policy: null }); setForm(EMPTY_FORM); };

  const handleSave = async () => {
    if (!form.policy_no.trim()) return toast.error('Policy No is required');
    setSaving(true);
    try {
      const payload = {
        ...form,
        policy_no:         form.policy_no.trim(),
        identification_no: form.identification_no || null,
        plan_code_id:      form.plan_code_id      || null,
        status_id:         form.status_id         || null,
        payment_mode_id:   form.payment_mode_id   || null,
        payment_method_id: form.payment_method_id || null,
        premium:           form.premium           || null,
        premium_due_date:  form.premium_due_date  || null,
        note:              form.note              || null,
        buying_for_id:     form.buying_for_id     || null,
      };
      if (modal.policy) {
        await updateInsurance(modal.policy.id, payload);
        toast.success('Policy updated');
      } else {
        await createInsurance(clientId, payload);
        toast.success('Policy added');
      }
      qc.invalidateQueries({ queryKey: ['insurances', clientId] });
      qc.invalidateQueries({ queryKey: ['client', clientId] });
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['dashboard-expiry'] });
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save policy');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteInsurance(delId);
      toast.success('Policy deleted');
      qc.invalidateQueries({ queryKey: ['insurances', clientId] });
      qc.invalidateQueries({ queryKey: ['client', clientId] });
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['dashboard-expiry'] });
      setDelId(null);
    } catch {
      toast.error('Failed to delete policy');
    } finally {
      setDeleting(false);
    }
  };

  const polColumns = [
    { key: 'buying_for',       label: 'Coverage Provider', sortable: true, render: i => i.buying_for ? <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{i.buying_for}</span> : <span className="text-slate-300">—</span> },
    { key: 'policy_no',        label: 'Policy No',  sortable: true,  render: i => <span className="font-mono text-xs font-medium text-slate-800">{i.policy_no}</span> },
    { key: 'plan_code',        label: 'Plan Code',  sortable: true,  render: i => i.plan_code ? <span className="text-xs font-semibold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-md border border-violet-100">{i.plan_code}</span> : <span className="text-slate-300">—</span> },
    { key: 'issued_date',      label: 'Issued',        sortable: true,  render: i => <span className="text-xs text-slate-600">{formatDate(i.issued_date)}</span> },
    { key: 'maturity_date',    label: 'Maturity Date', sortable: true,  render: i => i.maturity_date ? <span className="text-xs text-slate-600">{formatDate(i.maturity_date)}</span> : <span className="text-slate-300">—</span> },
    { key: 'premium_due_date', label: 'Due Date',      sortable: true,  render: i => <span className="text-xs text-slate-600">{formatDate(i.premium_due_date)}</span> },
    { key: 'days_left',        label: 'Due In',     sortable: true,  render: i => <DueDateCell days={i.days_left}/> },
    { key: 'premium',          label: 'Premium',    sortable: true,  align: 'right', render: i => <span className="text-xs font-semibold text-slate-800">{formatCurrency(i.premium)}</span> },
    { key: 'payment_mode',     label: 'Mode',       sortable: true,  render: i => i.payment_mode ? <span className="text-xs text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">{i.payment_mode}</span> : <span className="text-slate-300">—</span> },
    { key: 'status',           label: 'Status',     sortable: true,  render: i => <Badge dot>{i.status || 'Unknown'}</Badge> },
    ...((canUpdate || canDelete) ? [{
      key: '_actions', label: '', width: '72px', align: 'right',
      render: i => (
        <div className="flex items-center justify-end gap-1">
          {canUpdate && <button type="button" onClick={() => openEdit(i)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-brand-50 text-brand-600 transition"><Pencil size={14}/></button>}
          {canDelete && <button type="button" onClick={() => setDelId(i.id)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-red-50 text-red-400 transition"><Trash2 size={14}/></button>}
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <Button icon={<Plus size={15} />} size="sm" onClick={openCreate}>Add Policy</Button>
        </div>
      )}

      <DataTable
        columns={polColumns}
        rows={insurances}
        rowKey={i => i.id}
        defaultSort={{ key: 'premium_due_date', dir: 'asc' }}
        defaultPageSize={10}
        emptyMessage="No policies linked"
        emptyIcon={<ShieldCheck size={22} className="text-slate-300"/>}
      />

      <Modal
        open={modal.open}
        onClose={closeModal}
        title={modal.policy ? 'Edit Insurance Policy' : 'Add Insurance Policy'}
        size="md"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={closeModal} className="flex-1">Cancel</Button>
            <Button loading={saving} onClick={handleSave} className="flex-1">
              {modal.policy ? 'Save Changes' : 'Add Policy'}
            </Button>
          </div>
        }
      >
        <PolicyForm
          form={form} setForm={setForm}
          planCodes={planCodes} statuses={statuses}
          payModes={payModes} payMethods={payMethods}
          coverageProviders={coverageProviders}
          onCreateCoverageProvider={handleCreateCoverageProvider}
          onCreatePlanCode={handleCreatePlanCode}
        />
      </Modal>

      <ConfirmDialog
        open={!!delId}
        onClose={() => setDelId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Policy"
        message="This insurance policy will be permanently deleted."
      />
    </div>
  );
}
