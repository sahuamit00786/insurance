import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2, CreditCard } from 'lucide-react';
import { getPayments, createPayment, deletePayment, getInsurances } from '../../api/clients';
import DataTable from '../ui/DataTable';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import { formatDate, formatCurrency } from '../../utils/formatters';
import useLookup from '../../hooks/useLookup';
import usePermission from '../../hooks/usePermission';

const EMPTY_FORM = {
  insurance_id: '', payment_date: '', amount: '', receipt_no: '',
  payment_mode_id: '', payment_method_id: '', remarks: '',
};

export default function PaymentTab({ clientId }) {
  const qc = useQueryClient();
  const canEdit   = usePermission('clients', 'edit');
  const canDelete = usePermission('clients', 'delete');
  const [addOpen,  setAddOpen]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [delId,    setDelId]    = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const payModes   = useLookup('payment_mode');
  const payMethods = useLookup('payment_method');

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', clientId],
    queryFn:  () => getPayments(clientId).then(r => r.data.data),
  });

  const { data: insurances = [] } = useQuery({
    queryKey: ['insurances', clientId],
    queryFn:  () => getInsurances(clientId).then(r => r.data.data),
    enabled:  addOpen,
  });

  const handleAdd = async () => {
    if (!form.payment_date || !form.amount) return toast.error('Date and amount required');
    setSaving(true);
    try {
      await createPayment(clientId, form);
      toast.success('Payment added');
      qc.invalidateQueries({ queryKey: ['payments', clientId] });
      setAddOpen(false);
      setForm(EMPTY_FORM);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePayment(delId);
      toast.success('Payment deleted');
      qc.invalidateQueries({ queryKey: ['payments', clientId] });
      setDelId(null);
    } catch { toast.error('Failed'); }
    finally { setDeleting(false); }
  };

  const total = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);

  const columns = [
    { key: 'payment_date',   label: 'Date',    sortable: true,  render: p => <span className="text-xs text-slate-600">{formatDate(p.payment_date)}</span> },
    { key: 'amount',         label: 'Amount',  sortable: true,  align: 'right', render: p => <span className="font-semibold text-emerald-600">{formatCurrency(p.amount)}</span> },
    { key: 'receipt_no',     label: 'Receipt', sortable: true,  render: p => <span className="font-mono text-xs">{p.receipt_no || '—'}</span> },
    { key: 'payment_mode',   label: 'Mode',    sortable: true,  render: p => p.payment_mode   ? <span className="text-xs text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-md">{p.payment_mode}</span>   : <span className="text-slate-300">—</span> },
    { key: 'payment_method', label: 'Method',  sortable: true,  render: p => p.payment_method ? <span className="text-xs text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-md">{p.payment_method}</span> : <span className="text-slate-300">—</span> },
    { key: 'remarks',        label: 'Remarks', sortable: false, render: p => <span className="text-xs text-slate-500 max-w-[160px] truncate block">{p.remarks || '—'}</span> },
    ...(canDelete ? [{
      key: '_del', label: '', width: '44px', align: 'right',
      render: p => (
        <button onClick={() => setDelId(p.id)} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-50 text-red-400 transition">
          <Trash2 size={13}/>
        </button>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium">Total Payments</p>
          <p className="text-xl font-bold text-emerald-600">{formatCurrency(total)}</p>
        </div>
        {canEdit && <Button icon={<Plus size={15}/>} size="sm" onClick={() => setAddOpen(true)}>Add Payment</Button>}
      </div>

      <DataTable
        columns={columns}
        rows={payments}
        loading={isLoading}
        rowKey={p => p.id}
        defaultSort={{ key: 'payment_date', dir: 'desc' }}
        defaultPageSize={10}
        emptyMessage="No payments recorded"
        emptyIcon={<CreditCard size={22} className="text-slate-300"/>}
      />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Payment" size="sm">
        <div className="space-y-4">
          {/* Insurance policy */}
          <div>
            <label className="label-base">Insurance Policy</label>
            <select className="input-base" value={form.insurance_id}
              onChange={e => setForm(p => ({ ...p, insurance_id: e.target.value }))}>
              <option value="">Select policy no…</option>
              {insurances.map(i => (
                <option key={i.id} value={i.id}>
                  {i.policy_no}{i.plan_code ? ` — ${i.plan_code}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-base">Date <span className="text-red-500">*</span></label>
            <input type="date" className="input-base" value={form.payment_date}
              onChange={e => setForm(p => ({ ...p, payment_date: e.target.value }))} />
          </div>

          <div>
            <label className="label-base">Amount (RM) <span className="text-red-500">*</span></label>
            <input type="number" step="0.01" className="input-base" placeholder="0.00"
              value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
          </div>

          <div>
            <label className="label-base">Receipt No</label>
            <input type="text" className="input-base" placeholder="e.g. RCP-001"
              value={form.receipt_no}
              onChange={e => setForm(p => ({ ...p, receipt_no: e.target.value }))} />
          </div>

          {[['payment_mode_id', 'Payment Mode', payModes], ['payment_method_id', 'Payment Method', payMethods]].map(([k, l, opts]) => (
            <div key={k}>
              <label className="label-base">{l}</label>
              <select className="input-base" value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}>
                <option value="">Select…</option>
                {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}

          <div>
            <label className="label-base">Remarks</label>
            <textarea className="input-base resize-none" rows={2}
              placeholder="Optional notes…"
              value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" onClick={() => setAddOpen(false)} className="flex-1">Cancel</Button>
            <Button loading={saving} onClick={handleAdd} className="flex-1">Save</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)} onConfirm={handleDelete} loading={deleting}
        title="Delete Payment" message="This payment record will be permanently deleted."/>
    </div>
  );
}
