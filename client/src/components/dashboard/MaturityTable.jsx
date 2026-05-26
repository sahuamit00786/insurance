import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, CheckCircle, X, Trash2, EyeOff, Eye } from 'lucide-react';
import DataTable from '../ui/DataTable';
import { CardHeader } from '../ui/Card';
import { getMaturity } from '../../api/dashboard';
import { formatDate } from '../../utils/formatters';
import ClientNameLink from '../clients/ClientNameLink';
import ConfirmDialog from '../ui/ConfirmDialog';
import useDismissed from '../../hooks/useDismissed';

function humanTime(days) {
  const n = Math.abs(parseInt(days));
  if (n < 30)  return `${n}d`;
  if (n < 365) { const m = Math.round(n / 30); return `${m} mo`; }
  const y = Math.floor(n / 365), rem = Math.round((n % 365) / 30);
  return rem > 0 ? `${y}y ${rem}mo` : `${y}y`;
}

export default function MaturityTable() {
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [confirmClear, setConfirmClear] = useState(false);
  const [open, setOpen] = useState(false);

  const { dismissed, dismiss, dismissAll } = useDismissed('insur_dismissed_maturity');

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-maturity', page, pageSize],
    queryFn:  () => getMaturity({ page, limit: pageSize }).then(r => r.data.data),
    keepPreviousData: true,
  });

  const allRows = data?.rows  ?? [];
  const total   = data?.total ?? 0;
  const rows    = allRows.filter(r => !dismissed.has(r.id));
  const visibleIds = rows.map(r => r.id);

  const columns = [
    {
      key: 'client_name', label: 'Client', sortable: false,
      render: row => (
        <div className="flex items-center gap-2">
          <div className="avatar avatar-sm text-[9px]"
            style={{ background: 'linear-gradient(135deg, #6e3ae0, #421b86)' }}>
            {row.client_name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'}
          </div>
          <ClientNameLink clientId={row.client_id} className="text-sm font-semibold">
            {row.client_name}
          </ClientNameLink>
        </div>
      ),
    },
    {
      key: 'policy_no', label: 'Insurance No', sortable: false,
      render: row => (
        <span className="font-mono text-xs bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-600">
          {row.policy_no}
        </span>
      ),
    },
    {
      key: 'plan_code', label: 'Plan Code', sortable: false,
      render: row => row.plan_code
        ? <span className="text-xs font-semibold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-md border border-violet-100">{row.plan_code}</span>
        : <span className="text-slate-300">—</span>,
    },
    {
      key: 'maturity_date', label: 'Maturity Date', sortable: false,
      render: row => <span className="text-slate-700 tabular-nums">{formatDate(row.maturity_date)}</span>,
    },
    {
      key: 'days_until_maturity', label: 'Days Left', sortable: false,
      render: row => {
        const d = parseInt(row.days_until_maturity);
        if (d <= 7)  return <span className="font-semibold tabular-nums text-red-600">{d}d</span>;
        if (d <= 14) return <span className="font-semibold tabular-nums text-amber-600">{humanTime(d)}</span>;
        return <span className="font-semibold tabular-nums text-emerald-600">{humanTime(d)}</span>;
      },
    },
    {
      key: '_dismiss', label: '', width: '36px', align: 'right',
      render: row => (
        <button
          type="button"
          title="Dismiss"
          onClick={() => dismiss(row.id)}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
        >
          <X size={13}/>
        </button>
      ),
    },
  ];

  const toggleBtn = (
    <button
      type="button"
      onClick={() => setOpen(p => !p)}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
    >
      {open ? <EyeOff size={12}/> : <Eye size={12}/>}
      {open ? 'Hide' : 'Show'}
    </button>
  );

  const clearAllAction = (
    <div className="flex items-center gap-2">
      {toggleBtn}
      {visibleIds.length > 0 && open && (
        <button
          type="button"
          onClick={() => setConfirmClear(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition"
        >
          <Trash2 size={12}/>
          Clear All
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="card-surface overflow-hidden">
        <CardHeader
          title="Maturity Tracker"
          subtitle="Policies maturing within 1 month"
          icon={CalendarClock}
          action={clearAllAction}
        />
        {open && <DataTable
          columns={columns}
          rows={rows}
          loading={isLoading}
          noWrapper
          dense
          serverSide
          totalRows={Math.max(0, total - dismissed.size)}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={v => { setPageSize(v); setPage(1); }}
          emptyMessage="No policies maturing in the next 30 days"
          emptyIcon={<CheckCircle size={22} className="text-emerald-400" />}
        />}
      </div>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => { dismissAll(visibleIds); setConfirmClear(false); }}
        title="Clear All Notifications"
        message={`These ${visibleIds.length} maturing policies will be dismissed from the dashboard and won't appear again.`}
        confirmLabel="Clear All"
        danger
      />
    </>
  );
}
