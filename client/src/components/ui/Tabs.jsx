export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin">
    <div className="flex gap-1 border-b border-slate-200 -mb-px min-w-max">
      {tabs.map(t => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-150 whitespace-nowrap ${
            active === t.key
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'
          }`}
        >
          {t.icon && (
            <span className={active === t.key ? 'text-brand-600' : 'text-slate-400'}>
              {t.icon}
            </span>
          )}
          {t.label}
        </button>
      ))}
    </div>
    </div>
  );
}
