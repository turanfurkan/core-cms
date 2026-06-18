'use client';

import { MegaMenuFooter, MegaMenuSubDefault } from './components';
import { useTranslation } from '@/hooks/useTranslation';

const translateTitle = (title, t) => {
  if (!title) return '';
  const key = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return t ? t(`sidebar.${key}`, title) : title;
};

const MegaMenuSubApps = ({ items }) => {
  const { t } = useTranslation();
  const appsItem = items[4];

  return (
    <div className="w-full gap-0 lg:w-[775px]">
      <div className="pt-4 pb-2 lg:p-7.5">
        <div className="flex lg:gap-10">
          {appsItem.children?.map((item, index) => {
            return (
              <div key={`profile-${index}`} className="flex flex-col grow">
                <h3 className="text-sm text-foreground font-semibold leading-none ps-2.5 mb-2 lg:mb-4">
                  {translateTitle(item.title, t)}
                </h3>
                <div className="grid lg:grid-cols-2 lg:gap-5 grow">
                  {item.children?.map((subItem, subIndex) => {
                    return (
                      <div
                        key={`apps-sub-${subIndex}`}
                        className="grow space-y-0.5"
                      >
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

export { MegaMenuSubApps };
