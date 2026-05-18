import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Eye, MessageSquare, Zap } from 'lucide-react';
import usePermission from '../../hooks/usePermission';
import PageHeader from '../../components/ui/PageHeader';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../../api/templates';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import WhatsAppPreview from '../../components/ui/WhatsAppPreview';
import { PageLoader } from '../../components/ui/Spinner';
import { TOKEN_GROUPS, CLIENT_TOKENS, applyTemplateTokens, extractTemplateTokens, TEMPLATE_DUMMY_VALUES } from '../../utils/templateTokens';
import { formatDate } from '../../utils/formatters';

function TokenPill({ token, label, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(`{${token}}`)}
      title={label}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 text-xs font-medium border border-brand-200 hover:bg-brand-100 transition"
    >
      <Zap size={10} /> {token}
    </button>
  );
}

function TemplateCard({ tmpl, onView, onEdit, onDelete, canUpdate, canDelete }) {
  const preview = applyTemplateTokens(tmpl.body).slice(0, 120);
  const tokens = extractTemplateTokens(tmpl.body);

  return (
    <div className="group card-surface hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700 shrink-0">
              <MessageSquare size={17} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">{tmpl.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{formatDate(tmpl.updated_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onView(tmpl)}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition"
              title="View"
            >
              <Eye size={13} />
            </button>
            <div className="flex items-center gap-0.5">
              {canUpdate && (
                <button
                  type="button"
                  onClick={() => onEdit(tmpl)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-sky-50 text-sky-500 transition"
                  title="Edit"
                >
                  <Edit2 size={13} />
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(tmpl.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-50 text-red-400 transition"
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-500 leading-relaxed">
          {preview}{tmpl.body.length > 120 ? '…' : ''}
        </p>
      </div>

      {tokens.length > 0 && (
        <div className="px-5 py-3 border-t border-slate-50 flex flex-wrap gap-1.5">
          {tokens.slice(0, 5).map(t => (
            <span key={t} className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[10px] font-semibold border border-violet-100">
              {'{' + t + '}'}
            </span>
          ))}
          {tokens.length > 5 && (
            <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-400 text-[10px] font-semibold border border-slate-100">
              +{tokens.length - 5} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function TemplatesPage() {
  const qc = useQueryClient();
  const canEdit   = usePermission('templates', 'edit');
  const canUpdate = usePermission('templates', 'update');
  const canDelete = usePermission('templates', 'delete');
  const [editModal, setEditModal] = useState({ open: false, tmpl: null });
  const [viewTmpl, setViewTmpl] = useState(null);
  const [delId, setDelId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', body: '' });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => getTemplates().then(r => r.data.data),
  });

  const livePreview = useMemo(() => applyTemplateTokens(form.body), [form.body]);

  const openAdd = () => {
    setForm({ name: '', body: '' });
    setEditModal({ open: true, tmpl: null });
  };

  const openEdit = (tmpl) => {
    setForm({ name: tmpl.name, body: tmpl.body });
    setEditModal({ open: true, tmpl });
  };

  const closeEdit = () => setEditModal({ open: false, tmpl: null });

  const insertToken = (token) => {
    const ta = document.getElementById('template-body');
    if (!ta) {
      setForm(p => ({ ...p, body: p.body + `{${token}}` }));
      return;
    }
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const tokenStr = `{${token}}`;
    const newBody = form.body.slice(0, s) + tokenStr + form.body.slice(e);
    setForm(p => ({ ...p, body: newBody }));
    setTimeout(() => {
      ta.setSelectionRange(s + tokenStr.length, s + tokenStr.length);
      ta.focus();
    }, 0);
  };

  const handleSave = async () => {
    if (!form.name || !form.body) return toast.error('Name and body required');
    setSaving(true);
    try {
      if (editModal.tmpl) {
        await updateTemplate(editModal.tmpl.id, form);
        toast.success('Template updated');
      } else {
        await createTemplate(form);
        toast.success('Template created');
      }
      qc.invalidateQueries({ queryKey: ['templates'] });
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
      await deleteTemplate(delId);
      toast.success('Template deleted');
      qc.invalidateQueries({ queryKey: ['templates'] });
      setDelId(null);
    } catch {
      toast.error('Failed');
    } finally {
      setDeleting(false);
    }
  };

  const inputCls = 'input-base';

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Message Templates"
        subtitle="Create reusable templates with dynamic client tokens"
        icon={MessageSquare}
        color="sky"
        badge={templates.length > 0 ? `${templates.length} template${templates.length !== 1 ? 's' : ''}` : undefined}
        actions={canEdit && <Button icon={<Plus size={15} />} onClick={openAdd}>New Template</Button>}
      />

      {templates.length === 0 ? (
        <div className="card-surface p-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-brand-50 text-brand-700 mx-auto mb-4">
            <MessageSquare size={28} />
          </div>
          <p className="font-bold text-slate-700 text-base mt-2">No templates yet</p>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xs mx-auto">
            Use templates to send personalized messages to clients in one click
          </p>
          {canEdit && (
            <Button className="mt-6" icon={<Plus size={15} />} onClick={openAdd}>
              Create First Template
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {templates.map(t => (
            <TemplateCard key={t.id} tmpl={t} onView={setViewTmpl} onEdit={openEdit} onDelete={setDelId} canUpdate={canUpdate} canDelete={canDelete} />
          ))}
        </div>
      )}

      <Modal
        open={editModal.open}
        onClose={closeEdit}
        title={editModal.tmpl ? 'Edit Template' : 'New Template'}
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeEdit}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}>Save Template</Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 min-w-0">
            <div>
              <label className="label-base">Template Name</label>
              <input
                className={`${inputCls} mt-1`}
                placeholder="e.g. Birthday Wishes"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-700">Message Body</label>
                <span className="text-xs text-slate-400">Client fields — click to insert</span>
              </div>
              <div className="mb-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2.5">
                {TOKEN_GROUPS.map(g => (
                  <div key={g.group}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{g.label}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {g.tokens.map(t => (
                        <TokenPill key={t.token} token={t.token} label={t.label} onClick={insertToken} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <textarea
                id="template-body"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-3 focus:ring-sky-500/10 focus:border-sky-500 font-mono leading-relaxed transition-all"
                rows={12}
                placeholder={`Dear {client_name},\n\nWishing you a wonderful day!\n\nBest regards`}
                value={form.body}
                onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Preview on the right uses sample client data.
              </p>
            </div>
          </div>

          <div className="min-w-0 lg:sticky lg:top-0 self-start">
            <p className="label-base mb-2">WhatsApp preview</p>
            <p className="text-xs text-slate-400 mb-3">Sample: {TEMPLATE_DUMMY_VALUES.client_name}</p>
            <WhatsAppPreview
              message={livePreview}
              contactName={TEMPLATE_DUMMY_VALUES.client_name}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!viewTmpl}
        onClose={() => setViewTmpl(null)}
        title={viewTmpl?.name || 'Template'}
        size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setViewTmpl(null)}>Close</Button>
            {canUpdate && (
              <Button icon={<Edit2 size={14}/>} onClick={() => { openEdit(viewTmpl); setViewTmpl(null); }}>
                Edit Template
              </Button>
            )}
          </div>
        }
      >
        {viewTmpl && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4 min-w-0">
              <div>
                <p className="label-base mb-1">Template Name</p>
                <p className="text-sm font-semibold text-slate-800">{viewTmpl.name}</p>
              </div>
              <div>
                <p className="label-base mb-1">Message Body</p>
                <pre className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono leading-relaxed text-slate-700 whitespace-pre-wrap break-words">
                  {viewTmpl.body}
                </pre>
              </div>
              {(() => {
                const tokens = extractTemplateTokens(viewTmpl.body);
                return tokens.length > 0 ? (
                  <div>
                    <p className="label-base mb-1.5">Tokens used</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tokens.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-xs font-semibold border border-violet-100">
                          {'{' + t + '}'}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
            <div className="min-w-0 lg:sticky lg:top-0 self-start">
              <p className="label-base mb-2">WhatsApp preview</p>
              <p className="text-xs text-slate-400 mb-3">Sample: {TEMPLATE_DUMMY_VALUES.client_name}</p>
              <WhatsAppPreview
                message={applyTemplateTokens(viewTmpl.body)}
                contactName={TEMPLATE_DUMMY_VALUES.client_name}
              />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!delId}
        onClose={() => setDelId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Template"
        message="This template will be permanently deleted and cannot be recovered."
      />
    </div>
  );
}
