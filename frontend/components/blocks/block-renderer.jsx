import HeroBanner from './hero-banner';
import SliderCarousel from './slider-carousel';
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
import VideoHero from './video-hero';
import GlassmorphicGrid from './glassmorphic-grid';
import CategoriesGrid from './categories-grid';
import NewsTicker from './news-ticker';
import SponsorsBlock from './sponsors-block';
import CtaSection from './cta-section';

const BLOCK_COMPONENTS = {
  hero_banner: HeroBanner,
  slider: SliderCarousel,
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
  video_hero: VideoHero,
  glassmorphic_grid: GlassmorphicGrid,
  categories_grid: CategoriesGrid,
  news_ticker: NewsTicker,
  sponsors_block: SponsorsBlock,
  cta_section: CtaSection,
};

export default function BlockRenderer({ blocks, locale = 'tr', previewDevice = 'desktop' }) {
  if (!blocks || !Array.isArray(blocks)) return null;

  return (
    <>
      {blocks.map((block, index) => {
        const Component = BLOCK_COMPONENTS[block.type];
        if (!Component) {
          console.warn(`Unknown block type: ${block.type}`);
          return (
            <div key={block.id || index} className="w-full py-16 bg-zinc-50 dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 text-center rounded-2xl my-4 text-xs font-semibold text-muted-foreground flex flex-col items-center justify-center gap-2 select-none">
              <span>{block.type} bileşeni henüz hazır değil.</span>
            </div>
          );
        }
        // Duplicate fields to 'data' and 'content' for maximum cross-compatibility with legacy/new blocks
        const normalizedBlock = {
          ...block,
          data: block.data || block.content || {},
          content: block.content || block.data || {},
        };
        return <Component key={block.id || index} data={normalizedBlock} locale={locale} previewDevice={previewDevice} />;
      })}
    </>
  );
}
