'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, LoaderCircleIcon, Copy, Check, File, Globe, ExternalLink, Calendar, HardDrive, FileText, Image as ImageIcon } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RightDrawer } from '@/components/common/right-drawer';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';

export default function MediaMetaDrawer({ open, onOpenChange, file, folderId }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && file) {
      setTitle(file.metadata?.title || file.title || '');
      setAltText(file.metadata?.alt_text || file.alt_text || '');
      setCaption(file.metadata?.caption || file.caption || '');
      setDescription(file.metadata?.description || file.description || '');
      setCopied(false);
    }
  }, [open, file]);

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const res = await apiFetch(`/api/admin/media/files/${file.id}/meta`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Meta veriler güncellenemedi.');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-media-files', String(folderId)] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Dosya detayları başarıyla güncellendi.</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
      onOpenChange(false);
    },
    onError: (err) => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive" close={false}>
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{err.message || 'Güncelleme işlemi başarısız.'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  if (!file) return null;

  const isImage = file.mime_type?.startsWith('image/');
  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
  const fileUrl = file.url ? (file.url.startsWith('http') ? file.url : `${backendUrl}${file.url}`) : '';

  const handleCopyUrl = () => {
    if (fileUrl) {
      navigator.clipboard.writeText(fileUrl);
      setCopied(true);
      toast.success('Dosya URL\'i kopyalandı.');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      title: title.trim(),
      alt_text: altText.trim(),
      caption: caption.trim(),
      description: description.trim(),
    });
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const footerContent = (
    <>
      <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
        İptal
      </Button>
      <Button
        type="submit"
        form="media-meta-form"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <LoaderCircleIcon className="size-4 animate-spin mr-1.5" />
        ) : (
          <Save className="size-4 mr-1.5" />
        )}
        Güncelle
      </Button>
    </>
  );

  return (
    <RightDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Dosya Detayları & SEO Meta Verileri"
      size="lg"
      footer={footerContent}
    >
      <div className="space-y-6">
        {/* Preview Frame */}
        <div className="w-full h-48 rounded-xl bg-muted/30 border border-border flex items-center justify-center overflow-hidden relative group">
          {isImage && fileUrl ? (
            <img
              src={fileUrl}
              alt={file.name || 'Görsel'}
              className="max-h-full max-w-full object-contain"
            />
          ) : file.mime_type?.startsWith('video/') && fileUrl ? (
            <video
              src={fileUrl}
              className="max-h-full max-w-full object-contain shadow-sm rounded-lg"
              controls
              muted
              playsInline
            />
          ) : (
            <File className="size-16 text-muted-foreground" />
          )}

          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-3 end-3 p-2 rounded-lg bg-background/80 border border-border text-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-background shadow-xs"
              title="Yeni sekmede aç"
            >
              <ExternalLink className="size-4" />
            </a>
          )}
        </div>

        {/* File Attributes Metadata */}
        <div className="grid grid-cols-2 gap-3.5 bg-muted/10 p-4 border border-border rounded-xl text-xs">
          <div className="space-y-1">
            <span className="text-muted-foreground flex items-center gap-1 font-semibold select-none">
              <FileText className="size-3.5" /> Dosya Adı
            </span>
            <span className="font-mono text-foreground font-semibold break-all">{file.name}</span>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground flex items-center gap-1 font-semibold select-none">
              <HardDrive className="size-3.5" /> Dosya Boyutu
            </span>
            <span className="text-foreground font-semibold">{formatBytes(file.size)}</span>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground flex items-center gap-1 font-semibold select-none">
              <ImageIcon className="size-3.5" /> Dosya Türü
            </span>
            <span className="text-foreground font-semibold">{file.mime_type}</span>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground flex items-center gap-1 font-semibold select-none">
              <Calendar className="size-3.5" /> Yükleme Tarihi
            </span>
            <span className="text-foreground font-semibold">
              {file.created_at ? new Date(file.created_at).toLocaleString('tr-TR') : '-'}
            </span>
          </div>
        </div>

        {/* Public Copy-to-Clipboard URL Block */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 select-none">
            <Globe className="size-3.5" /> Genel Erişim URL
          </Label>
          <div className="flex gap-2">
            <Input
              value={fileUrl}
              readOnly
              className="font-mono text-xs select-all bg-muted/20"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyUrl}
              className="shrink-0 h-10 w-10 p-0"
              title="Kopyala"
            >
              {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
            </Button>
          </div>
        </div>

        <hr className="border-border" />

        {/* Interactive SEO Settings Form */}
        <form id="media-meta-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="file-title" className="text-xs font-semibold text-muted-foreground">
              Dosya Başlığı (Title)
            </Label>
            <Input
              id="file-title"
              type="text"
              placeholder="Dosya için başlık girin..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {isImage && (
            <div className="space-y-1.5">
              <Label htmlFor="file-alt" className="text-xs font-semibold text-muted-foreground">
                Alternatif Metin (Alt Text - SEO)
              </Label>
              <Input
                id="file-alt"
                type="text"
                placeholder="Görseli tanımlayan alt metin..."
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="file-caption" className="text-xs font-semibold text-muted-foreground">
              Dosya Altyazısı (Caption)
            </Label>
            <Input
              id="file-caption"
              type="text"
              placeholder="Dosya altındaki küçük açıklama metni..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="file-desc" className="text-xs font-semibold text-muted-foreground">
              Dosya Açıklaması (Description)
            </Label>
            <Textarea
              id="file-desc"
              rows={4}
              placeholder="Dosya hakkında detaylı bilgi..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </form>
      </div>
    </RightDrawer>
  );
}
