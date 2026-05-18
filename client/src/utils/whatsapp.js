/** Digits only, for wa.me / whatsapp:// */
export function formatWhatsAppPhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
}

/** Open WhatsApp native app with prefilled message; falls back to wa.me web link. */
export function openWhatsAppWeb(phone, text) {
  const digits = formatWhatsAppPhone(phone);
  if (!digits) return false;
  const encoded = encodeURIComponent(text || '');
  const nativeUrl = `whatsapp://send?phone=${digits}&text=${encoded}`;
  const webUrl    = `https://wa.me/${digits}?text=${encoded}`;

  const a = document.createElement('a');
  a.href = nativeUrl;
  a.rel  = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // On desktop where native app may not be installed, open web fallback after a short delay
  setTimeout(() => {
    if (document.visibilityState !== 'hidden') {
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    }
  }, 1500);

  return true;
}
