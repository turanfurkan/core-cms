'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { RightDrawer } from '@/components/common/right-drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ContentEntryForm from './content-entry-form';

export default function ContentEntryDialog({ open, closeDialog, contentType, entry }) {
  const { t } = useTranslation();
  const isEdit = !!entry;
  const titleText = `${isEdit ? t('content_entries.dialog.edit_title', 'İçerik Düzenle') : t('content_entries.dialog.add_title', 'Yeni İçerik Girişi')} (${contentType?.name})`;

  // For Collection Types (Multiple entry lists like Yarışlar, Blog, Kategoriler)
  if (contentType?.is_collection) {
    return (
      <Dialog open={open} onOpenChange={closeDialog}>
        <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="shrink-0 pb-4 border-b border-border">
            <DialogTitle>{titleText}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-1">
            <ContentEntryForm
              contentType={contentType}
              entry={entry}
              onSuccess={closeDialog}
              onCancel={closeDialog}
              isInline={false}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // For Single Types (Single pages like Ana Sayfa, Hakkımızda)
  return (
    <RightDrawer
      open={open}
      onOpenChange={closeDialog}
      title={titleText}
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
