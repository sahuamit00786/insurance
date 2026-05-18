const ICON_COLORS = {
  brand:   'bg-brand-50 text-brand-700',
  sky:     'bg-brand-50 text-brand-700',
  emerald: 'bg-brand-50 text-brand-700',
  violet:  'bg-brand-50 text-brand-700',
  amber:   'bg-brand-50 text-brand-700',
  rose:    'bg-brand-50 text-brand-700',
};

export default function PageHeader({ title, subtitle, icon: Icon, color = 'sky', actions, badge }) {
  const iconCls = ICON_COLORS[color] || ICON_COLORS.sky;

  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 pb-6 border-b border-slate-200/80">
      <div className="flex items-start gap-4">
        {Icon && (
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${iconCls}`}>
            <Icon size={20} />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{title}</h1>
            {badge != null && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200/80">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-sm text-slate-500 mt-1 max-w-2xl">{subtitle}</p>}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto [&_button]:flex-1 sm:[&_button]:flex-none min-w-0">
          {actions}
        </div>
      )}
    </div>
  );
}
