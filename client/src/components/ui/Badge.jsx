const configs = {
  green:  { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  red:    { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500',     border: 'border-red-200'     },
  amber:  { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500',   border: 'border-amber-200'   },
  blue:   { bg: 'bg-sky-50',     text: 'text-sky-700',     dot: 'bg-sky-500',     border: 'border-sky-200'     },
  gray:   { bg: 'bg-slate-50',   text: 'text-slate-600',   dot: 'bg-slate-400',   border: 'border-slate-200'   },
  purple: { bg: 'bg-purple-50',  text: 'text-purple-700',  dot: 'bg-purple-500',  border: 'border-purple-200'  },
};

function getVariant(value) {
  if (!value) return 'gray';
  const v = value.toLowerCase();
  if (['active'].includes(v))                        return 'green';
  if (['inactive','lapsed','expired'].includes(v))   return 'red';
  if (['pending','expiring soon'].includes(v))       return 'amber';
  if (['admin'].includes(v))                         return 'purple';
  if (['manager'].includes(v))                       return 'blue';
  return 'blue';
}

export default function Badge({ children, variant, dot = false }) {
  const v = variant || getVariant(typeof children === 'string' ? children : '');
  const c = configs[v] || configs.gray;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${c.dot}`}/>}
      {children}
    </span>
  );
}
