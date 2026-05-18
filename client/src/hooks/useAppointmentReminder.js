import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { getAppointments } from '../api/appointments';
import { CalendarDays } from 'lucide-react';

const WARN_MINUTES = 5; // show toast this many minutes before appointment
const POLL_INTERVAL = 30_000; // check every 30s

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function appointmentDateTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

export default function useAppointmentReminder() {
  const notified = useRef(new Set()); // tracks IDs already toasted this session

  useEffect(() => {
    async function check() {
      try {
        const res = await getAppointments({ date: todayStr() });
        const appointments = res.data.data || [];
        const now = new Date();

        for (const appt of appointments) {
          if (!appt.appointment_time) continue;
          if (notified.current.has(appt.id)) continue;

          const apptDt = appointmentDateTime(appt.appointment_time);
          const diffMs = apptDt - now;
          const diffMin = diffMs / 60_000;

          // notify when appointment is within WARN_MINUTES and hasn't passed yet
          if (diffMin > 0 && diffMin <= WARN_MINUTES) {
            notified.current.add(appt.id);
            const name = appt.client_name || 'Unknown';
            const timeLabel = appt.appointment_time.slice(0, 5);
            toast(
              `Appointment with ${name} at ${timeLabel}`,
              {
                duration: 6000,
                icon: '📅',
                style: {
                  background: '#1e293b',
                  color: '#f1f5f9',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '12px',
                  padding: '12px 16px',
                },
              }
            );
          }
        }
      } catch {
        // silently ignore — no network = no reminder
      }
    }

    check(); // run immediately on mount
    const id = setInterval(check, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);
}
