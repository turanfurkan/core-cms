'use client';

import { useState } from 'react';
import { Trash, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import UserDeleteDialog from './user-delete-dialog';
import UserRestoreDialog from './user-restore-dialog';
import { useTranslation } from '@/hooks/useTranslation';

const UserDangerZone = ({ user, isLoading }) => {
  const { t } = useTranslation();
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setRestoreDialogOpen] = useState(false);

  // Render skeleton when loading
  const Loading = () => (
    <div className="space-y-3">
      <Skeleton className="h-8 w-36" />
      <Card>
        <CardContent>
          <Skeleton className="h-7 w-40 mb-3" />
          <Skeleton className="h-6 w-full max-w-[560px] mb-4" />
          <Skeleton className="h-9 w-24" />
        </CardContent>
      </Card>
    </div>
  );

  // Content for the "Delete user" Danger Zone
  const DeleteContent = () => (
    <div className="space-y-3">
      <h2 className="font-semibold text-destructive">{t('users.details.danger_zone.title', 'Danger Zone')}</h2>
      <Card>
        <CardContent>
          <h3 className="font-semibold mb-3">{t('users.details.danger_zone.delete_title', 'Delete user account')}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t('users.details.danger_zone.delete_desc', 'This action will permanently delete the user and all related data. It cannot be undone.')}
          </p>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={user.role?.isProtected}
          >
            <Trash />
            {t('users.details.danger_zone.delete_button', 'Delete user')}
          </Button>
        </CardContent>
      </Card>
      <UserDeleteDialog
        open={isDeleteDialogOpen}
        closeDialog={() => setDeleteDialogOpen(false)}
        user={user}
      />
    </div>
  );

  // Content for restoring a trashed user—modeled after the delete dialog.
  const RestoreContent = () => (
    <div className="space-y-3">
      <h2 className="font-semibold text-destructive">{t('users.details.danger_zone.restore_title', 'Restore Account')}</h2>
      <Card>
        <CardContent>
          <h3 className="font-semibold mb-3">{t('users.details.danger_zone.restore_section_title', 'Restore user account')}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t('users.details.danger_zone.restore_desc', 'This account is currently trashed. Restoring the account will reactivate the user and all related data.')}
          </p>
          <Button variant="outline" onClick={() => setRestoreDialogOpen(true)}>
            <RotateCcw />
            {t('users.details.danger_zone.restore_button', 'Restore user')}
          </Button>
        </CardContent>
      </Card>
      <UserRestoreDialog
        open={isRestoreDialogOpen}
        closeDialog={() => setRestoreDialogOpen(false)}
        user={user}
      />
    </div>
  );

  // Render loading if still fetching or if user is null.
  return isLoading || !user ? (
    <Loading />
  ) : user.isTrashed ? (
    <RestoreContent />
  ) : (
    <DeleteContent />
  );
};

export default UserDangerZone;
