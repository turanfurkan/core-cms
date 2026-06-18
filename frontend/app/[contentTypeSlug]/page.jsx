import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getContentEntries, getSeoMetadata } from '@/lib/api-server';
import { Container } from '@/components/common/container';

// Generate dynamic metadata for the listing page using SEO override endpoint
export async function generateMetadata({ params }) {
  const { contentTypeSlug } = await params;
  const path = `/${contentTypeSlug}`;
  
  const seo = await getSeoMetadata(path);
  if (seo) {
    return seo;
  }

  // Fallback title
  const prettyTitle = contentTypeSlug.charAt(0).toUpperCase() + contentTypeSlug.slice(1) + 's';
  return {
    title: prettyTitle,
  };
}

export default async function Page({ params, searchParams }) {
  const { contentTypeSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || '1', 10);

  const resData = await getContentEntries(contentTypeSlug, {
    page,
    limit: 12,
  });

  if (!resData) {
    notFound();
  }

  // Laravel paginator response maps collection entries into `data`
  const entries = resData.data || [];
  const meta = resData.meta || {}; // Pagination metadata
  
  const hasPages = meta.last_page > 1;
  const currentPage = meta.current_page || page;
  const totalPages = meta.last_page || 1;

  const prettyTitle = contentTypeSlug.charAt(0).toUpperCase() + contentTypeSlug.slice(1);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        {/* Simple Header */}
        <header className="border-b border-border py-4 bg-muted/30">
          <Container className="flex justify-between items-center">
            <Link href="/" className="font-bold text-xl tracking-tight text-primary">
              Core CMS
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="hover:text-primary transition-colors">Dashboard</Link>
            </nav>
          </Container>
        </header>

        {/* Content Section */}
        <main className="py-12">
          <Container>
            <div className="space-y-8">
              <div className="border-b border-border pb-5">
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                  {prettyTitle} Listesi
                </h1>
                <p className="text-muted-foreground mt-2">
                  En son yayınlanan {prettyTitle.toLowerCase()} içerikleri.
                </p>
              </div>

              {entries.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-border rounded-xl">
                  <p className="text-muted-foreground text-lg">Yayınlanmış içerik bulunamadı.</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {entries.map((entry) => {
                    const data = entry.data || {};
                    const title = data.title || entry.title || 'Untitled';
                    const summary = data.summary || data.description || '';
                    const slug = data.slug || entry.slug;
                    const date = entry.published_at 
                      ? new Date(entry.published_at).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : null;

                    // Locate featured image or media attachment
                    const imageField = Object.values(data).find(
                      (val) => val && typeof val === 'object' && val.url
                    );
                    const imageUrl = imageField ? imageField.url : null;

                    return (
                      <article key={entry.id} className="group border border-border bg-card rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
                        <div>
                          {imageUrl && (
                            <div className="aspect-video w-full overflow-hidden bg-muted relative">
                              <img
                                src={imageUrl}
                                alt={title}
                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div className="p-5 space-y-3">
                            {date && (
                              <time className="text-xs text-muted-foreground">{date}</time>
                            )}
                            <h2 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                              <Link href={`/${contentTypeSlug}/${slug}`}>
                                {title}
                              </Link>
                            </h2>
                            {summary && (
                              <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                                {summary}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="p-5 pt-0">
                          <Link
                            href={`/${contentTypeSlug}/${slug}`}
                            className="inline-flex items-center text-sm font-semibold text-primary hover:underline gap-1"
                          >
                            Devamını Oku →
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* Pagination controls */}
              {hasPages && (
                <div className="flex justify-center items-center gap-4 pt-8 border-t border-border">
                  <Link
                    href={`/${contentTypeSlug}?page=${currentPage - 1}`}
                    className={`px-4 py-2 border border-border rounded-lg text-sm transition-colors ${
                      currentPage <= 1 ? 'pointer-events-none opacity-50 bg-muted' : 'hover:bg-muted'
                    }`}
                  >
                    ← Önceki
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    Sayfa {currentPage} / {totalPages}
                  </span>
                  <Link
                    href={`/${contentTypeSlug}?page=${currentPage + 1}`}
                    className={`px-4 py-2 border border-border rounded-lg text-sm transition-colors ${
                      currentPage >= totalPages ? 'pointer-events-none opacity-50 bg-muted' : 'hover:bg-muted'
                    }`}
                  >
                    Sonraki →
                  </Link>
                </div>
              )}
            </div>
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
