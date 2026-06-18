'use client';

import { MegaMenuFooter, MegaMenuSubDefault } from './components';
import { useTranslation } from '@/hooks/useTranslation';

const translateTitle = (title, t) => {
  if (!title) return '';
  const key = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return t ? t(`sidebar.${key}`, title) : title;
};

const MegaMenuSubProfiles = ({ items }) => {
  const { t } = useTranslation();
  const publicProfilesItem = items[1];

  return (
    <div className="w-full gap-0 lg:w-[875px]">
      <div className="pt-4 pb-2 lg:p-7.5">
        <div className="grid lg:grid-cols-2 gap-5 lg:gap-10">
          {publicProfilesItem.children?.map((item, index) => {
            return (
              <div key={`profile-${index}`} className="flex flex-col">
                <h3 className="text-sm text-foreground font-semibold leading-none ps-2.5 mb-2 lg:mb-4">
                  {translateTitle(item.title, t)}
                </h3>
                <div className="grid lg:grid-cols-2 lg:gap-5">
                  {item.children?.map((subItem, subIndex) => {
                    return (
                      <div key={`profile-sub-${subIndex}`} className="space-y-0.5">
                        {subItem.children && MegaMenuSubDefault(subItem.children, t)}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <MegaMenuFooter />
    </div>
  );
};

export { MegaMenuSubProfiles };
