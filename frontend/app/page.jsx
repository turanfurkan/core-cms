import Link from 'next/link';
import { getContentEntries, getSeoMetadata } from '@/lib/api-server';
import { Container } from '@/components/common/container';
import BlockRenderer from '@/components/blocks/block-renderer';

// Generate dynamic SEO metadata for the homepage
export async function generateMetadata() {
  const seo = await getSeoMetadata('/');
  if (seo) {
    return seo;
  }

  return {
    title: 'Ana Sayfa - Core CMS',
    description: 'Core CMS ile güçlendirilmiş kurumsal web sitesi.',
  };
}

export default async function Page() {
  // Fetch entries for the 'homepage' content type
  const resData = await getContentEntries('homepage', {
    page: 1,
    limit: 1,
  });

  const entry = resData?.data?.[0] || null;
  const entryData = entry?.data || {};

  // Find if there are dynamic blocks
  const blocks = entryData.dynamic_blocks || [];

  return (
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        {/* Header */}
        <header className="border-b border-border py-4 bg-muted/30">
          <Container className="flex justify-between items-center">
            <Link href="/" className="font-bold text-xl tracking-tight text-primary">
              Core CMS
            </Link>
            <nav className="flex gap-4 text-sm font-medium">
              <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
              <Link href="/services" className="hover:text-primary transition-colors">Hizmetler</Link>
              <Link href="/about-us" className="hover:text-primary transition-colors">Hakkımızda</Link>
              <Link href="/contact" className="hover:text-primary transition-colors">İletişim</Link>
            </nav>
          </Container>
        </header>

        {/* Dynamic Blocks or Fallback */}
        <main>
          {blocks.length > 0 ? (
            <BlockRenderer blocks={blocks} locale="tr" />
          ) : (
            <div className="py-20">
              <Container className="text-center space-y-6 max-w-2xl">
                <h1 className="text-5xl font-extrabold tracking-tight">Core CMS'e Hoş Geldiniz</h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Ana sayfanız için henüz dinamik bloklar tanımlanmamış. CMS panelinden bölümler ekleyerek sayfanızı hemen tasarlamaya başlayabilirsiniz.
                </p>
                <div className="pt-4">
                  <a
                    href="http://localhost:3000/content-management/content-entries?type=homepage"
                    className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/95 transition-colors"
                  >
                    Bölüm Ekle & Düzenle
                  </a>
                </div>
              </Container>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-muted/10">
        <Container className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <div>
            © {new Date().getFullYear()} Core CMS. Tüm Hakları Saklıdır.
          </div>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:underline">Gizlilik Sözleşmesi</Link>
            <Link href="/terms-of-use" className="hover:underline">Kullanım Koşulları</Link>
          </div>
        </Container>
      </footer>
    </div>
  );
}
