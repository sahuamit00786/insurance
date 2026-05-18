export default function Input({ label, error, className = '', required, ...props }) {
  return (
    <div className="flex flex-col">
      {label && (
        <label className="label-base">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        className={`input-base ${error ? 'error' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
