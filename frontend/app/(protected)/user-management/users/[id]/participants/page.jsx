'use client';

import React from 'react';
import { useUser } from '../components/user-context';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardTable } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Users, Phone, ShieldAlert, MapPin, UserCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserParticipantsPage() {
  const { t } = useTranslation();
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="w-48 h-6" />
          <Skeleton className="w-80 h-4 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="w-full h-10" />
          <Skeleton className="w-full h-24" />
        </CardContent>
      </Card>
    );
  }

  const participants = user?.participants || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <div>
            <CardTitle>{t('users.details.participants.title', 'Katılımcı Profilleri')}</CardTitle>
            <CardDescription>
              {t(
                'users.details.participants.description',
                'Bu kullanıcıya bağlı tanımlı tüm katılımcı profilleri.'
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      {participants.length === 0 ? (
        <CardContent>
          <div className="text-center py-12 text-sm text-muted-foreground border border-dashed rounded-xl p-8">
            {t('users.details.participants.empty', 'Kullanıcıya bağlı henüz hiçbir katılımcı profili bulunamadı.')}
          </div>
        </CardContent>
      ) : (
        <CardTable>
          <ScrollArea>
            <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">{t('participants.fields.name', 'Ad Soyad')}</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">{t('participants.fields.gender', 'Cinsiyet')}</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">{t('participants.fields.dob', 'Doğum Tarihi')}</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">{t('participants.fields.identity', 'T.C. / Kimlik No')}</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">{t('participants.fields.blood', 'Kan Grubu')}</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">{t('participants.fields.phone', 'Telefon')}</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">{t('participants.fields.tshirt', 'Tişört')}</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">{t('participants.fields.club', 'Kulüp')}</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">{t('participants.fields.nationality', 'Uyruk')}</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">{t('participants.fields.emergency', 'Acil Durum')}</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">{t('participants.fields.address', 'Adres')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/10">
                      <TableCell className="font-semibold text-foreground whitespace-nowrap flex items-center gap-1.5 py-4">
                        <UserCheck className="size-3.5 text-primary/70 shrink-0" />
                        {p.name}
                      </TableCell>
                      <TableCell className="capitalize whitespace-nowrap text-xs text-muted-foreground font-medium">
                        {p.gender === 'male' || p.gender === 'erkek' ? (
                          <Badge variant="outline" className="bg-blue-50/50 text-blue-600 border-blue-100 hover:bg-blue-50/50">
                            {t('common.gender.male', 'Erkek')}
                          </Badge>
                        ) : p.gender === 'female' || p.gender === 'kadın' ? (
                          <Badge variant="outline" className="bg-pink-50/50 text-pink-600 border-pink-100 hover:bg-pink-50/50">
                            {t('common.gender.female', 'Kadın')}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-50">
                            {p.gender || '-'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground font-medium">{p.date_of_birth || '-'}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground/90 whitespace-nowrap">{p.identity_number || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap py-4">
                        {p.blood_type ? (
                          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-100 hover:bg-red-50 font-bold">
                            {p.blood_type}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/60">-</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground font-medium">{p.phone_number || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs font-mono text-muted-foreground font-bold">
                        {p.t_shirt_size ? (
                          <Badge variant="secondary" className="hover:bg-secondary font-bold">
                            {p.t_shirt_size}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground max-w-[150px] truncate" title={p.club_name}>
                        {p.club_name || '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className="font-bold text-[10px]">
                          {p.nationality || 'TR'}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {p.emergency_contact ? (
                          <div className="flex flex-col gap-0.5 leading-tight">
                            <span className="font-medium text-foreground flex items-center gap-1">
                              <ShieldAlert className="size-3 text-red-500/80 shrink-0" />
                              {p.emergency_contact}
                            </span>
                            <span className="text-muted-foreground text-[10px] flex items-center gap-1 font-mono">
                              <Phone className="size-2.5 text-muted-foreground/75 shrink-0" />
                              {p.emergency_phone_number || '-'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground min-w-[200px] max-w-[300px]" title={p.address}>
                        {p.address ? (
                          <span className="flex items-start gap-1 line-clamp-2 leading-relaxed">
                            <MapPin className="size-3 text-muted-foreground/70 mt-0.5 shrink-0" />
                            {p.address}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
        )}
    </Card>
  );
}
