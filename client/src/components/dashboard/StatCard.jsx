const configs = {
  sky:     { accent: 'bg-brand-600',  icon: 'bg-brand-50  text-brand-700'  },
  emerald: { accent: 'bg-brand-500',  icon: 'bg-brand-50  text-brand-600'  },
  violet:  { accent: 'bg-brand-700',  icon: 'bg-brand-100 text-brand-700'  },
  amber:   { accent: 'bg-accent-600', icon: 'bg-brand-50  text-accent-600' },
};

export default function StatCard({ label, value, icon: Icon, color = 'sky', sub }) {
  const c = configs[color] || configs.sky;

  return (
    <div className="card-surface p-5 relative overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.accent}`} />
      <div className="flex items-start justify-between gap-4 pl-2">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-3xl font-semibold text-slate-900 mt-1.5 tracking-tight tabular-nums">
            {value ?? '—'}
          </p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${c.icon}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
