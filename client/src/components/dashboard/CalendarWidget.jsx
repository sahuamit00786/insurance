import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { getAppointments } from '../../api/appointments';
import { CardHeader } from '../ui/Card';
import AppointmentModal from './AppointmentModal';

export default function CalendarWidget() {
  const [current, setCurrent] = useState(new Date());
  const [modal, setModal] = useState({ open: false, date: null, mode: 'view' });

  const monthStr = format(current, 'yyyy-MM');
  const { data: appointments = [], refetch } = useQuery({
    queryKey: ['appointments', monthStr],
    queryFn: () => getAppointments({ month: monthStr }).then(r => r.data.data),
  });

  const apptMap = useMemo(() => {
    const map = {};
    appointments.forEach(a => {
      const d = a.appointment_date?.slice(0, 10);
      if (d) map[d] = (map[d] || 0) + 1;
    });
    return map;
  }, [appointments]);

  const start = startOfWeek(startOfMonth(current), { weekStartsOn: 1 });
  const end   = endOfWeek(endOfMonth(current), { weekStartsOn: 1 });
  const days  = [];
  let d = start;
  while (d <= end) { days.push(d); d = addDays(d, 1); }

  const handleDayClick = (day) => {
    const ds = format(day, 'yyyy-MM-dd');
    setModal({ open: true, date: ds });
  };

  const dayAppts = modal.date ? appointments.filter(a => a.appointment_date?.slice(0, 10) === modal.date) : [];
  const today = new Date();
  const rowCount = Math.ceil(days.length / 7);

  return (
    <div className="card-surface flex h-full w-full min-h-0 flex-col overflow-hidden">
      <CardHeader
        title="Appointments"
        icon={CalendarDays}
        action={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrent(subMonths(current, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-slate-100 text-slate-500 transition"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm font-medium text-slate-700 w-24 text-center tabular-nums">
              {format(current, 'MMM yyyy')}
            </span>
            <button
              type="button"
              onClick={() => setCurrent(addMonths(current, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-slate-100 text-slate-500 transition"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4 pt-0">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200">
          <div className="grid grid-cols-7 shrink-0 divide-x divide-slate-200 border-b border-slate-200 bg-slate-50/80">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
              <div key={day} className="text-center text-[10px] font-semibold text-slate-500 py-2 uppercase tracking-wide">
                {day}
              </div>
            ))}
          </div>

          <div
            className="grid grid-cols-7 flex-1 min-h-0 divide-x divide-y divide-slate-200"
            style={{ gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))` }}
          >
            {days.map((day, i) => {
              const ds = format(day, 'yyyy-MM-dd');
              const inMonth = isSameMonth(day, current);
              const isToday = isSameDay(day, today);
              const count   = inMonth ? (apptMap[ds] || 0) : 0;
              const hasAppt = count > 0;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => inMonth && handleDayClick(day)}
                  disabled={!inMonth}
                  className={`relative flex h-full min-h-[2rem] w-full flex-col items-center justify-center pb-2 text-sm font-medium transition-colors ${
                    !inMonth
                      ? 'bg-slate-50/50 opacity-40 cursor-default'
                      : isToday
                        ? 'bg-brand-700 text-white'
                        : hasAppt
                          ? 'bg-brand-50 text-brand-800 hover:bg-brand-100'
                          : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {format(day, 'd')}
                  {hasAppt && (
                    <div className="absolute bottom-1 flex items-center gap-0.5">
                      {Array.from({ length: Math.min(count, 3) }).map((_, idx) => (
                        <span
                          key={idx}
                          className={`h-1 w-1 rounded-full ${isToday ? 'bg-white/80' : 'bg-brand-500'}`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-auto flex shrink-0 items-center gap-4 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
            <span className="text-xs text-slate-500">Has appointment</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded-md bg-brand-700" />
            <span className="text-xs text-slate-500">Today</span>
          </div>
        </div>
      </div>

      <AppointmentModal
        open={modal.open}
        onClose={() => setModal({ open: false, date: null })}
        date={modal.date}
        appointments={dayAppts}
        onSuccess={refetch}
      />
    </div>
  );
}
