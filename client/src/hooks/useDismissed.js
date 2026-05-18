import { useState, useCallback } from 'react';

function load(key) {
  try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); }
  catch { return new Set(); }
}

function save(key, set) {
  localStorage.setItem(key, JSON.stringify([...set]));
}

export default function useDismissed(key) {
  const [dismissed, setDismissed] = useState(() => load(key));

  const dismiss = useCallback((id) => {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(id);
      save(key, next);
      return next;
    });
  }, [key]);

  const dismissAll = useCallback((ids) => {
    setDismissed(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      save(key, next);
      return next;
    });
  }, [key]);

  return { dismissed, dismiss, dismissAll };
}
