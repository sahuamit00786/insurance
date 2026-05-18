import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2, Pin, PinOff, Pencil, Check, X, StickyNote } from 'lucide-react';
import { getNotes, createNote, updateNote, deleteNote } from '../../api/clients';
import usePermission from '../../hooks/usePermission';
import { formatDate } from '../../utils/formatters';

const COLORS = [
  { key: 'blue',   bg: 'bg-blue-100',   border: 'border-blue-200',   dot: 'bg-blue-400',   accent: 'bg-blue-200'   },
  { key: 'green',  bg: 'bg-green-100',  border: 'border-green-200',  dot: 'bg-green-400',  accent: 'bg-green-200'  },
  { key: 'yellow', bg: 'bg-yellow-100', border: 'border-yellow-200', dot: 'bg-yellow-400', accent: 'bg-yellow-200' },
  { key: 'pink',   bg: 'bg-pink-100',   border: 'border-pink-200',   dot: 'bg-pink-400',   accent: 'bg-pink-200'   },
  { key: 'purple', bg: 'bg-purple-100', border: 'border-purple-200', dot: 'bg-purple-400', accent: 'bg-purple-200' },
  { key: 'orange', bg: 'bg-orange-100', border: 'border-orange-200', dot: 'bg-orange-400', accent: 'bg-orange-200' },
];

function getColor(key) {
  return COLORS.find(c => c.key === key) || COLORS[0];
}

const EMPTY_FORM = { title: '', body: '', color: 'blue' };

