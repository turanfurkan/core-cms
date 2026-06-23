'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { RightDrawer } from '@/components/common/right-drawer';
import ContentEntryForm from './content-entry-form';

export default function ContentEntryDialog({ open, closeDialog, contentType, entry }) {
  const { t } = useTranslation();
  const isEdit = !!entry;

  return (
    <RightDrawer
      open={open}
      onOpenChange={closeDialog}
      title={`${isEdit ? t('content_entries.dialog.edit_title', 'İçerik Düzenle') : t('content_entries.dialog.add_title', 'Yeni İçerik Girişi')} (${contentType?.name})`}
      size="3xl"
      footer={null}
    >
      <ContentEntryForm
        contentType={contentType}
        entry={entry}
        onSuccess={closeDialog}
        onCancel={closeDialog}
        isInline={false}
      />
    </RightDrawer>
  );
}
