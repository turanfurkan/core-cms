'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function FaqAccordion({ data, locale = 'tr' }) {
  const fields = data?.data || {};
  const sectionTitle = getLocalized(fields.section_title, locale);
  const sectionSubtitle = getLocalized(fields.section_subtitle, locale);

  const faqItems = [
    { q: getLocalized(fields.faq_1_question, locale), a: getLocalized(fields.faq_1_answer, locale) },
    { q: getLocalized(fields.faq_2_question, locale), a: getLocalized(fields.faq_2_answer, locale) },
    { q: getLocalized(fields.faq_3_question, locale), a: getLocalized(fields.faq_3_answer, locale) },
    { q: getLocalized(fields.faq_4_question, locale), a: getLocalized(fields.faq_4_answer, locale) },
    { q: getLocalized(fields.faq_5_question, locale), a: getLocalized(fields.faq_5_answer, locale) },
  ].filter(item => item.q);

  if (faqItems.length === 0 && !sectionTitle) return null;

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-6 max-w-3xl">
        {(sectionTitle || sectionSubtitle) && (
          <div className="text-center mb-10 space-y-3">
            {sectionTitle && (
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {sectionTitle}
              </h2>
            )}
            {sectionSubtitle && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
                {sectionSubtitle}
              </p>
            )}
          </div>
        )}

        {faqItems.length > 0 && (
          <Accordion type="single" collapsible variant="outline" className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`faq-item-${index}`} className="bg-card hover:bg-muted/10 transition-colors">
                <AccordionTrigger className="text-sm sm:text-base font-semibold px-5 text-left">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 px-5 pb-5 leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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
