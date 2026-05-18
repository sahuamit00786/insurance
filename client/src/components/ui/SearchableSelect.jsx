import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export default function SearchableSelect({ value, onChange, options = [], placeholder = 'Select…', className = '' }) {
  const [open, setOpen] = useState(false);
  const [q, setQ]       = useState('');
  const ref             = useRef(null);

  useEffect(() => {
    const h = e => {
      if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQ(''); }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = options.filter(o => String(o.label).toLowerCase().includes(q.toLowerCase()));
  const selected  = options.find(o => String(o.value) === String(value));

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => { setOpen(p => !p); setQ(''); }}
        className="input-base w-full flex items-center justify-between gap-2 text-left"
      >
        <span className={selected ? 'text-slate-800' : 'text-slate-400 font-normal'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={13} className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input
                autoFocus
                className="w-full pl-7 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/10"
                placeholder="Search…"
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-44 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); setQ(''); }}
              className={`w-full text-left px-3.5 py-2 text-sm transition-colors ${!value ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {placeholder}
            </button>
            {filtered.length === 0 && <p className="px-3.5 py-3 text-sm text-slate-400">No results</p>}
            {filtered.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(String(o.value)); setOpen(false); setQ(''); }}
                className={`w-full text-left px-3.5 py-2 text-sm transition-colors ${String(value) === String(o.value) ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
