import { notFound } from 'next/navigation';
import { backendFetch, getSeoMetadata } from '@/lib/api-server';
import { Container } from '@/components/common/container';

// Generate dynamic metadata via the backend SEO resolver
export async function generateMetadata({ params }) {
  const { contentTypeSlug, entrySlug } = await params;
  const path = `/${contentTypeSlug}/${entrySlug}`;
  
  const seo = await getSeoMetadata(path);
  if (seo) {
    return seo;
  }

  // Fallback to title from URL
  const prettyTitle = entrySlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: prettyTitle,
  };
}

export default async function Page({ params }) {
  const { contentTypeSlug, entrySlug } = await params;

  let entry;
  try {
    const res = await backendFetch(`/api/content/delivery/${contentTypeSlug}/${entrySlug}`);
    if (!res.ok) {
      notFound();
    }
    const json = await res.json();
    entry = json.data;
  } catch (error) {
    console.error('Error fetching dynamic content entry:', error);
    notFound();
  }

  if (!entry) {
    notFound();
  }

  // Get field values from the resolved JSON entry data
  const data = entry.data || {};
  const title = data.title || entry.title || 'Untitled';
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
      key !== 'description'
    ) {
      if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
        customMetaFields.push({ key, value: String(val) });
      }
    }
  });

  // Identify featured image from media list
  const featuredImage = mediaFields.find(m => m.mime_type?.startsWith('image/'));
  // Other attachments (like PDFs, zip files, or secondary images)
  const attachments = mediaFields.filter(m => m !== featuredImage);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        {/* Simple Header */}
        <header className="border-b border-border py-4 bg-muted/30">
          <Container className="flex justify-between items-center">
            <a href="/" className="font-bold text-xl tracking-tight text-primary">
              Core CMS
            </a>
            <nav className="flex gap-4 text-sm">
              <a href={`/${contentTypeSlug}`} className="hover:text-primary transition-colors">
                ← {contentTypeSlug.charAt(0).toUpperCase() + contentTypeSlug.slice(1)} Listesi
              </a>
            </nav>
          </Container>
        </header>

        {/* Main Content Area */}
        <main className="py-12">
          <Container className="max-w-3xl">
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

              {/* Content body with HTML/Rich-Text compatibility */}
              <div className="prose prose-zinc dark:prose-invert max-w-none leading-relaxed text-lg pt-4">
                {content ? (
                  <div dangerouslySetInnerHTML={{ __html: content }} />
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
          </Container>
        </main>
      </div>

      <footer className="border-t border-border py-6 bg-muted/10">
        <Container className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Core CMS. Tüm Hakları Saklıdır.
        </Container>
      </footer>
    </div>
  );
}
