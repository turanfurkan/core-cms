import Link from 'next/link';

export default function HeroBanner({ data, locale = 'tr' }) {
  const fields = data?.data || {};
  
  // Extract fields
  const heading = getLocalized(fields.heading, locale);
  const subtitle = getLocalized(fields.subtitle, locale);
  const ctaText = getLocalized(fields.cta_text || fields.button_text, locale);
  const ctaUrl = fields.cta_link || fields.button_url || '#';
  const bgImage = fields.background_image?.url || fields.background?.url || null;

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center py-20 overflow-hidden bg-zinc-950">
      {/* Background Image with Gradient Overlay */}
      {bgImage ? (
        <div className="absolute inset-0 z-0">
          <img
            src={bgImage}
            alt={heading}
            className="w-full h-full object-cover opacity-40 scale-105 animate-pulse-slow"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-900/50" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/40 via-zinc-950 to-zinc-950" />
      )}

      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float-delayed" />

      {/* Content */}
      <div className="container relative z-10 mx-auto px-6 text-center space-y-8 max-w-4xl">
        {heading && (
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md animate-fade-in">
            {heading}
          </h1>
        )}
        {subtitle && (
          <p className="text-lg sm:text-xl text-zinc-300 max-w-2xl mx-auto leading-relaxed drop-shadow-xs">
            {subtitle}
          </p>
        )}
        
        {ctaText && (
          <div className="pt-4 animate-fade-in-delayed">
            <Link
              href={ctaUrl}
              className="inline-flex items-center justify-center px-8 py-4 bg-primary text-white text-base font-semibold rounded-xl hover:bg-primary/90 hover:scale-105 shadow-lg shadow-primary/25 transition-all duration-300 gap-2 group"
            >
              {ctaText}
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// Localized helper
function getLocalized(val, locale) {
  if (val && typeof val === 'object') {
    return val[locale] || val['tr'] || val['en'] || Object.values(val)[0] || '';
  }
  return val || '';
}
