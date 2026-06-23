import HeroBanner from './hero-banner';
import RichText from './rich-text';
import CollectionDisplay from './collection-display';
import EntryCallout from './entry-callout';
import StatisticsBlock from './statistics-block';
import FaqAccordion from './faq-accordion';
import FeaturesGrid from './features-grid';
import IntegrationsLogos from './integrations-logos';
import TestimonialCard from './testimonial-card';
import TimelineMilestones from './timeline-milestones';
import EventBanner from './event-banner';
import TeamGrid from './team-grid';
import CampaignBanner from './campaign-banner';

const BLOCK_COMPONENTS = {
  hero_banner: HeroBanner,
  rich_text: RichText,
  collection_display: CollectionDisplay,
  entry_callout: EntryCallout,
  statistics_block: StatisticsBlock,
  faq_accordion: FaqAccordion,
  features_grid: FeaturesGrid,
  integrations_logos: IntegrationsLogos,
  testimonial_card: TestimonialCard,
  timeline_milestones: TimelineMilestones,
  event_banner: EventBanner,
  team_grid: TeamGrid,
  campaign_banner: CampaignBanner,
};

export default function BlockRenderer({ blocks, locale = 'tr' }) {
  if (!blocks || !Array.isArray(blocks)) return null;

  return (
    <>
      {blocks.map((block, index) => {
        const Component = BLOCK_COMPONENTS[block.type];
        if (!Component) {
          console.warn(`Unknown block type: ${block.type}`);
          return null;
        }
        return <Component key={block.id || index} data={block} locale={locale} />;
      })}
    </>
  );
}
