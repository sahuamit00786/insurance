import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { createAppointment, updateAppointment, deleteAppointment } from '../../api/appointments';
import { getClients } from '../../api/clients';
import useLookup from '../../hooks/useLookup';
import usePermission from '../../hooks/usePermission';
import { Clock, User, Trash2, Plus, Pencil, ChevronLeft, CalendarDays } from 'lucide-react';

const EMPTY_FORM = { client_id: '', guest_name: '', appointment_time: '', appointment_type_id: '', note: '' };

export default function AppointmentModal({ open, onClose, date, appointments = [], onSuccess }) {
  const canEdit   = usePermission('dashboard', 'edit');
  const canUpdate = usePermission('dashboard', 'update');
  const canDelete = usePermission('dashboard', 'delete');

  const [mode,       setMode]       = useState('list'); // 'list' | 'create' | 'edit'
  const [editAppt,   setEditAppt]   = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [clientType, setClientType] = useState('client'); // 'client' | 'other'
  const [saving,     setSaving]     = useState(false);
  const [delId,      setDelId]      = useState(null);
  const [deleting,   setDeleting]   = useState(false);

  useEffect(() => {
    if (open) {
      setMode('list'); setForm(EMPTY_FORM); setEditAppt(null);
      setDelId(null); setClientType('client');
    }
  }, [open, date]);

  const { data: clientsData = [] } = useQuery({
    queryKey: ['clients-all'],
    queryFn:  () => getClients({ limit: 1000 }).then(r => r.data.data.rows),
    enabled:  open,
  });
  const types = useLookup('appointment_type');

  const openCreate = () => {
    setForm(EMPTY_FORM); setEditAppt(null);
    setClientType('client'); setMode('create');
  };

  const openEdit = (a) => {
    const isGuest = !a.client_id;
    setClientType(isGuest ? 'other' : 'client');
    setForm({
      client_id:           isGuest ? '' : String(a.client_id),
      guest_name:          a.guest_name || '',
      appointment_time:    a.appointment_time    || '',
      appointment_type_id: a.appointment_type_id != null ? String(a.appointment_type_id) : '',
      note:                a.note || '',
    });
    setEditAppt(a);
    setMode('edit');
  };

  const backToList = () => { setMode('list'); setForm(EMPTY_FORM); setEditAppt(null); };

  const handleSave = async () => {
    if (clientType === 'client' && !form.client_id) return toast.error('Select a client');
    if (clientType === 'other' && !form.guest_name.trim()) return toast.error('Enter a name');
    setSaving(true);
    try {
      const payload = {
        client_id:           clientType === 'client' ? Number(form.client_id) : null,
        guest_name:          clientType === 'other'  ? form.guest_name.trim() : null,
        appointment_date:    date,
        appointment_time:    form.appointment_time    || null,
        appointment_type_id: form.appointment_type_id || null,
        note:                form.note               || null,
      };
      if (mode === 'edit') {
        await updateAppointment(editAppt.id, payload);
        toast.success('Appointment updated');
      } else {
        await createAppointment(payload);
        toast.success('Appointment created');
      }
      onSuccess?.();
      backToList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAppointment(delId);
      toast.success('Appointment deleted');
      onSuccess?.();
      setDelId(null);
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const isForm = mode === 'create' || mode === 'edit';
  const displayDate = date ? format(new Date(date + 'T00:00:00'), 'EEEE, d MMMM yyyy') : '';

  const modalTitle = (
    <div className="flex items-center gap-2.5">
      {isForm && (
        <button
          type="button"
          onClick={backToList}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition shrink-0"
        >
          <ChevronLeft size={15} />
        </button>
      )}
      <div>
        <p className="font-semibold text-slate-800 leading-tight">
          {mode === 'edit' ? 'Edit Appointment' : mode === 'create' ? 'New Appointment' : 'Appointments'}
        </p>
        <p className="text-xs text-slate-400 font-normal mt-0.5">{displayDate}</p>
      </div>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title={modalTitle} size="sm">

      {/* ── List view ──────────────────────────────────────────── */}
      {mode === 'list' && (
        <div className="space-y-2.5">
          {appointments.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
                <CalendarDays size={22} className="text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">No appointments</p>
                <p className="text-xs text-slate-400 mt-0.5">Click below to schedule one</p>
              </div>
            </div>
          )}

          {appointments.map(a => (
            <div key={a.id} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <User size={12} className="text-slate-400 shrink-0" />
                  <span className="text-sm font-semibold text-slate-800 truncate">{a.client_name}</span>
                </div>
                {a.appointment_time && (
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-400 shrink-0" />
                    <span className="text-xs text-slate-500">{a.appointment_time}</span>
                  </div>
                )}
                {a.appointment_type && (
                  <span className="inline-block text-xs font-medium text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full">
                    {a.appointment_type}
                  </span>
                )}
                {a.note && (
                  <p className="text-xs text-slate-500 leading-relaxed">{a.note}</p>
                )}
              </div>

              {(canUpdate || canDelete) && (
                <div className="flex flex-col gap-1 shrink-0">
                  {canUpdate && (
                    <button
                      type="button"
                      onClick={() => openEdit(a)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-brand-50 text-brand-600 transition"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                  )}

                  {canDelete && (
                    delId === a.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={handleDelete}
                          disabled={deleting}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500 text-white hover:bg-red-600 transition text-[10px] font-bold"
                          title="Confirm delete"
                        >
                          {deleting ? '…' : '✓'}
                        </button>
                        <button
                          onClick={() => setDelId(null)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition text-[10px] font-bold"
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDelId(a.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-50 text-red-400 transition"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          ))}

          {canEdit && (
            <button
              type="button"
              onClick={openCreate}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 text-sm font-medium text-slate-500 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50/40 transition-all"
            >
              <Plus size={15} />
              Add Appointment
            </button>
          )}
        </div>
      )}

      {/* ── Create / Edit form ────────────────────────────────── */}
      {isForm && (
        <div className="space-y-4">
          {/* Radio: Client / Other */}
          <div>
            <label className="label-base mb-2">Appointment for</label>
            <div className="flex gap-3">
              {[['client', 'Client'], ['other', 'Other']].map(([val, label]) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="clientType"
                    value={val}
                    checked={clientType === val}
                    onChange={() => {
                      setClientType(val);
                      setForm(p => ({ ...p, client_id: '', guest_name: '' }));
                    }}
                    className="accent-brand-600 w-4 h-4"
                  />
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Client dropdown or name input */}
          {clientType === 'client' ? (
            <div>
              <label className="label-base">Client <span className="text-red-500">*</span></label>
              <select className="input-base" value={form.client_id}
                onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))}>
                <option value="">Select client…</option>
                {clientsData.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="label-base">Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="input-base"
                placeholder="Enter full name…"
                value={form.guest_name}
                onChange={e => setForm(p => ({ ...p, guest_name: e.target.value }))}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Time</label>
              <input type="time" className="input-base"
                placeholder="HH:MM"
                value={form.appointment_time}
                onChange={e => setForm(p => ({ ...p, appointment_time: e.target.value }))} />
            </div>
            <div>
              <label className="label-base">Type</label>
              <select className="input-base" value={form.appointment_type_id}
                onChange={e => setForm(p => ({ ...p, appointment_type_id: e.target.value }))}>
                <option value="">Select type…</option>
                {types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label-base">Note</label>
            <textarea className="input-base resize-none" rows={3}
              value={form.note}
              onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              placeholder="Optional note…" />
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" onClick={backToList} className="flex-1">Cancel</Button>
            <Button loading={saving} onClick={handleSave} className="flex-1">
              {mode === 'edit' ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
