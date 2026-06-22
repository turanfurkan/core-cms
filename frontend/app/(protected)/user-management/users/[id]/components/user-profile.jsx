'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { formatDateTime } from '@/lib/helpers';
import { Badge, BadgeDot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserStatusProps } from '../../constants/status';
import UserProfileEditDialog from './user-profile-edit-dialog';
import { useTranslation } from '@/hooks/useTranslation';

const UserProfile = ({ user, isLoading }) => {
  const { t } = useTranslation();
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);

  const Loading = () => (
    <Card>
      <CardContent>
        <dl className="grid grid-cols-[auto_1fr] text-muted-foreground gap-3 text-sm mb-5">
          <div className="grid grid-cols-subgrid col-span-2 items-baseline">
            <dt className="flex md:w-64">
              <Skeleton className="h-6 w-24" />
            </dt>
            <dd>
              <Skeleton className="h-5 w-36" />
            </dd>
          </div>
          <div className="grid grid-cols-subgrid col-span-2 items-baseline">
            <dt>
              <Skeleton className="h-5 w-36" />
            </dt>
            <dd>
              <Skeleton className="h-5 w-48" />
            </dd>
          </div>
          <div className="grid grid-cols-subgrid col-span-2 items-baseline">
            <dt>
              <Skeleton className="h-5 w-20" />
            </dt>
            <dd>
              <Skeleton className="h-5 w-24" />
            </dd>
          </div>
          <div className="grid grid-cols-subgrid col-span-2 items-baseline">
            <dt>
              <Skeleton className="h-5 w-24" />
            </dt>
            <dd>
              <Skeleton className="h-5 w-20" />
            </dd>
          </div>
          <div className="grid grid-cols-subgrid col-span-2 items-baseline">
            <dt>
              <Skeleton className="h-5 w-36" />
            </dt>
            <dd>
              <Skeleton className="h-5 w-24" />
            </dd>
          </div>
          <div className="grid grid-cols-subgrid col-span-2 items-baseline">
            <dt>
              <Skeleton className="h-5 w-24" />
            </dt>
            <dd>
              <Skeleton className="h-5 w-36" />
            </dd>
          </div>
        </dl>
        <Skeleton className="h-9 w-32" />
      </CardContent>
    </Card>
  );

  const Content = () => {
    const statusPros = getUserStatusProps(user.status);
    const statusVariant = statusPros.variant;

    return (
      <Card>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-3 text-sm mb-5 [&_dt]:text-muted-foreground">
            <div className="grid grid-cols-subgrid col-span-2 items-baseline">
              <dt className="flex md:w-64">{t('users.details.full_name', 'Full name:')}</dt>
              <dd>{user.name || t('users.details.not_available', 'Not available')}</dd>
            </div>
            <div className="grid grid-cols-subgrid col-span-2 items-baseline">
              <dt>{t('users.details.email_address', 'Email address:')}</dt>
              <dd className="flex items-center gap-2.5">
                <span>{user.email}</span>
                {user.emailVerifiedAt ? (
                  <Badge variant="secondary" appearance="light">
                    {t('users.details.verified', 'Verified')}
                  </Badge>
                ) : (
                  <Badge variant="warning" appearance="light">
                    {t('users.details.not_verified', 'Not verified')}
                  </Badge>
                )}
              </dd>
            </div>
            <div className="grid grid-cols-subgrid col-span-2 items-baseline">
              <dt>{t('users.details.role', 'Role:')}</dt>
              <dd>
                <span className="inline-flex items-center gap-1">
                  {user.role?.name}
                  {user.role?.isProtected && (
                    <Badge variant="outline">{t('users.details.system_badge', 'System')}</Badge>
                  )}
                </span>
              </dd>
            </div>
            <div className="grid grid-cols-subgrid col-span-2 items-baseline">
              <dt>{t('users.details.status', 'Status:')}</dt>
              <dd>
                <div className="inline-flex gap-2.5">
                  <Badge variant={statusVariant} appearance="ghost">
                    <BadgeDot />
                    {t('users.status.' + statusPros.label.toLowerCase(), statusPros.label)}
                  </Badge>
                  {user.isTrashed && (
                    <Badge variant="destructive" appearance="light">
                      {t('users.status.trashed', 'Trashed')}
                    </Badge>
                  )}
                </div>
              </dd>
            </div>
            <div className="grid grid-cols-subgrid col-span-2 items-baseline">
              <dt>{t('users.details.last_sign_in', 'Last Sign In:')}</dt>
              <dd>
                {user.lastSignInAt
                  ? formatDateTime(new Date(user.lastSignInAt))
                  : t('users.details.never_signed_in', 'Never')}
              </dd>
            </div>
          </dl>
          <Button
            variant="outline"
            disabled={user.role?.isProtected}
            onClick={() => setEditDialogOpen(true)}
          >
            <Pencil />
            {t('users.details.edit_details', 'Edit user details')}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {isLoading || !user ? <Loading /> : <Content />}

      <UserProfileEditDialog
        open={isEditDialogOpen}
        closeDialog={() => setEditDialogOpen(false)}
        user={user}
      />
    </>
  );
};

export default UserProfile;
