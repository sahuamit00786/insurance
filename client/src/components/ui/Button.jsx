const variants = {
  primary:   'bg-brand-700 text-white hover:bg-brand-800 shadow-sm border border-brand-800/20',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm',
  danger:    'bg-red-600 text-white hover:bg-red-700 shadow-sm border border-red-700/20',
  ghost:     'text-slate-600 hover:bg-slate-100',
  success:   'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm border border-emerald-700/20',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-md',
  md: 'px-4 py-2 text-sm gap-2 rounded-lg',
  lg: 'px-5 py-2.5 text-sm gap-2 rounded-lg',
};

export default function Button({
  children, variant = 'primary', size = 'md',
  loading = false, icon, className = '', ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]
        ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      ) : icon ? <span className="shrink-0">{icon}</span> : null}
      {children}
    </button>
  );
}
