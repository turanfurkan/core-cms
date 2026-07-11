'use client';

import DefaultCard from './childs/default-card';
import RaceCard from './childs/race-card';

const CARD_COMPONENTS = {
  default: DefaultCard,
  race_card: RaceCard,
};

export default function FeaturesGrid({ data, locale = 'tr' }) {
  const fields = data?.data || data?.content || {};
  const styles = data?.styles || {};
  const sectionTitle = getLocalized(fields.section_title, locale);
  const sectionSubtitle = getLocalized(fields.section_subtitle, locale);

  const sourceType = fields.source_type || 'manual';

  let features = [];
  if (sourceType === 'dynamic') {
    const items = data?.hydrated_data || [];
    features = items.map(item => {
      const entryData = item.data || {};
      return {
        title: getLocalized(entryData.title || entryData.name || item.title || 'Untitled', locale),
        desc: getLocalized(entryData.summary || entryData.description || '', locale),
        iconName: entryData.icon || 'Sparkles',
        item: item // preserve original item
      };
    });
  } else {
    features = [
      {
        title: getLocalized(fields.feature_1_title, locale),
        desc: getLocalized(fields.feature_1_desc, locale),
        iconName: fields.feature_1_icon || 'Sparkles',
      },
      {
        title: getLocalized(fields.feature_2_title, locale),
        desc: getLocalized(fields.feature_2_desc, locale),
        iconName: fields.feature_2_icon || 'Sparkles',
      },
      {
        title: getLocalized(fields.feature_3_title, locale),
        desc: getLocalized(fields.feature_3_desc, locale),
        iconName: fields.feature_3_icon || 'Sparkles',
      },
      {
        title: getLocalized(fields.feature_4_title, locale),
        desc: getLocalized(fields.feature_4_desc, locale),
        iconName: fields.feature_4_icon || 'Sparkles',
      },
    ].filter(f => f.title);
  }

  if (features.length === 0 && !sectionTitle) return null;

  const cardStyle = styles.card_style || 'default';
  const CardComponent = CARD_COMPONENTS[cardStyle] || DefaultCard;

  const selectedColumns = parseInt(styles.columns || '4', 10);
  const activeColumnsCount = Math.min(selectedColumns, features.length || 1);
  const columns = String(activeColumnsCount);
  const gap = styles.gap || '24';

  // Grid columns class mapper
  const colClass = {
    '1': 'grid-cols-1',
    '2': 'grid-cols-1 sm:grid-cols-2',
    '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    '4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-6 max-w-6xl">
        {(sectionTitle || sectionSubtitle) && (
          <div className="text-center mb-12 space-y-3">
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

        <div className={`grid ${colClass}`} style={{ gap: `${gap}px` }}>
          {features.map((item, index) => (
            <CardComponent key={index} item={item} index={index} />
          ))}
        </div>
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
