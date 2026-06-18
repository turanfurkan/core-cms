'use client';

import { MegaMenuSubDefault, MegaMenuSubHighlighted } from './components';
import { useTranslation } from '@/hooks/useTranslation';

const translateTitle = (title, t) => {
  if (!title) return '';
  const key = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return t ? t(`sidebar.${key}`, title) : title;
};

const MegaMenuSubAccount = ({ items }) => {
  const { t } = useTranslation();
  const myAccountItem = items[2];
  const myAccountItemGeneral = myAccountItem.children
    ? myAccountItem.children[0]
    : {};
  const myAccountItemOthers = myAccountItem.children
    ? myAccountItem.children[1]
    : {};

  return (
    <div className="flex flex-col lg:flex-row gap-0 w-full lg:w-[1200px] overflow-hidden">
      <div className="lg:w-[225px] mt-2 lg:mt-0 lg:border-e lg:border-border shrink-0 px-3 py-4 lg:p-7.5 bg-accent/30">
        <h3 className="text-sm text-foreground font-semibold leading-none ps-2.5 mb-2 lg:mb-5">
          {translateTitle(myAccountItemGeneral.title, t)}
        </h3>
        <div className="flex flex-col">
          {myAccountItemGeneral.children &&
            MegaMenuSubHighlighted(myAccountItemGeneral.children, t)}
        </div>
      </div>
      <div className="pt-4 pb-2 lg:p-7.5 lg:pb-5 grow">
        <div className="grid lg:grid-cols-5 gap-4">
          {myAccountItemOthers.children?.map((item, index) => {
            return (
              <div key={`account-${index}`}>
                <h3 className="text-sm text-foreground font-semibold leading-none ps-2.5 mb-2 lg:mb-5">
                  {translateTitle(item.title, t)}
                </h3>
                <div className="space-y-0.5">
                  {item.children && MegaMenuSubDefault(item.children, t)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export { MegaMenuSubAccount };
