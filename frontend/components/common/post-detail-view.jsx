'use client';

import * as React from 'react';
import PostBlockRenderer from '@/components/blocks/post-block-renderer';
import { PostCard } from '@/components/ui/post-card';
import { CtaSection } from '@/components/common/cta-section';
import { Link as LinkIcon, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper to resolve localized values
function getLocalizedValue(value, lang = 'tr') {
  if (!value) return '';
  if (typeof value === 'object') {
    return value[lang] || value['tr'] || value['en'] || '';
  }
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === 'object') {
      return parsed[lang] || parsed['tr'] || parsed['en'] || '';
    }
  } catch (e) {}
  return String(value);
}



export default function PostDetailView({ 
  entry, 
  locale = 'tr', 
  suggestedEntries = [], 
  previewSize = 'desktop' 
}) {
  if (!entry) return null;

  const isMobile = previewSize === 'mobile';
  const isTablet = previewSize === 'tablet';

  const titleClass = cn(
    "font-extrabold tracking-tight leading-tight text-foreground",
    isMobile 
      ? "text-2xl" 
      : isTablet 
      ? "text-4xl" 
      : "text-2xl sm:text-3xl md:text-4xl lg:text-5xl"
  );

  const headerRowClass = cn(
    "flex gap-3 border-b border-border pb-4",
    isMobile 
      ? "flex-col" 
      : "flex-col sm:flex-row sm:items-center sm:justify-between"
  );

  const [shareUrl, setShareUrl] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, []);

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Get field values from the resolved JSON entry data
  const data = entry.data || {};
  const title = getLocalizedValue(data.title || entry.title || '', locale) || 'Başlıksız';
  const content = data.content || '';
  const author = data.author || 'Administrator';
  
  const publishDate = entry.published_at 
    ? new Date(entry.published_at).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null;

  // Extract media items and other custom metadata fields dynamically
  const mediaFields = [];
  const customMetaFields = [];

  Object.entries(data).forEach(([key, val]) => {
    // Single media field resolved by Laravel resource
    if (val && typeof val === 'object' && val.url) {
      mediaFields.push({ key, ...val });
    }
    // Multiple media files resolved as array
    else if (Array.isArray(val) && val.length > 0 && val[0] && typeof val[0] === 'object' && val[0].url) {
      val.forEach((item, index) => {
        mediaFields.push({ key: `${key}_${index}`, ...item });
      });
    }
    // Simple custom meta key-value fields (excluding common core fields)
    else if (
      key !== 'title' && 
      key !== 'content' && 
      key !== 'slug' && 
      key !== 'author' && 
      key !== 'summary' &&
      key !== 'description' &&
      key !== 'cover_image' &&
      key !== 'category_ids' &&
      key !== 'categories'
    ) {
      if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
        customMetaFields.push({ key, value: String(val) });
      }
    }
  });

  // Identify featured image from media list
  // If entry.data.cover_image has a url, prioritize it!
  let featuredImage = null;
  if (data.cover_image && typeof data.cover_image === 'object' && data.cover_image.url) {
    featuredImage = data.cover_image;
  } else {
    featuredImage = mediaFields.find(m => m.mime_type?.startsWith('image/'));
  }

  // Other attachments (like PDFs, zip files, or secondary images)
  const attachments = mediaFields.filter(m => m !== featuredImage && m.key !== 'cover_image');

  return (
    <article className="space-y-4">
      <header className="space-y-3">
        <h1 className={titleClass}>
          {title}
        </h1>
        <div className="border-b border-border pb-2 text-xs sm:text-sm text-muted-foreground font-medium">
          {publishDate && (
            <time dateTime={entry.published_at}>{publishDate}</time>
          )}
        </div>
      </header>

      {/* Content body with HTML/Rich-Text compatibility or Blocks */}
      <div className="prose prose-zinc dark:prose-invert max-w-none leading-relaxed text-[15px] sm:text-base md:text-lg !mt-2 pt-0 [&_p:first-of-type]:mt-0">
        {content ? (
          Array.isArray(content) ? (
            <PostBlockRenderer blocks={content} locale={locale} previewSize={previewSize} />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          )
        ) : (
          <p className="italic text-muted-foreground">İçerik bulunmamaktadır.</p>
        )}
      </div>

      {/* Social Share Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-6 pb-2 border-t border-border mt-8">
        <span className="text-xs text-muted-foreground font-bold mr-1">Bu yazıyı paylaş:</span>
        
        <a
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full border border-border bg-card hover:bg-muted hover:border-foreground/20 transition-all duration-200"
          title="X (Twitter) ile Paylaş"
        >
          <img src="/media/brand-logos/x.svg" alt="X" className="size-3.5 dark:hidden" />
          <img src="/media/brand-logos/x-dark.svg" alt="X" className="size-3.5 hidden dark:block" />
        </a>

        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full border border-border bg-card hover:bg-muted hover:border-[#1877F2]/20 transition-all duration-200"
          title="Facebook'ta Paylaş"
        >
          <img src="/media/brand-logos/facebook.svg" alt="Facebook" className="size-3.5" />
        </a>

        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full border border-border bg-card hover:bg-muted hover:border-[#0A66C2]/20 transition-all duration-200"
          title="LinkedIn'de Paylaş"
        >
          <img src="/media/brand-logos/linkedin.svg" alt="LinkedIn" className="size-3.5" />
        </a>

        <a
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full border border-border bg-card hover:bg-muted hover:border-[#25D366]/20 transition-all duration-200"
          title="WhatsApp ile Paylaş"
        >
          <img src="/media/brand-logos/whatsapp.svg" alt="WhatsApp" className="size-3.5 dark:invert" />
        </a>

        <button
          onClick={handleCopyLink}
          className="p-2 rounded-full border border-border bg-card text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/20 transition-all duration-200 relative"
          title="Bağlantıyı Kopyala"
        >
          {copied ? <Check className="size-3.5 text-green-600 dark:text-green-400" /> : <LinkIcon className="size-3.5" />}
          {copied && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-green-600 text-white text-[10px] rounded shadow-md font-bold whitespace-nowrap z-30">
              Kopyalandı!
            </span>
          )}
        </button>
      </div>

      {/* Attachments Section */}
      {attachments.length > 0 && (
        <div className="pt-8 border-t border-border mt-12 space-y-4">
          <h3 className="text-lg font-bold">Ekler ve Dosyalar</h3>
          <ul className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-muted/20">
            {attachments.map((file, idx) => (
              <li key={idx} className="flex justify-between items-center p-4">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-2xl">📄</span>
                  <div className="truncate">
                    <p className="font-semibold text-sm truncate">{file.name || file.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.mime_type} • {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <a
                  href={file.url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold rounded-lg transition-colors"
                >
                  İndir
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA Action Banner */}
      <div className="pt-12 border-t border-border mt-16">
        <CtaSection fullWidth={true} variant="primary" previewSize={previewSize} />
      </div>

      {/* Post Suggestions / Related Posts */}
      {suggestedEntries && suggestedEntries.length > 0 && (
        <div className="pt-12 border-t border-border mt-16 space-y-6">
          <h3 className="text-2xl font-bold tracking-tight">Diğer Yazılar</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {suggestedEntries.map(s => (
              <PostCard key={s.id} item={s} locale={locale} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
