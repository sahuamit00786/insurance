import { useState, useEffect } from 'react';
import { fetchDocumentFile } from '../api/clients';

export default function useDocumentBlob(docId) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(!!docId);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!docId) {
      setUrl(null);
      setLoading(false);
      return;
    }

    let objectUrl;
    let cancelled = false;

    setLoading(true);
    setError(false);

    fetchDocumentFile(docId)
      .then(res => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.data);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [docId]);

  return { url, loading, error };
}
