'use client';

import { useEffect, useState, useRef } from 'react';
import { Upload, X, File, LoaderCircleIcon, Image as ImageIcon } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';

export function FileUpload({
  value,
  onChange,
  isMultiple = false,
  accept = 'image/*',
  maxSizeMB = 10,
  placeholder = 'Dosyaları buraya sürükleyin veya seçin',
  description = 'PNG, JPG, GIF veya WEBP formatları desteklenir.',
  folderId = null,
}) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mediaCache, setMediaCache] = useState({}); // Stores loaded media details by ID
  const [loadingIds, setLoadingIds] = useState(new Set()); // Track IDs currently fetching metadata

  // Normalise values to arrays for consistent rendering logic
  const valuesArray = isMultiple
    ? Array.isArray(value) ? value : []
    : value ? [value] : [];

  // Load metadata for items that are not in the cache yet
  useEffect(() => {
    const fetchMetadata = async (id) => {
      if (mediaCache[id] || loadingIds.has(id)) return;

      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });

      try {
        const res = await apiFetch(`/api/admin/media/files/${id}`);
        if (res.ok) {
          const json = await res.json();
          setMediaCache((prev) => ({ ...prev, [id]: json.data }));
        }
      } catch (err) {
        console.error(`Error loading media metadata for ID ${id}:`, err);
      } finally {
        setLoadingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    };

    valuesArray.forEach((id) => {
      if (id && !mediaCache[id]) {
        fetchMetadata(id);
      }
    });
  }, [value, mediaCache, loadingIds]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive" close={false}>
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{`Dosya boyutu ${maxSizeMB}MB'ı aşamaz.`}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
      return false;
    }
    return true;
  };

  const uploadFiles = async (files) => {
    const filesToUpload = isMultiple ? files : [files[0]];
    setUploading(true);

    let currentUploadedIds = [...valuesArray];

    for (const file of filesToUpload) {
      if (!validateFile(file)) continue;

      const formData = new FormData();
      formData.append('file', file);
      if (folderId && folderId !== 'root') {
        formData.append('folder_id', folderId);
      }

      try {
        const res = await apiFetch('/api/admin/media/files', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.message || 'Dosya yüklenemedi');
        }

        const json = await res.json();
        const mediaItem = json.data;

        // Add to local cache
        setMediaCache((prev) => ({ ...prev, [mediaItem.id]: mediaItem }));

        if (isMultiple) {
          currentUploadedIds = [...currentUploadedIds, mediaItem.id];
          onChange(currentUploadedIds);
        } else {
          onChange(mediaItem.id);
          break;
        }

        toast.custom(
          () => (
            <Alert variant="mono" icon="success" close={false}>
              <AlertIcon>
                <RiCheckboxCircleFill />
              </AlertIcon>
              <AlertTitle>{`${file.name} başarıyla yüklendi.`}</AlertTitle>
            </Alert>
          ),
          { position: 'top-center' }
        );
      } catch (err) {
        toast.custom(
          () => (
            <Alert variant="mono" icon="destructive" close={false}>
              <AlertIcon>
                <RiErrorWarningFill />
              </AlertIcon>
              <AlertTitle>{`${file.name}: ${err.message || 'Yükleme sırasında bir hata oluştu.'}`}</AlertTitle>
            </Alert>
          ),
          { position: 'top-center' }
        );
      }
    }

    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      uploadFiles(files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      uploadFiles(files);
    }
  };

  const handleRemove = (idToRemove) => {
    if (isMultiple) {
      onChange(valuesArray.filter((id) => id !== idToRemove));
    } else {
      onChange('');
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Visual Upload Dropzone Box */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[140px]',
          dragActive ? 'border-primary bg-primary/5 scale-[0.99]' : 'hover:border-primary/50 hover:bg-muted/10',
          uploading && 'pointer-events-none opacity-60'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={isMultiple}
          onChange={handleFileChange}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <LoaderCircleIcon className="size-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground font-semibold">Dosya yükleniyor...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 select-none">
            <div className="p-3 rounded-full bg-muted/40 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
              <Upload className="size-6" />
            </div>
            <span className="text-sm font-semibold text-foreground">{placeholder}</span>
            <span className="text-xs text-muted-foreground">{description}</span>
          </div>
        )}
      </div>

      {/* Grid of uploaded / loaded file previews */}
      {valuesArray.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {valuesArray.map((id) => {
            const item = mediaCache[id];
            const isLoading = loadingIds.has(id);
            const isImage = item?.mime_type?.startsWith('image/');
            const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
            const imageUrl = item?.url ? (item.url.startsWith('http') ? item.url : `${backendUrl}${item.url}`) : null;

            return (
              <div
                key={id}
                className="relative border border-border rounded-lg p-2 flex flex-col items-center justify-between bg-muted/5 group min-h-[120px]"
              >
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemove(id)}
                  className="absolute -top-1.5 -end-1.5 p-1 rounded-full bg-background border border-border text-muted-foreground hover:text-destructive hover:scale-105 shadow-xs transition-all cursor-pointer z-10"
                >
                  <X className="size-3.5" />
                </button>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center grow py-4">
                    <LoaderCircleIcon className="size-5 text-muted-foreground animate-spin" />
                  </div>
                ) : item ? (
                  <div className="w-full flex flex-col items-center text-center grow">
                    {/* Thumbnail preview */}
                    <div className="w-full h-16 rounded-md bg-muted/40 flex items-center justify-center overflow-hidden mb-2">
                      {isImage && imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.name || 'Görsel'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <File className="size-6 text-muted-foreground" />
                      )}
                    </div>

                    {/* Metadata */}
                    <span className="text-[10px] font-bold text-foreground truncate w-full px-1" title={item.name}>
                      {item.name}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {formatBytes(item.size)}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center grow py-4 text-center">
                    <ImageIcon className="size-5 text-muted-foreground mb-1" />
                    <span className="text-[9px] text-muted-foreground">Yükleniyor (ID: {id})</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
