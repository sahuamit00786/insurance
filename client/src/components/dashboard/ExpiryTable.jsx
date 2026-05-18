import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock, CheckCircle, ShieldAlert, Send, X, Trash2 } from 'lucide-react';
import DataTable from '../ui/DataTable';
import { CardHeader } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { getExpiry } from '../../api/dashboard';
import { formatDate } from '../../utils/formatters';
import ClientNameLink from '../clients/ClientNameLink';
import SendWishesModal from './SendWishesModal';
import ConfirmDialog from '../ui/ConfirmDialog';
import useDismissed from '../../hooks/useDismissed';

function humanTime(days) {
  const n = Math.abs(parseInt(days));
  if (n < 30)  return `${n}d`;
  if (n < 365) { const m = Math.round(n / 30); return `${m} mo`; }
  const y = Math.floor(n / 365), rem = Math.round((n % 365) / 30);
  return rem > 0 ? `${y}y ${rem}mo` : `${y}y`;
}

const TABS = [
  { key: 'expiring', label: 'Getting Expired', icon: <Clock size={14}/> },
  { key: 'expired',  label: 'Expired',         icon: <AlertTriangle size={14}/> },
];

export default function ExpiryTable() {
  const [tab, setTab] = useState('expiring');
  const [page, setPage] = useState(1);
  const [wishClient, setWishClient] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const { dismissed: dismissedExpiring, dismiss: dismissExpiring, dismissAll: dismissAllExpiring } = useDismissed('insur_dismissed_expiry_expiring');
  const { dismissed: dismissedExpired,  dismiss: dismissExpired,  dismissAll: dismissAllExpired  } = useDismissed('insur_dismissed_expiry_expired');

  const dismissed    = tab === 'expiring' ? dismissedExpiring : dismissedExpired;
  const dismissOne   = tab === 'expiring' ? dismissExpiring   : dismissExpired;
  const dismissAll   = tab === 'expiring' ? dismissAllExpiring : dismissAllExpired;

  const handleTabChange = (key) => { setTab(key); setPage(1); };

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-expiry', tab, page],
    queryFn:  () => getExpiry({ type: tab, page }).then(r => r.data.data),
    keepPreviousData: true,
  });

  const allRows = data?.rows  ?? [];
  const total   = data?.total ?? 0;
  const items   = allRows.filter(r => !dismissed.has(r.id));

  const visibleIds = items.map(r => r.id);

  const columns = [
    {
      key: 'client_name', label: 'Customer Name', sortable: false,
      render: item => (
        <div className="flex items-center gap-2">
          <div className="avatar avatar-sm text-[9px]">
            {item.client_name?.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() || '?'}
          </div>
          <ClientNameLink clientId={item.client_id} className="text-sm font-semibold">{item.client_name}</ClientNameLink>
        </div>
      ),
    },
    {
      key: 'policy_no', label: 'Policy No', sortable: false,
      render: item => (
        <span className="font-mono text-xs bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-600">
          {item.policy_no}
        </span>
      ),
    },
    {
      key: 'due_date', label: 'Premium Due Date', sortable: false,
      render: item => <span className="text-slate-700 tabular-nums">{formatDate(item.due_date)}</span>,
    },
    {
      key: 'maturity_date', label: 'Maturity Date', sortable: false,
      render: item => item.maturity_date
        ? <span className="text-slate-700 tabular-nums">{formatDate(item.maturity_date)}</span>
        : <span className="text-slate-300">—</span>,
    },
    {
      key: 'days_until_expiry', label: tab === 'expired' ? 'Overdue' : 'Due In', sortable: false,
      render: item => {
        const days = item.days_until_expiry;
        const isRed   = days !== null && days < 0;
        const isAmber = days !== null && days >= 0 && days <= 7;
        return (
          <span className={`font-semibold tabular-nums ${isRed ? 'text-red-600' : isAmber ? 'text-amber-600' : 'text-emerald-600'}`}>
            {days !== null ? (isRed ? `${humanTime(days)} ago` : humanTime(days)) : '—'}
          </span>
        );
      },
    },
    {
      key: '_send', label: '', width: '36px', align: 'right',
      render: item => (
        <button
          type="button"
          title="Send template"
          onClick={() => setWishClient({
            id:            item.client_id,
            name:          item.client_name,
            phone:         item.phone,
            date_of_birth: item.date_of_birth,
          })}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-emerald-50 text-emerald-500 transition"
        >
          <Send size={13}/>
        </button>
      ),
    },
    {
      key: '_dismiss', label: '', width: '36px', align: 'right',
      render: item => (
        <button
          type="button"
          title="Dismiss"
          onClick={() => dismissOne(item.id)}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
        >
          <X size={13}/>
        </button>
      ),
    },
  ];

  const clearAllAction = visibleIds.length > 0 ? (
    <button
      type="button"
      onClick={() => setConfirmClear(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition"
    >
      <Trash2 size={12}/>
      Clear All
    </button>
  ) : null;

  return (
    <>
      <div className="card-surface overflow-hidden">
        <CardHeader
          title="Due Date"
          subtitle={tab === 'expiring' ? 'Expiring within next 7 days' : 'Expired within last 7 days'}
          icon={ShieldAlert}
          action={clearAllAction}
        />

        <div className="px-5 border-b border-slate-100">
          <Tabs tabs={TABS} active={tab} onChange={handleTabChange}/>
        </div>

        <DataTable
          columns={columns}
          rows={items}
          loading={isLoading}
          noWrapper
          serverSide
          totalRows={Math.max(0, total - dismissed.size)}
          page={page}
          pageSize={10}
          onPageChange={setPage}
          onPageSizeChange={() => {}}
          emptyMessage={tab === 'expiring' ? 'No policies expiring in the next 7 days' : 'No policies expired in the last 7 days'}
          emptyIcon={<CheckCircle size={22} className="text-emerald-400"/>}
          dense
          rowClassName={row => {
            if (tab !== 'expiring') return '';
            const d = parseInt(row.days_until_expiry);
            if (d <= 3) return '!bg-red-100';
            if (d <= 6) return '!bg-orange-100';
            return '!bg-green-100';
          }}
        />
      </div>

      <SendWishesModal
        open={!!wishClient}
        onClose={() => setWishClient(null)}
        client={wishClient}
      />

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => { dismissAll(visibleIds); setConfirmClear(false); }}
        title="Clear All Notifications"
        message={`These ${visibleIds.length} ${tab === 'expiring' ? 'expiring' : 'expired'} policies will be dismissed from the dashboard and won't appear again.`}
        confirmLabel="Clear All"
        danger
      />
    </>
  );
}
