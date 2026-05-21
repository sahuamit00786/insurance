import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Plus, Check, X } from 'lucide-react';

export default function SearchableSelect({ value, onChange, options = [], placeholder = 'Select…', className = '', onCreateNew }) {
  const [open, setOpen]         = useState(false);
  const [q, setQ]               = useState('');
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [saving, setSaving]     = useState(false);
  const ref                     = useRef(null);
  const newInputRef             = useRef(null);

  useEffect(() => {
    const h = e => {
      if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQ(''); setCreating(false); setNewLabel(''); }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = options.filter(o => String(o.label).toLowerCase().includes(q.toLowerCase()));
  const selected  = options.find(o => String(o.value) === String(value));

  const handleCreate = async () => {
    if (!newLabel.trim() || saving) return;
    setSaving(true);
    try {
      const result = await onCreateNew(newLabel.trim());
      if (result?.value) onChange(String(result.value));
      setCreating(false);
      setNewLabel('');
      setOpen(false);
      setQ('');
    } catch {}
    finally { setSaving(false); }
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => { setOpen(p => !p); setQ(''); setCreating(false); setNewLabel(''); }}
        className="input-base w-full flex items-center justify-between gap-2 text-left"
      >
        <span className={selected ? 'text-slate-800' : 'text-slate-400 font-normal'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={13} className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg">
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

          {onCreateNew && !creating && (
            <button
              type="button"
              onClick={() => { setCreating(true); setTimeout(() => newInputRef.current?.focus(), 0); }}
              className="w-full text-left px-3.5 py-2 text-sm text-brand-600 hover:bg-brand-50 border-t border-slate-100 font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus size={12}/> Create new
            </button>
          )}

          {onCreateNew && creating && (
            <div className="border-t border-slate-100 flex items-center gap-1 px-2 py-1.5">
              <input
                ref={newInputRef}
                className="flex-1 min-w-0 px-2 py-1 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/10"
                placeholder="New value…"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); handleCreate(); }
                  if (e.key === 'Escape') { setCreating(false); setNewLabel(''); }
                }}
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={saving || !newLabel.trim()}
                className="flex h-6 w-6 items-center justify-center rounded text-emerald-600 hover:text-emerald-700 disabled:opacity-40 transition shrink-0"
              >
                {saving ? <span className="text-[10px]">…</span> : <Check size={13}/>}
              </button>
              <button
                type="button"
                onClick={() => { setCreating(false); setNewLabel(''); }}
                className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:text-slate-600 transition shrink-0"
              >
                <X size={13}/>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
