import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  BarChart3, Download, RefreshCw, Users, ShieldCheck, CreditCard, StickyNote,
  CheckCircle2, Search, AlertTriangle, Clock, X, Columns3, Filter,
  FileSpreadsheet,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateReport } from '../../api/reports';
import { getValues } from '../../api/lookup';
import { getClients } from '../../api/clients';
import Button from '../../components/ui/Button';
import SearchableSelect from '../../components/ui/SearchableSelect';
import Badge from '../../components/ui/Badge';
import DataTable from '../../components/ui/DataTable';
import { formatDate, formatCurrency } from '../../utils/formatters';

function humanTime(days) {
  const n = Math.abs(parseInt(days));
  if (n < 30) return `${n}d`;
  if (n < 365) {
    const m = Math.round(n / 30);
    return `${m} mo`;
  }
  const y = Math.floor(n / 365);
  const rem = Math.round((n % 365) / 30);
  return rem > 0 ? `${y}y ${rem}mo` : `${y}y`;
}

function DaysLeftCell({ val }) {
  if (val == null || val === '') return <span className="text-slate-400">—</span>;
  const n = parseInt(val);
  const label = humanTime(n);
  if (n < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
        <AlertTriangle size={10} /> {label} ago
      </span>
    );
  }
  if (n <= 30) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
        <AlertTriangle size={10} /> {label}
      </span>
    );
  }
  if (n <= 90) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
        <Clock size={10} /> {label}
      </span>
    );
  }
  return <span className="text-xs font-medium text-slate-500">{label}</span>;
}

const REPORT_TYPES = [
  {
    key: 'clients',
    label: 'Clients',
    description: 'Client directory with policy counts and premium totals',
    icon: Users,
    color: 'sky',
  },
  {
    key: 'insurances',
    label: 'Insurance policies',
    description: 'Policies, due dates, premiums, and expiry status',
    icon: ShieldCheck,
    color: 'violet',
  },
  {
    key: 'payments',
    label: 'Payments',
    description: 'Payment history with receipts and modes',
    icon: CreditCard,
    color: 'emerald',
  },
];

