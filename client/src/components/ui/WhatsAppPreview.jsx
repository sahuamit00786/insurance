import { format } from 'date-fns';

export default function WhatsAppPreview({ message, contactName }) {
  const now = format(new Date(), 'h:mm a');

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-[#e5ddd5] min-h-[280px] flex flex-col">
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ background: 'linear-gradient(180deg, #075e54 0%, #128c7e 100%)' }}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white text-sm font-semibold">
          {(contactName || '?').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white truncate">{contactName || 'Contact'}</p>
          <p className="text-[11px] text-white/70">online</p>
        </div>
      </div>

      <div
        className="flex-1 p-4 overflow-y-auto"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cfc7' fill-opacity='0.35'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {!message ? (
          <p className="text-center text-xs text-slate-500/80 py-8">Start typing your message to preview</p>
        ) : (
          <div className="flex justify-end">
            <div className="relative max-w-[85%] rounded-lg rounded-tr-none px-3 py-2 shadow-sm" style={{ background: '#d9fdd3' }}>
              <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed break-words">{message}</p>
              <span className="block text-right text-[10px] text-slate-500/80 mt-1 tabular-nums">{now}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
