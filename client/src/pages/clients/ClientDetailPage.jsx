import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit2, X, Check, User, FileText, CreditCard, ShieldCheck } from 'lucide-react';
import { getClient, updateClient } from '../../api/clients';
import { Tabs } from '../../components/ui/Tabs';
import Button from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Spinner';
import DocumentGallery from '../../components/clients/DocumentGallery';
import PaymentTab from '../../components/clients/PaymentTab';
import InsurancePoliciesTab from '../../components/clients/InsurancePoliciesTab';
import NotesTab from '../../components/clients/NotesTab';
import usePermission from '../../hooks/usePermission';

const TABS = [
  { key: 'info',       label: 'Client Info',        icon: <User size={14} /> },
  { key: 'insurances', label: 'Insurance Policies', icon: <ShieldCheck size={14} /> },
  { key: 'documents',  label: 'Documents',          icon: <FileText size={14} /> },
  { key: 'payments',   label: 'Payments',           icon: <CreditCard size={14} /> },
];

const fieldCls = (disabled) =>
  `w-full rounded-xl border px-3.5 py-2 text-sm transition-all focus:outline-none ${
    disabled
      ? 'bg-slate-50 border-slate-200 text-slate-700 cursor-default select-none'
      : 'bg-white border-slate-300 text-slate-900 focus:ring-3 focus:ring-sky-500/10 focus:border-sky-500 shadow-sm'
  }`;

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const nav    = useNavigate();
  const qc     = useQueryClient();
  const canUpdate = usePermission('clients', 'update');

  const [tab,     setTab]    = useState('info');
  const [editing, setEditing]= useState(false);
  const [saving,  setSaving] = useState(false);

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn:  () => getClient(id).then(r => r.data.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (client) reset({
      ...client,
      date_of_birth: client.date_of_birth ? String(client.date_of_birth).slice(0, 10) : '',
    });
  }, [client, reset]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      await updateClient(id, form);
      toast.success('Client updated');
      qc.invalidateQueries({ queryKey: ['client', id] });
      qc.invalidateQueries({ queryKey: ['clients'] });
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    reset(client);
    setEditing(false);
  };

  if (isLoading) return <PageLoader />;
  if (!client) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100">
        <User size={24} className="text-slate-400" />
      </div>
      <p className="text-slate-500 font-medium">Client not found</p>
    </div>
  );

  const initials = client.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const dis = !editing;

  return (
    <div className="space-y-5">
      {/* Profile header */}
      <div className="card-surface p-4 sm:p-5">
        <div className="flex flex-col gap-4 min-w-0">
          <div className="flex items-start gap-3 min-w-0">
            <button
            type="button"
            onClick={() => nav('/clients')}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
          >
            <ArrowLeft size={17} />
          </button>

          <div className="avatar avatar-lg text-base shrink-0">{initials}</div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 break-words">{client.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100 tabular-nums">
                {client.insurance_count ?? 0} {(client.insurance_count ?? 0) === 1 ? 'policy' : 'policies'}
              </span>
              {client.phone && (
                <span className="text-sm text-slate-600">{client.phone}</span>
              )}
              {client.email && (
                <span className="text-sm text-slate-500 break-all">{client.email}</span>
              )}
            </div>
          </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            {tab === 'info' && canUpdate && !editing && (
              <Button variant="secondary" icon={<Edit2 size={13} />} size="sm" onClick={() => setEditing(true)}>
                Edit
              </Button>
            )}
            {editing && (
              <>
                <Button variant="ghost" icon={<X size={13} />} size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button icon={<Check size={13} />} size="sm" loading={saving} onClick={handleSubmit(handleSave)}>
                  Save
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs + Notes */}
      <div className="card-surface overflow-hidden">
        <div className="border-b border-slate-100 px-4 sm:px-6 pt-2">
          <Tabs tabs={TABS} active={tab} onChange={t => { setTab(t); handleCancel(); }} />
        </div>

        <div className="p-4 sm:p-6">
          {tab === 'info' && (
            <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">

                <Field label="Client Name">
                  <input className={fieldCls(dis)} disabled={dis} {...register('name', { required: true })} />
                  {errors.name && <p className="text-xs text-red-500 mt-0.5">Required</p>}
                </Field>

                <Field label="IC / Passport No">
                  <input className={fieldCls(dis)} disabled={dis} {...register('identification_no')} placeholder="IC or passport number"/>
                </Field>

                <Field label="Date of Birth">
                  <input type="date" className={fieldCls(dis)} disabled={dis} {...register('date_of_birth')} />
                </Field>

                <Field label="Phone Number">
                  <input className={fieldCls(dis)} disabled={dis} {...register('phone')} />
                </Field>

                <Field label="Email">
                  <input type="email" className={fieldCls(dis)} disabled={dis} {...register('email')} />
                </Field>

                <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                  <Field label="Home Address">
                    <textarea
                      rows={3}
                      className={`${fieldCls(dis)} resize-none`}
                      disabled={dis}
                      {...register('address')}
                    />
                  </Field>
                </div>
              </div>
            </form>
          )}
          {tab === 'documents'  && <DocumentGallery clientId={id} />}
          {tab === 'payments'   && <PaymentTab clientId={id} />}
          {tab === 'insurances' && <InsurancePoliciesTab clientId={id} clientIdentificationNo={client.identification_no || ''} />}
        </div>
      </div>

      {/* Notes — only on Client Info tab */}
      {tab === 'info' && (
        <div className="card-surface p-4 sm:p-6">
          <NotesTab clientId={id} />
        </div>
      )}
    </div>
  );
}
