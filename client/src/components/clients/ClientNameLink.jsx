import { useNavigate } from 'react-router-dom';

export default function ClientNameLink({ clientId, children, className = '' }) {
  const nav = useNavigate();

  if (!clientId) {
    return <span className={className}>{children}</span>;
  }

  return (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation();
        nav(`/clients/${clientId}`);
      }}
      className={`font-medium text-left text-slate-900 transition-colors hover:text-brand-700 hover:underline underline-offset-2 decoration-brand-600 ${className}`}
    >
      {children}
    </button>
  );
}
