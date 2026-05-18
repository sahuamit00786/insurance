import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import WhatsAppPreview from '../ui/WhatsAppPreview';
import { getTemplates } from '../../api/templates';
import { getInsurances } from '../../api/clients';
import { openWhatsAppWeb } from '../../utils/whatsapp';
import { formatDate } from '../../utils/formatters';
import {
  applyTemplateTokens,
  buildTokenValues,
  extractTemplateTokens,
  getMissingTokensForClient,
  isTokenValueMissing,
  CLIENT_TOKENS,
  INSURANCE_TOKEN_KEYS,
} from '../../utils/templateTokens';

const TOKEN_LABELS = Object.fromEntries(CLIENT_TOKENS.map(t => [t.token, t.label]));

export default function SendWishesModal({ open, onClose, client }) {
  const [templateId,   setTemplateId]   = useState('');
  const [insuranceId,  setInsuranceId]  = useState('');

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => getTemplates().then(r => r.data.data),
    enabled: open,
  });

  const { data: insurances = [] } = useQuery({
    queryKey: ['insurances', client?.id],
    queryFn: () => getInsurances(client.id).then(r => r.data.data),
    enabled: open && !!client?.id,
  });

  const insurance = useMemo(() => {
    if (!insurances.length) return {};
    if (insuranceId) return insurances.find(i => String(i.id) === insuranceId) || {};
    // default: soonest due date
    const sorted = [...insurances].sort((a, b) => {
      if (!a.premium_due_date) return 1;
      if (!b.premium_due_date) return -1;
      return new Date(a.premium_due_date) - new Date(b.premium_due_date);
    });
    return sorted[0];
  }, [insurances, insuranceId]);

  const selectedTemplate = templates.find(t => String(t.id) === String(templateId));

  const tokenValues = useMemo(
    () => buildTokenValues(client, formatDate, insurance),
    [client, insurance]
  );

  const usedTokens = useMemo(
    () => extractTemplateTokens(selectedTemplate?.body || ''),
    [selectedTemplate?.body]
  );

  const templateUsesInsurance = useMemo(
    () => usedTokens.some(t => INSURANCE_TOKEN_KEYS.has(t)),
    [usedTokens]
  );

  const missingTokens = useMemo(
    () => getMissingTokensForClient(selectedTemplate?.body, client, formatDate, insurance),
    [selectedTemplate?.body, client, insurance]
  );

  const missingPhone = !client?.phone?.trim();

  const previewText = selectedTemplate && client
    ? applyTemplateTokens(selectedTemplate.body, tokenValues)
    : '';

  const canSend =
    !!selectedTemplate &&
    !!previewText &&
    !templatesLoading &&
    missingTokens.length === 0 &&
    !missingPhone;

  useEffect(() => {
    if (!open) {
      setTemplateId('');
      setInsuranceId('');
      return;
    }
    if (templates.length && !templateId) {
      setTemplateId(String(templates[0].id));
    }
  }, [open, templates, templateId]);

  const handleSend = () => {
    if (!canSend) {
      if (missingTokens.length) {
        return toast.error('Complete missing client fields before sending');
      }
      if (missingPhone) return toast.error('This client has no phone number');
      return toast.error('Select a template first');
    }
    if (!openWhatsAppWeb(client.phone, previewText)) {
      return toast.error('Invalid phone number');
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Send wishes — ${client?.name || ''}`}
      size="xl"
      footer={
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
          {!canSend && selectedTemplate && (missingTokens.length > 0 || missingPhone) && (
            <p className="text-xs text-red-600 font-medium">
              {missingPhone && missingTokens.length > 0
                ? 'Fix missing fields and add a phone number to send.'
                : missingPhone
                  ? 'Phone number is required to send on WhatsApp.'
                  : 'Fill in the highlighted fields for this client before sending.'}
            </p>
          )}
          <div className="flex justify-end gap-3 sm:ml-auto">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleSend}
              disabled={!canSend}
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              }
            >
              Send on WhatsApp
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Client</p>
            <p className="text-sm font-semibold text-slate-900 mt-1">{client?.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              DOB: {client?.date_of_birth ? formatDate(client.date_of_birth) : '—'}
              {client?.phone ? ` · ${client.phone}` : ' · No phone'}
            </p>
          </div>

          {insurances.length > 0 && templateUsesInsurance && (
            <div>
              <label className="label-base">Insurance policy</label>
              <select
                className="input-base mt-1"
                value={insuranceId}
                onChange={e => setInsuranceId(e.target.value)}
              >
                <option value="">Soonest due policy (auto)</option>
                {insurances.map(i => (
                  <option key={i.id} value={String(i.id)}>
                    {i.policy_no}{i.plan_code ? ` — ${i.plan_code}` : ''}{i.premium_due_date ? ` · Due ${formatDate(i.premium_due_date)}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {missingPhone && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>Phone is not present for this client — required to send on WhatsApp.</span>
            </div>
          )}

          <div>
            <label className="label-base">Message template</label>
            {templatesLoading ? (
              <p className="text-sm text-slate-400 py-2">Loading templates…</p>
            ) : templates.length === 0 ? (
              <p className="text-sm text-amber-600 py-2">
                No templates yet. Create one under Message Templates.
              </p>
            ) : (
              <select
                className="input-base mt-1"
                value={templateId}
                onChange={e => setTemplateId(e.target.value)}
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
            {selectedTemplate && (
              <p className="text-xs text-slate-400 mt-2 line-clamp-3">{selectedTemplate.body}</p>
            )}
          </div>

          {selectedTemplate && usedTokens.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Fields used in template
              </p>
              <ul className="space-y-1.5">
                {usedTokens.map(token => {
                  const label = TOKEN_LABELS[token] || token.replace(/_/g, ' ');
                  const missing = isTokenValueMissing(tokenValues[token]);
                  const isPhoneField = token === 'phone';
                  const showMissing = missing || (isPhoneField && missingPhone);

                  return (
                    <li
                      key={token}
                      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                        showMissing
                          ? 'border-red-200 bg-red-50 text-red-800'
                          : 'border-emerald-100 bg-emerald-50/80 text-emerald-900'
                      }`}
                    >
                      {showMissing ? (
                        <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-500" />
                      ) : (
                        <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-emerald-600" />
                      )}
                      <div className="min-w-0">
                        <span className="font-semibold">{label}</span>
                        {showMissing ? (
                          <p className="mt-0.5 text-red-600 font-medium">
                            Not present for this client
                          </p>
                        ) : (
                          <p className="mt-0.5 text-emerald-800/90 truncate">
                            {tokenValues[token]}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {missingTokens.length > 0 && (
                <p className="text-xs text-red-600 font-medium">
                  Update the client profile or choose another template to enable send.
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          <p className="label-base mb-2">WhatsApp preview</p>
          <WhatsAppPreview message={previewText} contactName={client?.name} />
        </div>
      </div>
    </Modal>
  );
}
