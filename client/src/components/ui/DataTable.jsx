import { useState, useMemo } from 'react';
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Inbox,
} from 'lucide-react';

const BASE_PAGE_SIZES = [10, 25, 50, 100];

function SortIcon({ active, dir }) {
  if (!active) return <ChevronsUpDown size={13} className="text-slate-300 shrink-0" />;
  return dir === 'asc'
    ? <ChevronUp   size={13} className="text-brand-600 shrink-0" />
    : <ChevronDown size={13} className="text-brand-600 shrink-0" />;
}

const WIDTHS = ['w-1/3', 'w-1/2', 'w-2/5', 'w-3/5', 'w-1/4'];
function SkeletonRow({ colCount, index }) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      {Array.from({ length: colCount }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div
            className={`h-3.5 rounded-full bg-slate-100 animate-pulse ${WIDTHS[(index * colCount + i) % WIDTHS.length]}`}
            style={{ animationDelay: `${(index * 0.05 + i * 0.03).toFixed(2)}s` }}
          />
        </td>
      ))}
    </tr>
  );
}

function PBtn({ onClick, disabled, children, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-semibold transition-all
        ${active
          ? 'bg-brand-700 text-white shadow-sm'
          : disabled
            ? 'text-slate-300 cursor-not-allowed'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
        }`}
    >
      {children}
    </button>
  );
}

/**
 * Props:
 *  columns       [{ key, label, sortable?, align?, width?, render?(row,i) }]
 *  rows          array — all rows (client-side) OR current page rows (server-side)
 *  loading       bool
 *  emptyMessage  string
 *  emptyIcon     ReactNode
 *  defaultSort   { key, dir }        — client-side initial sort
 *  defaultPageSize number            — default (client-side)
 *  rowKey        fn(row) => key
 *  onRowClick    fn(row)
 *  toolbar       ReactNode           — rendered above table
 *  dense         bool
 *  noWrapper     bool                — skip outer card shell (embed in existing card)
 *  hidePagination bool               — hide footer entirely
 *
 * Server-side mode (pass serverSide=true):
 *  serverSide    bool
 *  totalRows     number
 *  page          number              — controlled from outside
 *  pageSize      number              — controlled from outside
 *  onPageChange  fn(page)
 *  onPageSizeChange fn(size)
 *  onSort        fn(key, dir)
 *  sortKey       string              — controlled sort key
 *  sortDir       'asc'|'desc'        — controlled sort dir
 */
export default function DataTable({
  columns = [],
  rows = [],
  loading = false,
  emptyMessage = 'No records found',
  emptyIcon,
  defaultSort,
  defaultPageSize = 10,
  rowKey,
  onRowClick,
  rowClassName,
  toolbar,
  dense = false,
  noWrapper = false,
  hidePagination = false,
  // server-side
  serverSide = false,
  totalRows,
  page: pageProp,
  pageSize: pageSizeProp,
  onPageChange,
  onPageSizeChange,
  onSort,
  sortKey: sortKeyProp,
  sortDir: sortDirProp,
}) {
  /* ── Client-side state ── */
  const [cSortKey, setCsortKey] = useState(defaultSort?.key ?? null);
  const [cSortDir, setCsortDir] = useState(defaultSort?.dir ?? 'asc');
  const [cPage,    setCpage]    = useState(1);
  const [cSize,    setCsize]    = useState(defaultPageSize);
  const [ssSize,   setSsSize]   = useState(pageSizeProp ?? defaultPageSize);

  const pageSizes = useMemo(() => {
    const init = serverSide ? (pageSizeProp ?? defaultPageSize) : defaultPageSize;
    return BASE_PAGE_SIZES.includes(init) ? BASE_PAGE_SIZES : [...BASE_PAGE_SIZES, init].sort((a, b) => a - b);
  }, []);

  const sortKey = serverSide ? sortKeyProp : cSortKey;
  const sortDir = serverSide ? sortDirProp : cSortDir;
  const page    = serverSide ? pageProp    : cPage;
  const pageSize= serverSide ? ssSize      : cSize;

  /* ── Client-side sort+paginate ── */
  const sorted = useMemo(() => {
    if (serverSide || !cSortKey) return rows;
    return [...rows].sort((a, b) => {
      const av = a[cSortKey], bv = b[cSortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = (typeof av === 'number' && typeof bv === 'number')
        ? av - bv
        : String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
      return cSortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, cSortKey, cSortDir, serverSide]);

  const total  = serverSide ? (totalRows ?? rows.length) : sorted.length;
  const pages  = Math.max(1, Math.ceil(total / (pageSize ?? defaultPageSize)));
  const safePg = Math.min(page ?? 1, pages);
  const paged  = serverSide ? rows : sorted.slice((safePg - 1) * pageSize, safePg * pageSize);

  /* ── Handlers ── */
  const handleSort = (col) => {
    if (!col.sortable) return;
    if (serverSide) {
      const newDir = sortKey === col.key && sortDir === 'asc' ? 'desc' : 'asc';
      onSort?.(col.key, newDir);
    } else {
      if (cSortKey === col.key) { setCsortDir(d => d === 'asc' ? 'desc' : 'asc'); }
      else { setCsortKey(col.key); setCsortDir('asc'); }
      setCpage(1);
    }
  };

  const handlePage = (n) => { serverSide ? onPageChange?.(n) : setCpage(n); };
  const handleSize = (n) => {
    if (serverSide) { setSsSize(n); onPageSizeChange?.(n); onPageChange?.(1); }
    else { setCsize(n); setCpage(1); }
  };

  /* ── Page window ── */
  const pageWindow = useMemo(() => {
    const delta = 1, range = [];
    const left  = Math.max(2, safePg - delta);
    const right = Math.min(pages - 1, safePg + delta);
    range.push(1);
    if (left > 2)          range.push('…l');
    for (let i = left; i <= right; i++) range.push(i);
    if (right < pages - 1) range.push('…r');
    if (pages > 1)         range.push(pages);
    return range;
  }, [safePg, pages]);

  const alignCls = (a) => a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';
  const cellPad  = dense ? 'px-4 py-2.5' : 'px-4 py-3.5';
  const headPad  = dense ? 'px-4 py-2.5' : 'px-4 py-3';

  const inner = (
    <>
      {toolbar && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          {toolbar}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b-2 border-slate-200">
              {columns.map(col => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                  onClick={() => handleSort(col)}
                  className={[
                    headPad,
                    'text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap select-none transition-colors',
                    alignCls(col.align),
                    col.sortable ? 'cursor-pointer hover:bg-slate-100 hover:text-slate-700' : '',
                    sortKey === col.key ? 'text-brand-700 bg-brand-50/60' : '',
                  ].filter(Boolean).join(' ')}
                >
                  <div className={`inline-flex items-center gap-1.5 ${col.align === 'right' ? 'flex-row-reverse' : ''}`}>
                    {col.label}
                    {col.sortable && <SortIcon active={sortKey === col.key} dir={sortDir} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading && Array.from({ length: Math.min(pageSize ?? defaultPageSize, 8) }).map((_, i) => (
              <SkeletonRow key={i} colCount={columns.length} index={i} />
            ))}

            {!loading && paged.length === 0 && (
              <tr>
                <td colSpan={columns.length}>
                  <div className="flex flex-col items-center gap-3 py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                      {emptyIcon ?? <Inbox size={24} className="text-slate-300" />}
                    </div>
                    <p className="text-sm font-medium text-slate-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}

            {!loading && paged.map((row, i) => (
              <tr
                key={rowKey ? rowKey(row) : (row.id ?? i)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={[
                  'border-b border-slate-100 last:border-0 transition-colors',
                  onRowClick ? 'cursor-pointer hover:bg-brand-50/40' : 'hover:bg-slate-50/70',
                  rowClassName ? rowClassName(row) : '',
                ].filter(Boolean).join(' ')}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={[
                      cellPad,
                      'text-sm text-slate-700 whitespace-nowrap',
                      alignCls(col.align),
                      sortKey === col.key ? 'bg-brand-50/20' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    {col.render ? col.render(row, i) : (row[col.key] ?? <span className="text-slate-300">—</span>)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!hidePagination && (
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-3 sm:px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">Rows per page</span>
            <select
              value={pageSize ?? defaultPageSize}
              onChange={e => handleSize(Number(e.target.value))}
              className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
            >
              {pageSizes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <span className="text-xs text-slate-500 tabular-nums">
            {total === 0
              ? '0 records'
              : `${(safePg - 1) * (pageSize ?? defaultPageSize) + 1}–${Math.min(safePg * (pageSize ?? defaultPageSize), total)} of ${total}`}
          </span>

          <div className="flex items-center gap-0.5 flex-wrap justify-center sm:justify-end">
            <PBtn onClick={() => handlePage(1)}          disabled={safePg === 1}><ChevronsLeft  size={13}/></PBtn>
            <PBtn onClick={() => handlePage(safePg - 1)} disabled={safePg === 1}><ChevronLeft   size={13}/></PBtn>
            {pageWindow.map((p, i) =>
              String(p).startsWith('…')
                ? <span key={p} className="px-1 text-xs text-slate-400 select-none">…</span>
                : <PBtn key={p} active={p === safePg} onClick={() => handlePage(p)}>{p}</PBtn>
            )}
            <PBtn onClick={() => handlePage(safePg + 1)} disabled={safePg >= pages}><ChevronRight  size={13}/></PBtn>
            <PBtn onClick={() => handlePage(pages)}      disabled={safePg >= pages}><ChevronsRight size={13}/></PBtn>
          </div>
        </div>
      )}
    </>
  );

  if (noWrapper) return <div className="flex flex-col">{inner}</div>;

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {inner}
    </div>
  );
}
