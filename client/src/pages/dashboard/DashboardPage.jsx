import { useQuery } from '@tanstack/react-query';
import { Users, ShieldCheck, FileText, UserCog, LayoutDashboard } from 'lucide-react';
import { getStats, getUpcomingBirthdays } from '../../api/dashboard';
import StatCard from '../../components/dashboard/StatCard';
import UpcomingBirthdaysTable from '../../components/dashboard/UpcomingBirthdaysTable';
import CalendarWidget from '../../components/dashboard/CalendarWidget';
import ExpiryTable from '../../components/dashboard/ExpiryTable';
import MaturityTable from '../../components/dashboard/MaturityTable';
import { PageLoader } from '../../components/ui/Spinner';
import PageHeader from '../../components/ui/PageHeader';
import useAuthStore from '../../store/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: stats, isLoading: sL } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn:  () => getStats().then(r => r.data.data),
    refetchInterval: 60000,
  });
  const { data: clients = [], isLoading: cL } = useQuery({
    queryKey: ['dashboard-birthdays'],
    queryFn:  () => getUpcomingBirthdays(10).then(r => r.data.data),
  });
  if (sL && cL) return <PageLoader/>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name?.split(' ')[0] || 'Admin'} — here's what's happening`}
        icon={LayoutDashboard}
        color="sky"
      />
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard label="Total Clients"     value={stats?.totalClients}    icon={Users}      color="sky"     sub="All registered clients"/>
        <StatCard label="Active Insurance"  value={stats?.activeInsurance}  icon={ShieldCheck} color="emerald" sub="Currently active policies"/>
        <StatCard label="Documents"         value={stats?.totalDocuments}   icon={FileText}   color="violet"  sub="Total uploaded files"/>
        <StatCard label="Staff"             value={stats?.totalStaff}       icon={UserCog}    color="amber"   sub="Active accounts"/>
      </div>

      {/* Upcoming birthdays + Calendar */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 items-stretch">
        <div className="xl:col-span-3 flex min-h-0">
          <UpcomingBirthdaysTable clients={clients} />
        </div>
        <div className="xl:col-span-2 flex min-h-0">
          <CalendarWidget />
        </div>
      </div>

      {/* Maturity + Expiry tables */}
      <MaturityTable />
      <ExpiryTable />
    </div>
  );
}
