export default function Card({ children, className = '', padding = true, hover = false }) {
  return (
    <div
      className={`card-surface ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''} ${padding ? 'p-6' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="card-surface-header">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <Icon size={16} />
          </div>
        )}
        <div>
          <h3 className="card-surface-title">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
