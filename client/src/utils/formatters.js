import { format, formatDistanceToNow, differenceInDays } from 'date-fns';

export const formatDate = (d, fmt = 'dd MMM yyyy') =>
  d ? format(new Date(d), fmt) : '—';

export const formatMonthYear = (d) => formatDate(d, 'MMM yyyy');

export const formatBirthdayCountdown = (days) => {
  if (days == null) return '—';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
};

export const formatCurrency = (v) =>
  v != null ? `RM ${parseFloat(v).toLocaleString('en-MY', { minimumFractionDigits: 2 })}` : '—';

export const daysUntil = (d) =>
  d ? differenceInDays(new Date(d), new Date()) : null;

export const fromNow = (d) =>
  d ? formatDistanceToNow(new Date(d), { addSuffix: true }) : '';

export const getExpiryVariant = (days) => {
  if (days === null) return 'gray';
  if (days < 0)  return 'red';
  if (days < 30) return 'amber';
  return 'green';
};

export const getExpiryLabel = (days) => {
  if (days === null) return '—';
  if (days < 0)  return 'Expired';
  if (days < 30) return 'Expiring Soon';
  return 'OK';
};

export const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
