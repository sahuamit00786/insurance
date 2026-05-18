import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardHeader } from '../ui/Card';
import { formatDate, formatBirthdayCountdown } from '../../utils/formatters';
import { ArrowRight, Cake, Gift } from 'lucide-react';
import SendWishesModal from './SendWishesModal';
import Button from '../ui/Button';
import ClientNameLink from '../clients/ClientNameLink';
import DataTable from '../ui/DataTable';

export default function UpcomingBirthdaysTable({ clients = [] }) {
  const nav = useNavigate();
  const [wishesClient, setWishesClient] = useState(null);

  const columns = [
    {
      key: 'name', label: 'Client', sortable: false,
      render: client => (
        <div className="flex items-center gap-2.5">
          <div className="avatar avatar-sm">
            {client.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
          </div>
          <ClientNameLink clientId={client.id} className="text-sm">{client.name}</ClientNameLink>
        </div>
      ),
    },
    {
      key: 'next_birthday', label: 'Birthday', sortable: false,
      render: client => (
        <span className="text-slate-700 font-medium tabular-nums">
          {client.next_birthday
            ? formatDate(client.next_birthday, 'dd MMM')
            : formatDate(client.date_of_birth, 'dd MMM')}
        </span>
      ),
    },
    {
      key: 'days_until_birthday', label: 'When', sortable: false,
      render: client => {
        const isSoon = client.days_until_birthday != null && client.days_until_birthday <= 7;
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border tabular-nums ${
            client.days_until_birthday === 0
              ? 'bg-brand-50 text-brand-800 border-brand-200'
              : isSoon
                ? 'bg-amber-50 text-amber-800 border-amber-100'
                : 'bg-slate-50 text-slate-600 border-slate-100'
          }`}>
            {formatBirthdayCountdown(client.days_until_birthday)}
          </span>
        );
      },
    },
    {
      key: '_wishes', label: 'Send Wishes', sortable: false, align: 'right',
      render: client => (
        <Button size="sm" variant="secondary" icon={<Gift size={13}/>}
          onClick={e => { e.stopPropagation(); setWishesClient(client); }}>
          Send wishes
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="card-surface flex h-full w-full min-h-0 flex-col overflow-hidden">
        <CardHeader
          title="Upcoming Birthdays"
          subtitle="Next 10 clients celebrating soon"
          icon={Cake}
          action={
            <button type="button" onClick={() => nav('/clients')}
              className="flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800 transition">
              View all <ArrowRight size={12}/>
            </button>
          }
        />
        <div className="min-h-0 flex-1">
          <DataTable
            columns={columns}
            rows={clients}
            rowKey={c => c.id}
            noWrapper
            hidePagination
            emptyMessage="No upcoming birthdays with date of birth on file"
            dense
          />
        </div>
      </div>

      <SendWishesModal
        open={!!wishesClient}
        onClose={() => setWishesClient(null)}
        client={wishesClient}
      />
    </>
  );
}
