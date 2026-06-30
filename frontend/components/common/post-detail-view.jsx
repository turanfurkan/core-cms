'use client';

import * as React from 'react';
import PostBlockRenderer from '@/components/blocks/post-block-renderer';

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

export default function PostDetailView({ entry, locale = 'tr' }) {
  if (!entry) return null;

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
      <header className="space-y-3">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          {title}
        </h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground border-b border-border pb-4">
          {publishDate && (
            <time dateTime={entry.published_at}>{publishDate}</time>
          )}
          <span>•</span>
          <span>Yazar: {author}</span>
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
        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-muted border border-border relative">
          <img
            src={featuredImage.url}
            alt={title}
            className="object-cover w-full h-full"
          />
        </div>
      )}

      {/* Content body with HTML/Rich-Text compatibility or Blocks */}
      <div className="prose prose-zinc dark:prose-invert max-w-none leading-relaxed text-lg pt-4">
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
    </article>
  );
}
