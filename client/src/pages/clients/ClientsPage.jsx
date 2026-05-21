import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Search, Plus, Trash2, Users, Send } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { getClients, createClient, deleteClient } from '../../api/clients';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ClientForm from '../../components/clients/ClientForm';
import SendWishesModal from '../../components/dashboard/SendWishesModal';
import usePermission from '../../hooks/usePermission';

export default function ClientsPage() {
  const nav = useNavigate();
  const qc  = useQueryClient();
  const canEdit   = usePermission('clients', 'edit');
  const canDelete = usePermission('clients', 'delete');

  const [search,      setSearch]      = useState('');
  const [addOpen,     setAddOpen]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [delId,       setDelId]       = useState(null);
  const [deleting,    setDeleting]    = useState(false);
  const [wishClient,  setWishClient]  = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn:  () => getClients({ search, page: 1, limit: 2000 }).then(r => r.data.data),
    keepPreviousData: true,
  });

  const rows  = data?.rows  || [];
  const total = data?.total || 0;

  const handleAdd = async (form) => {
    setSaving(true);
    try {
      await createClient(form);
      toast.success('Client created successfully');
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setAddOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create client');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteClient(delId);
      toast.success('Client deleted');
      qc.invalidateQueries({ queryKey: ['clients'] });
      setDelId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Client',
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="avatar avatar-md shrink-0">
            {c.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
          </div>
          <button
            type="button"
            onClick={() => nav(`/clients/${c.id}`)}
            className="font-semibold text-slate-800 hover:text-sky-600 hover:underline underline-offset-2 transition-colors text-left"
          >
            {c.name}
          </button>
        </div>
      ),
    },
    {
      key: 'identification_no',
      label: 'IC / Passport No',
      sortable: true,
      render: (c) => <span className="text-slate-600 font-mono text-xs">{c.identification_no || <span className="text-slate-300">—</span>}</span>,
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: true,
      render: (c) => <span className="text-slate-600">{c.phone || <span className="text-slate-300">—</span>}</span>,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (c) => <span className="text-slate-500">{c.email || <span className="text-slate-300">—</span>}</span>,
    },
    {
      key: 'insurance_count',
      label: 'Policies',
      sortable: true,
      align: 'center',
      width: '90px',
      render: (c) => (
        <span className="inline-flex items-center justify-center min-w-[2rem] px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100 tabular-nums">
          {c.insurance_count ?? 0}
        </span>
      ),
    },
    {
      key: 'doc_count',
      label: 'Documents',
      sortable: true,
      align: 'center',
      width: '100px',
      render: (c) => (
        <span className="inline-flex items-center justify-center min-w-[2rem] px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-100 tabular-nums">
          {c.doc_count ?? 0}
        </span>
      ),
    },
    {
      key: '_send',
      label: '',
      width: '44px',
      align: 'right',
      render: (c) => (
        <button
          type="button"
          title="Send template"
          onClick={e => { e.stopPropagation(); setWishClient(c); }}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-emerald-50 text-emerald-500 transition"
        >
          <Send size={13}/>
        </button>
      ),
    },
    ...(canDelete ? [{
      key: '_actions',
      label: '',
      width: '44px',
      align: 'right',
      render: (c) => (
        <button
          onClick={e => { e.stopPropagation(); setDelId(c.id); }}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-50 text-red-400 transition"
        >
          <Trash2 size={13} />
        </button>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Clients"
        subtitle="Manage your insurance clients and their policies"
        icon={Users}
        color="sky"
        badge={total > 0 ? `${total} total` : undefined}
        actions={canEdit && (
          <Button icon={<Plus size={15}/>} onClick={() => setAddOpen(true)}>Add Client</Button>
        )}
      />

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input
          className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-3 focus:ring-sky-500/10 focus:border-sky-500 w-full shadow-sm transition-all"
          placeholder="Search name, phone, email, IC/passport…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={isLoading}
        rowKey={r => r.id}
        defaultSort={{ key: 'name', dir: 'asc' }}
        defaultPageSize={15}
        emptyMessage={search ? 'No clients match your search' : 'No clients yet — add your first client'}
        emptyIcon={<Users size={24} className="text-slate-300" />}
      />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Client" size="lg">
        <ClientForm onSubmit={handleAdd} loading={saving}/>
      </Modal>

      <ConfirmDialog
        open={!!delId}
        onClose={() => setDelId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Client"
        message="This will permanently delete the client and all related data. This cannot be undone."
      />

      <SendWishesModal
        open={!!wishClient}
        onClose={() => setWishClient(null)}
        client={wishClient}
      />
    </div>
  );
}