function NoteCard({ note, clientId, canUpdate, canDelete }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: note.title || '', body: note.body, color: note.color });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const c = getColor(note.color);

  const handleSave = async () => {
    if (!form.body.trim()) return toast.error('Note body required');
    setSaving(true);
    try {
      await updateNote(clientId, note.id, form);
      qc.invalidateQueries({ queryKey: ['notes', clientId] });
      setEditing(false);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handlePin = async () => {
    try {
      await updateNote(clientId, note.id, { pinned: note.pinned ? 0 : 1 });
      qc.invalidateQueries({ queryKey: ['notes', clientId] });
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteNote(clientId, note.id);
      qc.invalidateQueries({ queryKey: ['notes', clientId] });
      toast.success('Note deleted');
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); }
  };

  const editColor = getColor(form.color);

  return (
    <div className={`relative flex flex-col rounded-2xl border-2 ${editing ? `${editColor.bg} ${editColor.border}` : `${c.bg} ${c.border}`} p-4 shadow-sm transition-all duration-200 min-h-[200px]`}>
      {/* Dot accent top-left */}
      <div className={`absolute top-0 left-4 h-1.5 w-8 rounded-b-full ${editing ? editColor.accent : c.accent}`} />

      {/* Header row */}
      <div className="flex items-center justify-between mb-2 mt-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span>{formatDate(note.created_at, 'dd MMM yyyy, h:mm a')}</span>
          {note.created_by_name && <span className="text-slate-400">· {note.created_by_name}</span>}
        </div>
        <div className="flex items-center gap-0.5">
          {canUpdate && !editing && (
            <>
              <button type="button" onClick={handlePin}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-black/10 text-brand-600 transition"
                title={note.pinned ? 'Unpin' : 'Pin'}>
                {note.pinned ? <PinOff size={13}/> : <Pin size={13}/>}
              </button>
              <button type="button" onClick={() => { setForm({ title: note.title || '', body: note.body, color: note.color }); setEditing(true); }}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-black/10 text-brand-600 transition">
                <Pencil size={13}/>
              </button>
            </>
          )}
          {canDelete && !editing && (
            confirmDel ? (
              <div className="flex items-center gap-1">
                <button onClick={handleDelete} disabled={deleting}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500 text-white text-[10px] font-bold hover:bg-red-600 transition">
                  {deleting ? '…' : '✓'}
                </button>
                <button onClick={() => setConfirmDel(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition text-[10px] font-bold">
                  ✕
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmDel(true)}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-100 text-red-400 transition">
                <Trash2 size={13}/>
              </button>
            )
          )}
          {editing && (
            <>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition">
                <Check size={13}/>
              </button>
              <button type="button" onClick={() => setEditing(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 transition">
                <X size={13}/>
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="flex flex-col gap-2 flex-1">
          <input
            className="w-full rounded-lg border border-black/10 bg-white/50 px-3 py-1.5 text-sm font-bold text-slate-800 focus:outline-none focus:bg-white placeholder:font-normal placeholder:text-slate-400"
            placeholder="Title (optional)"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          />
          <textarea
            className="flex-1 w-full rounded-lg border border-black/10 bg-white/50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:bg-white resize-none leading-relaxed"
            rows={4}
            value={form.body}
            onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
          />
          <div className="flex gap-1.5 mt-1">
            {COLORS.map(col => (
              <button key={col.key} type="button"
                onClick={() => setForm(p => ({ ...p, color: col.key }))}
                className={`h-5 w-5 rounded-full ${col.dot} border-2 transition ${form.color === col.key ? 'border-slate-700 scale-110' : 'border-transparent'}`}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1">
          {!!note.pinned && <Pin size={11} className="inline mr-1 text-slate-500 mb-0.5"/>}
          {note.title && <h3 className="font-bold text-slate-800 text-sm mb-1.5">{note.title}</h3>}
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{note.body}</p>
        </div>
      )}
    </div>
  );
}

export default function NotesTab({ clientId }) {
  const qc = useQueryClient();
  const canEdit   = usePermission('clients', 'edit');
  const canUpdate = usePermission('clients', 'update');
  const canDelete = usePermission('clients', 'delete');

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', clientId],
    queryFn:  () => getNotes(clientId).then(r => r.data.data),
  });

  const handleAdd = async () => {
    if (!form.body.trim()) return toast.error('Note body required');
    setSaving(true);
    try {
      await createNote(clientId, form);
      qc.invalidateQueries({ queryKey: ['notes', clientId] });
      setForm(EMPTY_FORM);
      setOpen(false);
      toast.success('Note added');
    } catch { toast.error('Failed to add note'); }
    finally { setSaving(false); }
  };

  const addColor = getColor(form.color);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Notes</h3>
        {canEdit && !open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 text-white text-xs font-semibold hover:bg-slate-800 transition"
          >
            <Plus size={13}/> Add Note
          </button>
        )}
      </div>

      {/* Add note form */}
      {canEdit && open && (
            <div className={`rounded-2xl border-2 ${addColor.bg} ${addColor.border} p-4 shadow-sm`}>
              <div className={`absolute top-0 left-4 h-1.5 w-8 rounded-b-full ${addColor.accent}`} style={{position:'relative', marginTop:'-4px', marginBottom:'8px'}}/>
              <div className="flex flex-col gap-2">
                <input
                  className="w-full rounded-lg border border-black/10 bg-white/60 px-3 py-1.5 text-sm font-bold text-slate-800 focus:outline-none focus:bg-white placeholder:font-normal placeholder:text-slate-400"
                  placeholder="Title (optional)"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  autoFocus
                />
                <textarea
                  className="w-full rounded-lg border border-black/10 bg-white/60 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:bg-white resize-none leading-relaxed"
                  rows={4}
                  placeholder="Write your note here..."
                  value={form.body}
                  onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                />
                <div className="flex items-center justify-between mt-1">
                  <div className="flex gap-1.5">
                    {COLORS.map(col => (
                      <button key={col.key} type="button"
                        onClick={() => setForm(p => ({ ...p, color: col.key }))}
                        className={`h-5 w-5 rounded-full ${col.dot} border-2 transition ${form.color === col.key ? 'border-slate-700 scale-110' : 'border-transparent'}`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setOpen(false); setForm(EMPTY_FORM); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white/60 hover:bg-white border border-black/10 transition">
                      Cancel
                    </button>
                    <button type="button" onClick={handleAdd} disabled={saving}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-700 hover:bg-slate-800 transition disabled:opacity-60">
                      {saving ? 'Saving…' : 'Add Note'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
      )}

      {/* Notes grid */}
      {isLoading ? (
        <div className="text-center py-8 text-sm text-slate-400">Loading notes…</div>
      ) : notes.length === 0 ? (
        <div className="text-center py-12">
          <StickyNote size={32} className="mx-auto mb-3 text-slate-200"/>
          <p className="text-sm text-slate-400">No notes yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {notes.map(note => (
            <NoteCard key={note.id} note={note} clientId={clientId} canUpdate={canUpdate} canDelete={canDelete}/>
          ))}
        </div>
      )}
    </div>
  );
}
