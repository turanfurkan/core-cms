import { Fragment } from 'react';
import { StatsCard } from '@/components/ui/stats-card';

const ChannelStats = () => {
  const items = [
    { logo: 'linkedin-2.svg', info: '9.3k', desc: 'Amazing mates', path: '' },
    { logo: 'youtube-2.svg', info: '24k', desc: 'Lessons Views', path: '' },
    {
      logo: 'instagram-03.svg',
      info: '608',
      desc: 'New subscribers',
      path: '',
    },
    {
      logo: 'tiktok.svg',
      logoDark: 'tiktok-dark.svg',
      info: '2.5k',
      desc: 'Stream audience',
      path: '',
    },
  ];

  return (
    <Fragment>
      {items.map((item, index) => (
        <StatsCard
          key={index}
          icon={item.logo}
          iconDark={item.logoDark}
          value={item.info}
          label={item.desc}
        />
      ))}
    </Fragment>
  );
};

export { ChannelStats };

