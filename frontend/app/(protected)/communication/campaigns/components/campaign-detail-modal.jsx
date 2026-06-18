'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Mail, CheckCircle2, AlertTriangle, Info, Clock, Check, Calendar } from 'lucide-react';

export default function CampaignDetailModal({ open, closeDialog, campaign }) {
  if (!campaign) return null;

  const summary = campaign.summary || {};
  const sentCount = summary.sent_count || 0;
  const failedCount = summary.failed_count || 0;
  const totalCount = summary.total_count || (sentCount + failedCount);
  const errors = summary.errors || [];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return (
          <Badge variant="mono" className="bg-muted text-muted-foreground border-muted-foreground/20 font-semibold select-none h-5 px-2">
            Taslak
          </Badge>
        );
      case 'sending':
        return (
          <Badge variant="mono" className="bg-primary/10 text-primary border-primary/20 animate-pulse font-semibold select-none h-5 px-2">
            Gönderiliyor...
          </Badge>
        );
      case 'sent':
        return (
          <Badge variant="mono" className="bg-success/10 text-success border-success/20 font-semibold select-none h-5 px-2">
            Gönderildi
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="mono" className="bg-destructive/10 text-destructive border-destructive/20 font-semibold select-none h-5 px-2">
            Başarısız
          </Badge>
        );
      default:
        return <Badge variant="mono" className="h-5 px-2 font-semibold select-none">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Kampanya Gönderim Detayı</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-5">
          {/* Main Info */}
          <div className="space-y-3 bg-muted/20 border border-border p-4 rounded-lg select-none">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-semibold">Kampanya Adı</span>
              <span className="text-sm font-bold text-foreground">{campaign.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-semibold">Şablon Kodu (Template)</span>
              <span className="text-xs font-mono font-bold text-primary">{campaign.template_code}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-semibold">Gönderim Durumu</span>
              {getStatusBadge(campaign.status)}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 border-b border-border pb-4 select-none">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1">
                <Calendar className="size-3 text-muted-foreground" />
                Planlanan Zaman
              </span>
              <p className="text-xs font-semibold text-foreground">
                {campaign.scheduled_at ? new Date(campaign.scheduled_at).toLocaleString('tr-TR') : 'Hemen Gönderim'}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1">
                <Clock className="size-3 text-muted-foreground" />
                Gönderim Tarihi
              </span>
              <p className="text-xs font-semibold text-foreground">
                {campaign.sent_at ? new Date(campaign.sent_at).toLocaleString('tr-TR') : '-'}
              </p>
            </div>
          </div>

          {/* Statistics Summary */}
          {campaign.status !== 'draft' && (
            <div className="space-y-3.5 pt-1">
              <Label className="text-xs font-bold text-foreground select-none">Gönderim İstatistikleri</Label>
              <div className="grid grid-cols-3 gap-3 text-center select-none">
                <div className="bg-muted/10 border border-border p-3 rounded-lg">
                  <span className="text-[10px] font-bold text-muted-foreground block mb-0.5">Toplam Alıcı</span>
                  <span className="text-lg font-bold text-foreground">{totalCount}</span>
                </div>
                <div className="bg-success/5 border border-success/10 p-3 rounded-lg text-success">
                  <span className="text-[10px] font-bold text-success/80 block mb-0.5">Başarılı</span>
                  <span className="text-lg font-bold flex items-center justify-center gap-1">
                    <CheckCircle2 className="size-4" />
                    {sentCount}
                  </span>
                </div>
                <div className="bg-destructive/5 border border-destructive/10 p-3 rounded-lg text-destructive">
                  <span className="text-[10px] font-bold text-destructive/80 block mb-0.5">Hata/Başarısız</span>
                  <span className="text-lg font-bold flex items-center justify-center gap-1">
                    <AlertTriangle className="size-4" />
                    {failedCount}
                  </span>
                </div>
              </div>

              {/* Errors log list */}
              {errors.length > 0 && (
                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-bold text-destructive flex items-center gap-1.5 select-none">
                    <AlertTriangle className="size-3.5" />
                    Hata Detayları ({errors.length})
                  </Label>
                  <div className="max-h-36 overflow-y-auto border border-border rounded-lg p-2.5 bg-destructive/5 space-y-1.5">
                    {errors.map((err, index) => (
                      <div key={index} className="text-[11px] text-destructive-foreground/90 font-mono break-all border-b border-destructive/10 pb-1 last:border-0 last:pb-0">
                        • {err}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {campaign.status === 'draft' && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 border border-dashed border-border p-3.5 rounded-lg select-none">
              <Info className="size-4 text-primary shrink-0" />
              <span>Bu kampanya henüz taslak aşamasındadır. Gönderimi başlatmak için liste sayfasındaki "Gönder" butonuna tıklayabilirsiniz.</span>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="select-none">
          <Button type="button" variant="outline" onClick={closeDialog} className="w-full">
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
