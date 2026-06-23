export default function RichText({ data, locale = 'tr' }) {
  const fields = data?.data || {};
  const content = getLocalized(fields.content || fields.body, locale);

  if (!content) return null;

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-6 max-w-3xl">
        <div 
          className="prose prose-zinc dark:prose-invert max-w-none text-zinc-300 leading-relaxed text-lg"
          dangerouslySetInnerHTML={{ __html: content }}
        />
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