const COLUMNS = {
  clients: [
    { key: 'name', label: 'Client Name' },
    { key: 'date_of_birth', label: 'Date of Birth' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Address' },
    { key: 'insurance_count', label: 'No. of Policies' },
    { key: 'total_premium', label: 'Total Premium' },
    { key: 'earliest_due', label: 'Earliest Due' },
    { key: 'latest_due', label: 'Latest Due' },
    { key: 'created_at', label: 'Created On' },
    { key: 'doc_count', label: 'Documents' },
    { key: 'notes', label: 'Notes' },
  ],
  insurances: [
    { key: 'client_name', label: 'Client Name' },
    { key: 'coverage_provider', label: 'Coverage Provider' },
    { key: 'policy_no', label: 'Policy No' },
    { key: 'plan_code', label: 'Plan Code' },
    { key: 'status', label: 'Status' },
    { key: 'payment_mode', label: 'Payment Mode' },
    { key: 'payment_method', label: 'Payment Method' },
    { key: 'issued_date', label: 'Issued Date' },
    { key: 'maturity_date', label: 'Maturity Date' },
    { key: 'premium_due_date', label: 'Due Date' },
    { key: 'premium', label: 'Premium (RM)' },
    { key: 'days_left', label: 'Due In' },
  ],
  payments: [
    { key: 'client_name', label: 'Client Name' },
    { key: 'client_phone', label: 'Phone' },
    { key: 'payment_date', label: 'Payment Date' },
    { key: 'amount', label: 'Amount (RM)' },
    { key: 'receipt_no', label: 'Receipt No' },
    { key: 'payment_mode', label: 'Payment Mode' },
    { key: 'payment_method', label: 'Payment Method' },
    { key: 'remarks', label: 'Remarks' },
  ],
  notes: [
    { key: 'client_name', label: 'Client Name' },
    { key: 'client_phone', label: 'Phone' },
    { key: 'title', label: 'Title' },
    { key: 'body', label: 'Note' },
    { key: 'pinned', label: 'Pinned' },
    { key: 'created_by', label: 'Created By' },
    { key: 'note_time', label: 'Date & Time' },
  ],
};

const DEFAULT_FIELDS = {
  clients: ['name', 'phone', 'email', 'insurance_count', 'total_premium', 'earliest_due'],
  insurances: ['client_name', 'policy_no', 'plan_code', 'status', 'premium_due_date', 'premium', 'days_left'],
  payments: ['client_name', 'payment_date', 'amount', 'receipt_no', 'payment_mode'],
  notes: ['client_name', 'title', 'body', 'created_by', 'note_time'],
};

const EXPIRY_PRESETS = [
  { label: '30 days', value: '30' },
  { label: '60 days', value: '60' },
  { label: '90 days', value: '90' },
  { label: '6 months', value: '180' },
  { label: '1 year', value: '365' },
];

const TYPE_STYLES = {
  sky: {
    ring: 'ring-brand-500',
    bg: 'bg-brand-50',
    icon: 'bg-brand-600 text-white',
    iconMuted: 'bg-brand-50 text-brand-700',
    border: 'border-brand-200',
    activeBg: 'bg-brand-600/5',
  },
  violet: {
    ring: 'ring-violet-500',
    bg: 'bg-violet-50',
    icon: 'bg-violet-600 text-white',
    iconMuted: 'bg-violet-50 text-violet-700',
    border: 'border-violet-200',
    activeBg: 'bg-violet-600/5',
  },
  emerald: {
    ring: 'ring-emerald-500',
    bg: 'bg-emerald-50',
    icon: 'bg-emerald-600 text-white',
    iconMuted: 'bg-emerald-50 text-emerald-700',
    border: 'border-emerald-200',
    activeBg: 'bg-emerald-600/5',
  },
  amber: {
    ring: 'ring-amber-500',
    bg: 'bg-amber-50',
    icon: 'bg-amber-500 text-white',
    iconMuted: 'bg-amber-50 text-amber-700',
    border: 'border-amber-200',
    activeBg: 'bg-amber-500/5',
  },
};

const DATE_KEYS = ['issued_date', 'maturity_date', 'premium_due_date', 'payment_date', 'date_of_birth', 'earliest_due', 'latest_due', 'created_at'];
const DATETIME_KEYS = ['note_time'];
const CURRENCY_KEYS = ['premium', 'amount', 'total_premium'];

function rawVal(key, val) {
  if (val == null) return '';
  if (DATETIME_KEYS.includes(key)) return val ? String(val).slice(0, 19).replace('T', ' ') : '';
  if (DATE_KEYS.includes(key)) return val ? String(val).slice(0, 10) : '';
  return String(val);
}

function exportCSV(cols, rows, filename) {
  const header = cols.map(c => c.label).join(',');
  const body = rows.map(r => cols.map(c => `"${rawVal(c.key, r[c.key])}"`).join(','));
  const csv = [header, ...body].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(type, cols, rows) {
  const doc = new jsPDF({ orientation: 'landscape' });
  const title = REPORT_TYPES.find(r => r.key === type)?.label || 'Report';
  doc.text(`${title} — ${new Date().toLocaleDateString()}`, 14, 15);
  autoTable(doc, {
    head: [cols.map(c => c.label)],
    body: rows.map(r => cols.map(c => rawVal(c.key, r[c.key]))),
    startY: 22,
    styles: { fontSize: 7.5 },
    headStyles: { fillColor: [37, 99, 235] },
  });
  doc.save(`report-${type}-${Date.now()}.pdf`);
}

function CellValue({ col, val }) {
  if (val == null || val === '') return <span className="text-slate-400">—</span>;
  if (col.key === 'status') return <Badge dot>{val}</Badge>;
  if (col.key === 'days_left') return <DaysLeftCell val={val} />;
  if (col.key === 'plan_code') {
    return (
      <span className="text-xs font-semibold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-md border border-violet-100">
        {val}
      </span>
    );
  }
  if (col.key === 'policy_no') {
    return (
      <span className="font-mono text-xs bg-slate-50 px-2 py-0.5 rounded-md text-slate-700 border border-slate-100">
        {val}
      </span>
    );
  }
  if (col.key === 'insurance_count') {
    return (
      <span className="inline-flex items-center justify-center min-w-[1.5rem] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
        {val}
      </span>
    );
  }
  if (col.key === 'doc_count') {
    return (
      <span className="inline-flex items-center justify-center min-w-[1.5rem] px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-100">
        {val}
      </span>
    );
  }
  if (col.key === 'coverage_provider') {
    return (
      <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
        {val}
      </span>
    );
  }
  if (CURRENCY_KEYS.includes(col.key)) {
    return <span className="text-xs font-semibold text-slate-800 tabular-nums">{formatCurrency(val)}</span>;
  }
  if (DATETIME_KEYS.includes(col.key)) {
    return (
      <span className="text-xs text-slate-600 tabular-nums whitespace-nowrap">
        {formatDate(val, 'dd MMM yyyy, h:mm a')}
      </span>
    );
  }
  if (DATE_KEYS.includes(col.key)) {
    return <span className="text-xs text-slate-600">{formatDate(val)}</span>;
  }
  if (col.key === 'body') {
    return (
      <span className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed line-clamp-3" title={val}>
        {val}
      </span>
    );
  }
  if (col.key === 'notes') {
    const parts = val.split('\n').filter(Boolean);
    return (
      <div className="flex flex-col gap-1 max-w-sm">
        {parts.map((p, i) => (
          <span key={i} className="text-xs text-slate-700 leading-snug border-l-2 border-amber-200 pl-2">{p}</span>
        ))}
      </div>
    );
  }
  return <span className="text-xs text-slate-700">{val}</span>;
}

function SectionCard({ step, title, subtitle, icon: Icon, children, action }) {
  return (
    <section className="rounded-xl border border-slate-100 bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white text-xs font-bold">
            {step}
          </span>
          <div className="flex items-center gap-1.5 min-w-0">
            {Icon && <Icon size={14} className="text-slate-400 shrink-0" />}
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {subtitle && <span className="text-xs text-slate-400 hidden sm:inline">· {subtitle}</span>}
          </div>
        </div>
        {action}
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </section>
  );
}

export default function ReportsPage() {
  const [type, setType] = useState('clients');
  const [fields, setFields] = useState(DEFAULT_FIELDS.clients);
  const [clientId, setClientId] = useState('');
  const [search, setSearch] = useState('');
  const [planCodeId, setPlanCodeId]     = useState('');
  const [statusId, setStatusId]         = useState('');
  const [payModeId, setPayModeId]       = useState('');
  const [buyingForId, setBuyingForId]   = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [expiryDays, setExpiryDays] = useState('');
  const [expired, setExpired] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const { data: statuses = [] } = useQuery({
    queryKey: ['lookup', 'client_status'],
    queryFn: () => getValues('client_status').then(r => r.data.data),
  });
  const { data: planCodes = [] } = useQuery({
    queryKey: ['lookup', 'plan_code'],
    queryFn: () => getValues('plan_code').then(r => r.data.data),
  });
  const { data: payModes = [] } = useQuery({
    queryKey: ['lookup', 'payment_mode'],
    queryFn: () => getValues('payment_mode').then(r => r.data.data),
  });
  const { data: coverageProviders = [] } = useQuery({
    queryKey: ['lookup', 'coverage_provider'],
    queryFn: () => getValues('coverage_provider').then(r => r.data.data),
  });
  const { data: allClients = [] } = useQuery({
    queryKey: ['clients-list-all'],
    queryFn: () => getClients({ limit: 2000 }).then(r => r.data.data?.rows ?? []),
  });
  const clientOptions = allClients.map(c => ({ value: String(c.id), label: c.name }));

  const activeType = REPORT_TYPES.find(r => r.key === type);
  const typeStyle = TYPE_STYLES[activeType?.color] || TYPE_STYLES.sky;

  const toggleField = key =>
    setFields(p => (p.includes(key) ? (p.length > 1 ? p.filter(k => k !== key) : p) : [...p, key]));

  const selectAll = () => setFields(COLUMNS[type].map(c => c.key));
  const clearAll = () => setFields([COLUMNS[type][0].key]);

  const changeType = t => {
    setType(t);
    setFields(DEFAULT_FIELDS[t]);
    setReportData(null);
    setClientId('');
    setSearch('');
    setPlanCodeId('');
    setStatusId('');
    setPayModeId('');
    setBuyingForId('');
    setFromDate('');
    setToDate('');
    setExpiryDays('');
    setExpired('');
  };

  const resetFilters = () => {
    setClientId('');
    setSearch('');
    setPlanCodeId('');
    setStatusId('');
    setPayModeId('');
    setBuyingForId('');
    setFromDate('');
    setToDate('');
    setExpiryDays('');
    setExpired('');
  };

  const activeFilters = [clientId, search, planCodeId, statusId, payModeId, buyingForId, fromDate, toDate, expiryDays, expired].filter(Boolean).length;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const params = {
        type,
        fields: fields.join(','),
        client_id: clientId || undefined,
        search: search || undefined,
        plan_code_id: planCodeId || undefined,
        status_id: statusId || undefined,
        payment_mode_id: payModeId || undefined,
        buying_for_id: buyingForId || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        expiry_days: expiryDays || undefined,
        expired: expired || undefined,
      };
      const res = await generateReport(params);
      setReportData(res.data.data);
      toast.success(`${res.data.data.rows.length} records found`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Report generation failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedCols = (COLUMNS[type] || []).filter(c => fields.includes(c.key));

  const summary = useMemo(() => {
    if (!reportData?.rows?.length) return null;
    const rows = reportData.rows;
    const amountKey = type === 'payments' ? 'amount' : type === 'clients' ? 'total_premium' : type === 'insurances' ? 'premium' : null;
    const totalAmount = amountKey ? rows.reduce((sum, r) => sum + (parseFloat(r[amountKey]) || 0), 0) : 0;
    return {
      count: rows.length,
      columns: selectedCols.length,
      totalAmount: amountKey && CURRENCY_KEYS.includes(amountKey) ? totalAmount : null,
    };
  }, [reportData, type, selectedCols.length]);

  const dateFromLabel =
    type === 'payments' ? 'Payment from' : type === 'insurances' ? 'Due from' : 'Created from';
  const dateToLabel =
    type === 'payments' ? 'Payment to'   : type === 'insurances' ? 'Due to'   : 'Created to';

  return (
    <div className="space-y-4 min-w-0">
      <PageHeader
        title="Reports"
        subtitle="Build custom exports with filters, then download as CSV or PDF"
        icon={BarChart3}
        color="emerald"
        badge={summary ? `${summary.count} records` : undefined}
        actions={
          reportData && (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={<Download size={14} />}
                onClick={() => exportCSV(selectedCols, reportData.rows, `report-${type}-${Date.now()}.csv`)}
              >
                Export CSV
              </Button>
              <Button
                size="sm"
                icon={<FileSpreadsheet size={14} />}
                onClick={() => exportPDF(type, selectedCols, reportData.rows)}
              >
                Export PDF
              </Button>
            </>
          )
        }
      />

      {/* ── Steps (all above) ─────────────────────────────────── */}
      <div className="space-y-3">
        {/* Report type picker */}
        <section className="rounded-xl border border-slate-100 bg-white overflow-hidden">
          <div className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/60">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white text-xs font-bold">
              1
            </span>
            <h3 className="text-sm font-semibold text-slate-900">Report Type</h3>
          </div>
          <div className="p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {REPORT_TYPES.map(rt => {
                const active = type === rt.key;
                const s = TYPE_STYLES[rt.color];
                const Icon = rt.icon;
                return (
                  <button
                    key={rt.key}
                    type="button"
                    onClick={() => changeType(rt.key)}
                    className={`text-left rounded-lg border px-3 py-2.5 transition-all ${
                      active
                        ? `${s.border} ${s.activeBg} ring-2 ${s.ring} shadow-sm`
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${active ? s.icon : s.iconMuted}`}>
                        <Icon size={14} />
                      </div>
                      <span className={`text-sm font-semibold flex-1 ${active ? 'text-slate-900' : 'text-slate-700'}`}>
                        {rt.label}
                      </span>
                      {active && <CheckCircle2 size={14} className="text-brand-600 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Step 2 — Columns */}
        <SectionCard
          step="2"
          title="Columns"
          subtitle={`${fields.length} of ${COLUMNS[type].length} selected for export`}
          icon={Columns3}
          action={
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={selectAll} className="text-xs font-semibold text-brand-700 hover:underline">
                Select all
              </button>
              <span className="text-slate-200">|</span>
              <button type="button" onClick={clearAll} className="text-xs font-semibold text-slate-500 hover:underline">
                Reset
              </button>
            </div>
          }
        >
          <div className="flex flex-wrap gap-1.5">
            {(COLUMNS[type] || []).map(c => {
              const on = fields.includes(c.key);
              return (
                <button key={c.key} type="button" onClick={() => toggleField(c.key)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-medium transition-all ${on ? 'bg-brand-700 text-white border-brand-700 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:bg-brand-50/50'}`}>
                  {on && <CheckCircle2 size={11} />}
                  {c.label}
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* Step 3 — Filters + Generate */}
        <SectionCard
          step="3"
          title="Filters"
          subtitle={activeFilters > 0 ? `${activeFilters} active filter${activeFilters !== 1 ? 's' : ''}` : 'Optional — narrow your results'}
          icon={Filter}
          action={
            activeFilters > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600 transition shrink-0"
              >
                <X size={12} /> Clear all
              </button>
            )
          }
        >
          <div className="mb-3 flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <SearchableSelect
                value={clientId}
                onChange={setClientId}
                options={clientOptions}
                placeholder="Filter by client…"
              />
            </div>
            {type === 'insurances' && (
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input-base pl-9 py-2 text-sm w-full"
                  placeholder="Search by policy number…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="rounded-lg bg-slate-50/80 border border-slate-100 p-3 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            <div>
              <label className="label-base text-xs">{dateFromLabel}</label>
              <input type="date" className="input-base mt-1" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div>
              <label className="label-base text-xs">{dateToLabel}</label>
              <input type="date" className="input-base mt-1" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>

            {type === 'insurances' && (
              <>
                <div>
                  <label className="label-base text-xs">Coverage Provider</label>
                  <select className="input-base mt-1" value={buyingForId} onChange={e => setBuyingForId(e.target.value)}>
                    <option value="">All providers</option>
                    {coverageProviders.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.lookup_name ?? p.value}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-base text-xs">Plan code</label>
                  <select className="input-base mt-1" value={planCodeId} onChange={e => setPlanCodeId(e.target.value)}>
                    <option value="">All plans</option>
                    {planCodes.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.lookup_name ?? p.value}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-base text-xs">Status</label>
                  <select className="input-base mt-1" value={statusId} onChange={e => setStatusId(e.target.value)}>
                    <option value="">All statuses</option>
                    {statuses.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.lookup_name ?? s.value}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-base text-xs">Payment mode</label>
                  <select className="input-base mt-1" value={payModeId} onChange={e => setPayModeId(e.target.value)}>
                    <option value="">All modes</option>
                    {payModes.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.lookup_name ?? m.value}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-base text-xs">Expiry status</label>
                  <select
                    className="input-base mt-1"
                    value={expired}
                    onChange={e => {
                      setExpired(e.target.value);
                      setExpiryDays('');
                    }}
                  >
                    <option value="">All policies</option>
                    <option value="false">Active (not expired)</option>
                    <option value="true">Expired</option>
                  </select>
                </div>
              </>
            )}

            {type === 'payments' && (
              <div>
                <label className="label-base text-xs">Payment mode</label>
                <select className="input-base mt-1" value={payModeId} onChange={e => setPayModeId(e.target.value)}>
                  <option value="">All modes</option>
                  {payModes.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.lookup_name ?? m.value}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {type === 'insurances' && expired !== 'true' && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-2">Due within</p>
              <div className="flex flex-wrap gap-1.5">
                {EXPIRY_PRESETS.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setExpiryDays(expiryDays === p.value ? '' : p.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      expiryDays === p.value
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-amber-400 hover:text-amber-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3">
            <Button icon={<RefreshCw size={14} />} loading={loading} onClick={handleGenerate}>
              Generate report
            </Button>
            <p className="text-xs text-slate-400">Selected columns only · sorted for readability</p>
          </div>
        </SectionCard>
      </div>

      {/* ── Results (below) ───────────────────────────────────── */}
      {reportData && summary && (
        <div className="card-surface overflow-hidden animate-slide-up min-w-0">
          <div className={`px-4 py-3 border-b border-slate-100 ${typeStyle.bg}`}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h3 className="text-sm font-semibold text-slate-900">{activeType?.label} report</h3>
                <Badge variant="gray">{summary.count} rows</Badge>
                {summary.totalAmount != null && summary.totalAmount > 0 && (
                  <span className="text-xs font-semibold text-slate-700 tabular-nums">· {formatCurrency(summary.totalAmount)} total</span>
                )}
                <span className="text-xs text-slate-400 hidden sm:inline">· {summary.columns} cols · {new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Download size={13} />}
                  onClick={() => exportCSV(selectedCols, reportData.rows, `report-${type}-${Date.now()}.csv`)}
                >
                  CSV
                </Button>
                <Button
                  size="sm"
                  icon={<FileSpreadsheet size={13} />}
                  onClick={() => exportPDF(type, selectedCols, reportData.rows)}
                >
                  PDF
                </Button>
              </div>
            </div>
          </div>

          <DataTable
            columns={selectedCols.map(c => ({
              key: c.key,
              label: c.label,
              sortable: true,
              render: row => <CellValue col={c} val={row[c.key]} />,
            }))}
            rows={reportData.rows}
            noWrapper
            defaultPageSize={25}
            emptyMessage="No records match your filters"
          />
        </div>
      )}
    </div>
  );
}
