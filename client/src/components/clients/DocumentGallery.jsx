import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { FileText, Upload, Trash2, Image, Eye, Loader2 } from 'lucide-react';
import { getDocuments, uploadDocument, deleteDocument, fetchDocumentFile } from '../../api/clients';
import ConfirmDialog from '../ui/ConfirmDialog';
import Lightbox from '../ui/Lightbox';
import { formatDate } from '../../utils/formatters';
import useLookup from '../../hooks/useLookup';
import useDocumentBlob from '../../hooks/useDocumentBlob';
import usePermission from '../../hooks/usePermission';

function FileCard({ doc, onView, onDelete, canDelete }) {
  const isImage = doc.file_type?.startsWith('image/');
  const { url, loading, error } = useDocumentBlob(doc.id);

  return (
    <div className="group relative bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition">
      <div className="relative h-36 bg-slate-50 flex items-center justify-center overflow-hidden">
        {loading && (
          <Loader2 size={24} className="animate-spin text-slate-300" />
        )}
        {!loading && error && (
          <FileText size={32} className="text-red-300" />
        )}
        {!loading && !error && isImage && url && (
          <img src={url} alt={doc.original_name} className="w-full h-full object-cover" />
        )}
        {!loading && !error && !isImage && (
          <FileText size={32} className="text-slate-300" />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
          <button
            type="button"
            onClick={() => onView(doc)}
            className="p-2 rounded-full bg-white/90 text-slate-700 hover:bg-white transition"
          >
            <Eye size={15} />
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(doc.id)}
              className="p-2 rounded-full bg-white/90 text-red-500 hover:bg-white transition"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
      <div className="px-3 py-2">
        <p className="text-xs font-medium text-slate-700 truncate">{doc.original_name}</p>
        <p className="text-xs text-slate-400 mt-0.5">{doc.document_type || 'Document'} · {formatDate(doc.created_at)}</p>
      </div>
    </div>
  );
}

export default function DocumentGallery({ clientId }) {
  const qc = useQueryClient();
  const canEdit   = usePermission('clients', 'edit');
  const canDelete = usePermission('clients', 'delete');
  const [uploading, setUploading] = useState(false);
  const [delId, setDelId]         = useState(null);
  const [deleting, setDeleting]   = useState(false);
  const [lightbox, setLightbox]   = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [docTypeId, setDocTypeId] = useState('');
  const docTypes = useLookup('document_type');

  const { data: docs = [] } = useQuery({
    queryKey: ['documents', clientId],
    queryFn:  () => getDocuments(clientId).then(r => r.data.data),
  });

  const onDrop = useCallback(async (files) => {
    if (!files.length) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', files[0]);
      if (docTypeId) form.append('document_type_id', docTypeId);
      await uploadDocument(clientId, form);
      toast.success('Document uploaded');
      qc.invalidateQueries({ queryKey: ['documents', clientId] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [clientId, docTypeId, qc]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    accept: {
      'image/*':           [],
      'application/pdf':   [],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv':          ['.csv'],
    },
    onDropRejected: (rejections) => {
      const r = rejections[0];
      if (r?.errors?.[0]?.code === 'file-too-large') toast.error('File exceeds 10 MB limit');
      else toast.error('File type not allowed');
    },
  });

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteDocument(delId);
      toast.success('Document deleted');
      qc.invalidateQueries({ queryKey: ['documents', clientId] });
      setDelId(null);
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleView = async (doc) => {
    setViewLoading(true);
    try {
      const res = await fetchDocumentFile(doc.id);
      const src = URL.createObjectURL(res.data);
      setLightbox({
        src,
        filename: doc.original_name,
        fileType: doc.file_type,
        isBlob: true,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load document');
    } finally {
      setViewLoading(false);
    }
  };

  const closeLightbox = () => {
    if (lightbox?.isBlob && lightbox.src) {
      URL.revokeObjectURL(lightbox.src);
    }
    setLightbox(null);
  };

  return (
    <div className="space-y-5">
      {canEdit && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <select
              className="input-base max-w-xs"
              value={docTypeId}
              onChange={e => setDocTypeId(e.target.value)}
            >
              <option value="">Document type (optional)</option>
              {docTypes.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
              isDragActive ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-brand-400 hover:bg-slate-50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload size={24} className={`mx-auto mb-3 ${isDragActive ? 'text-brand-600' : 'text-slate-300'}`} />
            <p className="text-sm text-slate-500">
              {uploading ? 'Uploading...' : isDragActive ? 'Drop file here' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-xs text-slate-400 mt-1">PDF, images, DOCX, XLSX, CSV · Max 10 MB · No videos</p>
          </div>
        </div>
      )}

      {viewLoading && (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" />
          Opening document...
        </div>
      )}

      {docs.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Image size={32} className="mx-auto mb-3 text-slate-200" />
          <p className="text-sm">No documents uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {docs.map(doc => (
            <FileCard key={doc.id} doc={doc} onView={handleView} onDelete={setDelId} canDelete={canDelete} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!delId}
        onClose={() => setDelId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Document"
        message="This document will be permanently deleted."
      />

      <Lightbox
        open={!!lightbox}
        onClose={closeLightbox}
        src={lightbox?.src}
        filename={lightbox?.filename}
        fileType={lightbox?.fileType}
      />
    </div>
  );
}
