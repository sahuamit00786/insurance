export default function Select({ label, error, options = [], placeholder, className = '', ...props }) {
  return (
    <div className="flex flex-col">
      {label && <label className="label-base">{label}</label>}
      <select
        className={`input-base ${error ? 'error' : ''} ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
