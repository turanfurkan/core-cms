'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Plus,
  Trash2,
  Play,
  RefreshCw,
  Settings2,
  Activity,
  FileText,
  LoaderCircleIcon,
  Inbox,
  ChevronRight,
  PlusCircle,
  X,
  Code,
  Copy,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';

// Modals
import WebhookDialog from './components/webhook-dialog';

const AVAILABLE_EVENTS = [
  { id: 'user.registered', label: 'Yeni Kullanıcı Kaydı' },
  { id: 'form.submitted', label: 'Form Başvurusu Alındı' },
  { id: 'content.published', label: 'İçerik Yayınlandı' },
];

export default function WebhooksPage() {
  const queryClient = useQueryClient();

  // Selected webhook ID
  const [selectedWebhookId, setSelectedWebhookId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Edit fields (for the selected webhook details form)
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editSecret, setEditSecret] = useState('');
  const [editEvents, setEditEvents] = useState([]);
  const [editHeaders, setEditHeaders] = useState([]); // Array of { key, value }
  const [editIsActive, setEditIsActive] = useState(true);

  // Delivery log details dialog states
  const [selectedLog, setSelectedLog] = useState(null);
  const [logDialogOpen, setLogDialogOpen] = useState(false);

  // Webhook Logs pagination
  const [logsPage, setLogsPage] = useState(1);

  // Fetch all webhooks
  const { data: webhooksResponse, isLoading: isLoadingWebhooks } = useQuery({
    queryKey: ['admin-webhooks'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/webhooks?limit=100');
      if (!res.ok) throw new Error('Webhooks yüklenemedi.');
      return res.json();
    },
  });

  const webhooksList = webhooksResponse?.data || [];

  // Filter webhooks locally
  const filteredWebhooks = useMemo(() => {
    if (!searchQuery) return webhooksList;
    const query = searchQuery.toLowerCase();
    return webhooksList.filter(
      (w) =>
        w.name?.toLowerCase().includes(query) ||
        w.url?.toLowerCase().includes(query)
    );
  }, [webhooksList, searchQuery]);

  // Selected webhook full object
  const selectedWebhook = useMemo(() => {
    return webhooksList.find((w) => w.id === selectedWebhookId) || null;
  }, [webhooksList, selectedWebhookId]);

  // Synchronize edit states when selected webhook changes
  useEffect(() => {
    if (selectedWebhook) {
      setEditName(selectedWebhook.name || '');
      setEditUrl(selectedWebhook.url || '');
      setEditSecret(selectedWebhook.secret || '');
      setEditEvents(selectedWebhook.events || []);
      setEditIsActive(!!selectedWebhook.is_active);

      // Parse headers into key-value pairs array
      if (selectedWebhook.headers && typeof selectedWebhook.headers === 'object') {
        const pairs = Object.entries(selectedWebhook.headers).map(([key, value]) => ({
          key,
          value: String(value),
        }));
        setEditHeaders(pairs);
      } else {
        setEditHeaders([]);
      }
      // Reset logs page
      setLogsPage(1);
    } else {
      setEditName('');
      setEditUrl('');
      setEditSecret('');
      setEditEvents([]);
      setEditHeaders([]);
      setEditIsActive(true);
    }
  }, [selectedWebhook]);

  // Fetch logs for the selected webhook
  const { data: logsResponse, isLoading: isLoadingLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['admin-webhook-logs', selectedWebhookId, logsPage],
    queryFn: async () => {
      if (!selectedWebhookId) return null;
      const res = await apiFetch(`/api/admin/webhooks/${selectedWebhookId}/logs?page=${logsPage}&limit=10`);
      if (!res.ok) throw new Error('Gönderim günlükleri yüklenemedi.');
      return res.json();
    },
    enabled: !!selectedWebhookId,
  });

  const logsList = logsResponse?.data || [];
  const logsMeta = logsResponse?.meta || {};

  // Toggle Is Active Mutation (fast toggle on list)
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active, name, url, events, secret, headers }) => {
      const res = await apiFetch(`/api/admin/webhooks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          url,
          events,
          secret,
          headers,
          is_active,
        }),
      });
      if (!res.ok) throw new Error('Webhook durumu güncellenemedi.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-webhooks'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Webhook durumu başarıyla güncellendi.</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
    onError: (err) => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive" close={false}>
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{err.message || 'Hata oluştu.'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  const handleToggleActive = (webhook, e) => {
    e.stopPropagation();
    toggleActiveMutation.mutate({
      id: webhook.id,
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      secret: webhook.secret,
      headers: webhook.headers || {},
      is_active: !webhook.is_active,
    });
  };

  // Update Webhook Settings Mutation
  const updateWebhookMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await apiFetch(`/api/admin/webhooks/${selectedWebhookId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Webhook ayarları güncellenemedi.');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-webhooks'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Webhook ayarları başarıyla güncellendi.</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
    onError: (err) => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive" close={false}>
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{err.message || 'Hata oluştu.'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error('Webhook Adı girmelisiniz.');
      return;
    }
    if (!editUrl.trim()) {
      toast.error('Hedef URL girmelisiniz.');
      return;
    }
    try {
      new URL(editUrl.trim());
    } catch (_) {
      toast.error('Geçerli bir URL girmelisiniz.');
      return;
    }
    if (editEvents.length === 0) {
      toast.error('En az bir tetikleyici olay seçmelisiniz.');
      return;
    }

    // Map headers array back to object
    const headersObj = {};
    editHeaders.forEach((h) => {
      if (h.key.trim()) {
        headersObj[h.key.trim()] = h.value;
      }
    });

    const payload = {
      name: editName.trim(),
      url: editUrl.trim(),
      secret: editSecret.trim() || null,
      events: editEvents,
      headers: headersObj,
      is_active: editIsActive,
    };

    updateWebhookMutation.mutate(payload);
  };

  // Delete Webhook Mutation
  const deleteWebhookMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/admin/webhooks/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Webhook silinemedi.');
      return res.json();
    },
    onSuccess: () => {
      setSelectedWebhookId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-webhooks'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Webhook entegrasyonu kaldırıldı.</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
    onError: (err) => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive" close={false}>
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{err.message || 'Silme işlemi başarısız.'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  const handleDeleteWebhook = () => {
    if (confirm('Bu webhook entegrasyonunu silmek istediğinizden emin misiniz? Gönderim logları da kalıcı olarak silinecektir.')) {
      deleteWebhookMutation.mutate(selectedWebhookId);
    }
  };

  // Test Webhook Mutation
  const testWebhookMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/admin/webhooks/${selectedWebhookId}/test`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Test gönderimi tetiklenemedi.');
      }
      return res.json();
    },
    onSuccess: (resData) => {
      const log = resData.data || resData;
      queryClient.invalidateQueries({ queryKey: ['admin-webhook-logs', selectedWebhookId] });
      
      const isOk = log.response_status >= 200 && log.response_status < 300;
      
      toast.custom(
        () => (
          <Alert variant="mono" icon={isOk ? 'success' : 'warning'} close={false}>
            <AlertIcon>
              {isOk ? <RiCheckboxCircleFill /> : <RiErrorWarningFill />}
            </AlertIcon>
            <AlertTitle>
              Test Tamamlandı! HTTP Kodu: {log.response_status} ({log.duration_ms}ms)
            </AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
    onError: (err) => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive" close={false}>
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>Test Gönderimi Başarısız: {err.message}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  // Retry Log Mutation
  const retryLogMutation = useMutation({
    mutationFn: async (logId) => {
      const res = await apiFetch(`/api/admin/webhooks/${selectedWebhookId}/logs/${logId}/retry`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Yeniden gönderim tetiklenemedi.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-webhook-logs', selectedWebhookId] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Olay başarıyla yeniden sıraya eklendi.</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
    onError: (err) => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive" close={false}>
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{err.message || 'Yeniden gönderme işlemi başarısız.'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  const handleRetryLog = (logId, e) => {
    e.stopPropagation();
    retryLogMutation.mutate(logId);
  };

  // Custom HTTP Headers management handlers
  const handleAddHeader = () => {
    setEditHeaders((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveHeader = (index) => {
    setEditHeaders((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleHeaderChange = (index, field, val) => {
    setEditHeaders((prev) => {
      const newHeaders = [...prev];
      newHeaders[index] = { ...newHeaders[index], [field]: val };
      return newHeaders;
    });
  };

  const handleEventCheckboxChange = (eventId, checked) => {
    if (checked) {
      setEditEvents((prev) => [...prev, eventId]);
    } else {
      setEditEvents((prev) => prev.filter((id) => id !== eventId));
    }
  };

  // Helper to format payload and response body
  const formatJson = (data) => {
    if (!data) return '';
    if (typeof data === 'object') {
      return JSON.stringify(data, null, 2);
    }
    try {
      const parsed = JSON.parse(data);
      return JSON.stringify(parsed, null, 2);
    } catch (_) {
      return String(data);
    }
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Webhooks ve Geliştirici Entegrasyonları</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Webhooks</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
        </Toolbar>

        {/* Dashboard split content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left panel: list of webhooks */}
          <div className="lg:col-span-5 space-y-4">
            <Card>
              <CardHeader className="pb-4 select-none">
                <div className="flex justify-between items-center gap-2">
                  <div>
                    <CardTitle className="text-base font-bold">Webhook Entegrasyonları</CardTitle>
                    <CardDescription className="text-xs">Sistem tetikleyicilerini yönetin</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1 px-3 h-8 text-xs font-semibold"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    <Plus className="size-3.5" />
                    Yeni Ekle
                  </Button>
                </div>

                <div className="relative mt-4">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Webhook ismi veya URL ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-8 h-9 text-xs"
                  />
                  {searchQuery && (
                    <Button
                      mode="icon"
                      variant="dim"
                      onClick={() => setSearchQuery('')}
                      className="absolute end-1.5 top-1/2 -translate-y-1/2 h-5 w-5"
                    >
                      <X className="size-3" />
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="px-0 pb-0">
                {isLoadingWebhooks ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                    <LoaderCircleIcon className="size-6 animate-spin text-primary" />
                    <span className="text-[11px]">Entegrasyonlar listeleniyor...</span>
                  </div>
                ) : filteredWebhooks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-5 text-center text-muted-foreground select-none">
                    <Inbox className="size-8 text-muted-foreground/60 mb-2" />
                    <h4 className="text-xs font-bold text-foreground">Webhook bulunamadı</h4>
                    <p className="text-[11px] mt-0.5 max-w-[200px]">
                      Yeni bir webhook adresi ekleyerek başlayabilirsiniz.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border border-t border-border max-h-[500px] overflow-y-auto">
                    {filteredWebhooks.map((item) => {
                      const isSelected = item.id === selectedWebhookId;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedWebhookId(item.id)}
                          className={`flex items-center justify-between p-4 cursor-pointer hover:bg-muted/15 transition-all select-none ${
                            isSelected ? 'bg-primary/5 hover:bg-primary/5 border-s-2 border-primary' : ''
                          }`}
                        >
                          <div className="space-y-1 w-2/3 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs text-foreground truncate max-w-[150px]">
                                {item.name}
                              </span>
                              {!item.is_active && (
                                <Badge variant="dim" className="text-[9px] font-medium h-4 px-1.5 uppercase">
                                  Pasif
                                </Badge>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate font-mono">
                              {item.url}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.events?.map((ev) => (
                                <Badge
                                  key={ev}
                                  variant="mono"
                                  className="text-[9px] h-4.5 px-1 py-0 bg-muted text-muted-foreground"
                                >
                                  {ev.split('.')[1] || ev}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Switch
                              id={`active-${item.id}`}
                              checked={!!item.is_active}
                              onCheckedChange={() => handleToggleActive(item)}
                              disabled={toggleActiveMutation.isPending}
                            />
                            <ChevronRight className="size-4 text-muted-foreground/50" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right panel: selected webhook details & logs */}
          <div className="lg:col-span-7">
            {selectedWebhook ? (
              <Card>
                <CardHeader className="pb-2 select-none border-b border-border">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        {selectedWebhook.name}
                        <Badge
                          variant={selectedWebhook.is_active ? 'success' : 'dim'}
                          className="text-[10px] font-bold uppercase h-5 px-2"
                        >
                          {selectedWebhook.is_active ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs font-mono max-w-[400px] truncate mt-1">
                        {selectedWebhook.url}
                      </CardDescription>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 h-8 text-xs font-semibold"
                        onClick={() => testWebhookMutation.mutate()}
                        disabled={testWebhookMutation.isPending}
                      >
                        {testWebhookMutation.isPending ? (
                          <LoaderCircleIcon className="size-3.5 animate-spin mr-0.5" />
                        ) : (
                          <Play className="size-3.5" />
                        )}
                        Test Et
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1 h-8 text-xs font-semibold"
                        onClick={handleDeleteWebhook}
                      >
                        <Trash2 className="size-3.5" />
                        Sil
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <Tabs defaultValue="settings" className="w-full">
                    <TabsList variant="line" className="w-full px-5 border-b border-border bg-transparent select-none h-11">
                      <TabsTrigger value="settings" className="text-xs font-bold gap-1.5 h-11 rounded-none data-[state=active]:bg-transparent">
                        <Settings2 className="size-3.5" />
                        Entegrasyon Ayarları
                      </TabsTrigger>
                      <TabsTrigger value="logs" className="text-xs font-bold gap-1.5 h-11 rounded-none data-[state=active]:bg-transparent">
                        <Activity className="size-3.5" />
                        Gönderim Günlükleri (Logs)
                      </TabsTrigger>
                    </TabsList>

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="m-0 p-5 space-y-5">
                      <form onSubmit={handleSaveSettings} className="space-y-4">
                        {/* Name */}
                        <div className="space-y-1.5">
                          <Label htmlFor="edit-name" className="text-xs font-semibold text-muted-foreground">
                            Webhook Adı
                          </Label>
                          <Input
                            id="edit-name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Entegrasyon Adı"
                          />
                        </div>

                        {/* URL */}
                        <div className="space-y-1.5">
                          <Label htmlFor="edit-url" className="text-xs font-semibold text-muted-foreground">
                            Hedef URL (Payload URL)
                          </Label>
                          <Input
                            id="edit-url"
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            placeholder="https://example.com/webhook"
                          />
                        </div>

                        {/* Secret */}
                        <div className="space-y-1.5">
                          <Label htmlFor="edit-secret" className="text-xs font-semibold text-muted-foreground">
                            Gizli Anahtar (Secret Token)
                          </Label>
                          <Input
                            id="edit-secret"
                            type="password"
                            value={editSecret}
                            onChange={(e) => setEditSecret(e.target.value)}
                            placeholder="Boş bırakırsanız imza gönderilmez"
                          />
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Ekstra güvenlik için bu anahtar kullanılarak payload SHA256 ile imzalanır.
                          </p>
                        </div>

                        {/* Trigger Events */}
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground">
                            Tetiklenecek Olaylar (Events)
                          </Label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                            {AVAILABLE_EVENTS.map((ev) => {
                              const checked = editEvents.includes(ev.id);
                              return (
                                <div key={ev.id} className="flex items-center gap-2 border border-border rounded-lg p-2.5 bg-muted/5">
                                  <Checkbox
                                    id={`edit-ev-${ev.id}`}
                                    checked={checked}
                                    onCheckedChange={(val) => handleEventCheckboxChange(ev.id, !!val)}
                                  />
                                  <Label
                                    htmlFor={`edit-ev-${ev.id}`}
                                    className="text-[11px] font-medium leading-none cursor-pointer select-none"
                                  >
                                    {ev.label}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Custom HTTP Headers */}
                        <div className="space-y-2.5 pt-1">
                          <div className="flex justify-between items-center select-none">
                            <Label className="text-xs font-semibold text-muted-foreground">
                              Özel HTTP Başlıkları (Headers - İsteğe Bağlı)
                            </Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-xs text-primary font-bold h-7 gap-1"
                              onClick={handleAddHeader}
                            >
                              <PlusCircle className="size-3.5" />
                              Başlık Ekle
                            </Button>
                          </div>

                          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                            {editHeaders.map((header, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Input
                                  placeholder="Header-Name (örn: Authorization)"
                                  value={header.key}
                                  onChange={(e) => handleHeaderChange(idx, 'key', e.target.value)}
                                  className="h-8.5 text-xs w-1/2 font-mono"
                                />
                                <Input
                                  placeholder="Header Value"
                                  value={header.value}
                                  onChange={(e) => handleHeaderChange(idx, 'value', e.target.value)}
                                  className="h-8.5 text-xs w-1/2 font-mono"
                                />
                                <Button
                                  type="button"
                                  variant="dim"
                                  mode="icon"
                                  onClick={() => handleRemoveHeader(idx)}
                                  className="h-8.5 w-8.5 shrink-0 text-destructive hover:bg-destructive/10"
                                >
                                  <X className="size-3.5" />
                                </Button>
                              </div>
                            ))}

                            {editHeaders.length === 0 && (
                              <div className="text-center py-3 border border-dashed border-border rounded-lg bg-muted/5 text-[10px] text-muted-foreground select-none">
                                Henüz özel başlık eklenmedi. (İstekler standart başlıklarla gönderilir).
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Active Switch */}
                        <div className="flex items-center gap-2.5 select-none pt-2">
                          <Switch id="edit-active" checked={editIsActive} onCheckedChange={setEditIsActive} />
                          <Label htmlFor="edit-active" className="text-xs font-semibold cursor-pointer">
                            Webhook Aktif
                          </Label>
                        </div>

                        <div className="pt-2 border-t border-border flex justify-end">
                          <Button type="submit" disabled={updateWebhookMutation.isPending} className="font-semibold">
                            {updateWebhookMutation.isPending && (
                              <LoaderCircleIcon className="size-4 animate-spin mr-1.5" />
                            )}
                            Değişiklikleri Kaydet
                          </Button>
                        </div>
                      </form>
                    </TabsContent>

                    {/* Logs Tab */}
                    <TabsContent value="logs" className="m-0 p-0">
                      {isLoadingLogs ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-2 text-muted-foreground select-none">
                          <LoaderCircleIcon className="size-6 animate-spin text-primary" />
                          <span className="text-[11px]">Gönderim logları listeleniyor...</span>
                        </div>
                      ) : logsList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-5 text-center text-muted-foreground select-none">
                          <Activity className="size-8 text-muted-foreground/60 mb-2" />
                          <h4 className="text-xs font-bold text-foreground font-sans">Gönderim Kaydı Yok</h4>
                          <p className="text-[11px] mt-0.5 max-w-[250px]">
                            Bu webhook henüz tetiklenmedi veya gönderim kaydı bulunmuyor.
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col h-full">
                          <CardTable>
                            <ScrollArea>
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="border-b border-border bg-muted/5 text-muted-foreground text-[10px] font-bold uppercase tracking-wider select-none">
                                    <th className="py-2.5 px-4">Tarih</th>
                                    <th className="py-2.5 px-3">Olay (Event)</th>
                                    <th className="py-2.5 px-3">Durum (HTTP)</th>
                                    <th className="py-2.5 px-3">Süre</th>
                                    <th className="py-2.5 px-4 text-right">İşlem</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border text-xs">
                                  {logsList.map((log) => {
                                    const isSuccess = log.response_status >= 200 && log.response_status < 300;
                                    return (
                                      <tr
                                        key={log.id}
                                        onClick={() => {
                                          setSelectedLog(log);
                                          setLogDialogOpen(true);
                                        }}
                                        className="hover:bg-muted/10 cursor-pointer transition-colors group"
                                      >
                                        <td className="py-2.5 px-4 text-muted-foreground whitespace-nowrap">
                                          {log.created_at ? new Date(log.created_at).toLocaleString('tr-TR') : '-'}
                                        </td>
                                        <td className="py-2.5 px-3 font-semibold text-foreground font-mono text-[11px]">
                                          {log.event}
                                        </td>
                                        <td className="py-2.5 px-3">
                                          <Badge
                                            variant={isSuccess ? 'success' : 'destructive'}
                                            className="text-[10px] font-bold h-5 px-1.5 select-none"
                                          >
                                            {log.response_status || 'Hata'}
                                          </Badge>
                                        </td>
                                        <td className="py-2.5 px-3 text-muted-foreground font-mono text-[10px]">
                                          {log.duration_ms ? `${log.duration_ms} ms` : '-'}
                                        </td>
                                        <td className="py-2.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 px-2 text-[10px] font-bold gap-1 text-primary"
                                            onClick={(e) => handleRetryLog(log.id, e)}
                                            disabled={retryLogMutation.isPending}
                                          >
                                            <RefreshCw className={`size-3 ${retryLogMutation.isPending ? 'animate-spin' : ''}`} />
                                            Yeniden Dene
                                          </Button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                              <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                          </CardTable>

                          {/* Pagination controls */}
                          {logsMeta && logsMeta.last_page > 1 && (
                            <div className="flex items-center justify-between p-4 border-t border-border select-none bg-muted/5">
                              <span className="text-[10px] text-muted-foreground">
                                Sayfa {logsMeta.current_page} / {logsMeta.last_page}
                              </span>
                              <div className="flex gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[10px] font-bold"
                                  onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                                  disabled={logsPage === 1}
                                >
                                  Önceki
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[10px] font-bold"
                                  onClick={() => setLogsPage((p) => Math.min(logsMeta.last_page, p + 1))}
                                  disabled={logsPage === logsMeta.last_page}
                                >
                                  Sonraki
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border rounded-xl bg-card text-muted-foreground select-none">
                <Settings2 className="size-12 text-muted-foreground/40 mb-3" />
                <h3 className="font-bold text-sm text-foreground">Seçili Webhook Yok</h3>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-[280px] text-center">
                  Detayları görüntülemek, ayarları düzenlemek veya logları incelemek için soldaki listeden bir webhook seçin.
                </p>
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* Create Webhook Dialog */}
      {createDialogOpen && (
        <WebhookDialog
          open={createDialogOpen}
          closeDialog={(newWebhook) => {
            setCreateDialogOpen(false);
            if (newWebhook?.id) {
              setSelectedWebhookId(newWebhook.id);
            }
          }}
        />
      )}

      {/* Log Details Dialog */}
      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5">
              <span>Webhook Teslimat Detayı</span>
              {selectedLog && (
                <Badge
                  variant={selectedLog.response_status >= 200 && selectedLog.response_status < 300 ? 'success' : 'destructive'}
                  className="text-[10px] font-bold uppercase"
                >
                  HTTP {selectedLog.response_status || 'Başarısız'}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <DialogBody className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4 text-xs select-none">
                <div>
                  <span className="text-muted-foreground block">Tetikleyici Olay:</span>
                  <span className="font-bold font-mono text-foreground">{selectedLog.event}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Gönderim Tarihi:</span>
                  <span className="font-bold text-foreground">
                    {selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString('tr-TR') : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">İstek Süresi:</span>
                  <span className="font-bold text-foreground">{selectedLog.duration_ms ? `${selectedLog.duration_ms} ms` : '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Log ID:</span>
                  <span className="font-mono text-foreground">#{selectedLog.id}</span>
                </div>
              </div>

              {/* Payload */}
              <div className="space-y-1">
                <div className="flex justify-between items-center select-none">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Code className="size-3.5" />
                    Gönderilen Veri (Request Payload)
                  </Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[10px] text-primary gap-0.5 font-bold"
                    onClick={() => {
                      navigator.clipboard.writeText(formatJson(selectedLog.payload));
                      toast.success('Payload panoya kopyalandı.');
                    }}
                  >
                    <Copy className="size-3" />
                    Kopyala
                  </Button>
                </div>
                <pre className="bg-muted p-3.5 rounded-lg text-[11px] font-mono overflow-x-auto text-foreground max-h-[150px] border border-border">
                  {formatJson(selectedLog.payload)}
                </pre>
              </div>

              {/* Response Body */}
              <div className="space-y-1">
                <div className="flex justify-between items-center select-none">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <FileText className="size-3.5" />
                    Alıcı Yanıtı (Response Body)
                  </Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[10px] text-primary gap-0.5 font-bold"
                    onClick={() => {
                      navigator.clipboard.writeText(formatJson(selectedLog.response_body));
                      toast.success('Yanıt panoya kopyalandı.');
                    }}
                  >
                    <Copy className="size-3" />
                    Kopyala
                  </Button>
                </div>
                <pre className="bg-muted p-3.5 rounded-lg text-[11px] font-mono overflow-x-auto text-foreground max-h-[150px] border border-border">
                  {selectedLog.response_body ? formatJson(selectedLog.response_body) : '(Boş yanıt)'}
                </pre>
              </div>
            </DialogBody>
          )}

          <DialogFooter className="select-none">
            <Button variant="outline" onClick={() => setLogDialogOpen(false)}>
              Kapat
            </Button>
            {selectedLog && (
              <Button
                className="gap-1.5 font-semibold"
                onClick={(e) => {
                  handleRetryLog(selectedLog.id, e);
                  setLogDialogOpen(false);
                }}
                disabled={retryLogMutation.isPending}
              >
                <RefreshCw className="size-3.5" />
                Yeniden Sıraya Ekle
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
