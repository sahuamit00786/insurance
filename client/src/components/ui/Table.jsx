export function Table({ children, className = '', contained = false, minWidth }) {
  const table = (
    <table
      className={`w-full divide-y divide-slate-100 ${contained ? (minWidth || 'min-w-[1040px]') : 'min-w-full'}`}
    >
      {children}
    </table>
  );
  if (contained) return table;
  return (
    <div className={`overflow-x-auto ${className}`}>
      {table}
    </div>
  );
}

export function Thead({ children }) {
  return (
    <thead className="bg-slate-50/80">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ children, className = '' }) {
  return (
    <th className={`px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}

export function Tbody({ children, className = '' }) {
  return <tbody className={`bg-white divide-y divide-slate-100 ${className}`}>{children}</tbody>;
}

export function Tr({ children, onClick, className = '' }) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors duration-100 ${
        onClick ? 'cursor-pointer hover:bg-brand-50/50' : 'hover:bg-slate-50/80'
      } ${className}`}
    >
      {children}
    </tr>
  );
}

export function Td({ children, className = '', ...props }) {
  return (
    <td className={`px-4 py-3.5 text-sm text-slate-700 whitespace-nowrap ${className}`} {...props}>
      {children}
    </td>
  );
}
