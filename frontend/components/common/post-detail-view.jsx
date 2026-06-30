'use client';

import * as React from 'react';
import PostBlockRenderer from '@/components/blocks/post-block-renderer';
import { PostCard } from '@/components/ui/post-card';
import { CtaSection } from '@/components/common/cta-section';
import { Facebook, Linkedin, Link as LinkIcon, Check } from 'lucide-react';
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

const XIcon = (props) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...props}>
    <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

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
      ? "text-xl" 
      : isTablet 
      ? "text-3xl" 
      : "text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl"
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
    <article className="space-y-6">
      <header className="space-y-4">
        <h1 className={titleClass}>
          {title}
        </h1>
        <div className={headerRowClass}>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-muted-foreground font-medium">
            {publishDate && (
              <time dateTime={entry.published_at}>{publishDate}</time>
            )}
            <span>•</span>
            <span>Yazar: {author}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-bold mr-1">Paylaş:</span>
            
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted hover:border-foreground/20 transition-all duration-200"
              title="X (Twitter) ile Paylaş"
            >
              <XIcon className="size-3.5" />
            </a>

            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full border border-border bg-card text-muted-foreground hover:text-[#1877F2] hover:bg-[#1877F2]/5 hover:border-[#1877F2]/20 transition-all duration-200"
              title="Facebook'ta Paylaş"
            >
              <Facebook className="size-3.5" />
            </a>

            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full border border-border bg-card text-muted-foreground hover:text-[#0A66C2] hover:bg-[#0A66C2]/5 hover:border-[#0A66C2]/20 transition-all duration-200"
              title="LinkedIn'de Paylaş"
            >
              <Linkedin className="size-3.5" />
            </a>

            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full border border-border bg-card text-muted-foreground hover:text-[#25D366] hover:bg-[#25D366]/5 hover:border-[#25D366]/20 transition-all duration-200"
              title="WhatsApp ile Paylaş"
            >
              <svg viewBox="0 0 24 24" width="1em" height="1em" className="size-3.5" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.858.002-2.635-1.023-5.11-2.885-6.974C16.57 1.91 14.097.886 11.46.886c-5.438 0-9.863 4.42-9.867 9.859-.001 2.01.536 3.97 1.556 5.724L2.128 21.8l5.519-1.446z"/>
                <path d="M17.387 14.18c-.3-.15-1.775-.875-2.05-.975-.275-.1-.475-.15-.675.15-.2.3-.775.975-.95 1.175-.175.2-.35.225-.65.075-.3-.15-1.267-.467-2.413-1.49-1.042-.93-1.745-2.08-1.95-2.43-.205-.35-.022-.54.128-.69.135-.135.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.675-1.625-.925-2.225-.244-.589-.48-.51-.66-.52-.18-.01-.38-.01-.58-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5 0 1.475 1.075 2.9 1.225 3.1.15.2 2.11 3.225 5.11 4.525.714.31 1.272.495 1.707.633.718.228 1.37.196 1.885.119.575-.085 1.775-.725 2.025-1.425.25-.7.25-1.3 0-1.425-.075-.15-.275-.25-.575-.4z" />
              </svg>
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
        </div>
      </header>

      {/* Render custom metadata fields if any exist */}
      {customMetaFields.length > 0 && (
        <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-xl text-sm border border-border">
          {customMetaFields.map(field => (
            <div key={field.key} className="space-y-1">
              <span className="text-muted-foreground capitalize font-medium">{field.key.replace(/_/g, ' ')}:</span>
              <p className="font-semibold">{field.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Featured Image */}
      {featuredImage && (
        <div className="relative w-full h-[240px] sm:h-[320px] md:h-[400px] lg:h-[450px] rounded-2xl overflow-hidden bg-muted border border-border">
          <img
            src={featuredImage.url}
            alt={title}
            className="object-cover w-full h-full"
          />
        </div>
      )}

      {/* Content body with HTML/Rich-Text compatibility or Blocks */}
      <div className="prose prose-zinc dark:prose-invert max-w-none leading-relaxed text-base md:text-lg pt-4">
        {content ? (
          Array.isArray(content) ? (
            <PostBlockRenderer blocks={content} locale={locale} />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: content }} />
          )
        ) : (
          <p className="italic text-muted-foreground">İçerik bulunmamaktadır.</p>
        )}
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
        <CtaSection fullWidth={previewSize === 'desktop'} variant="primary" />
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
