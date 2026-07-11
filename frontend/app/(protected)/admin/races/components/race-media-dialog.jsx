'use client';

import { useEffect, useState } from 'react';
import { RightDrawer } from '@/components/common/right-drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/ui/file-upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Map, AreaChart, Images, Compass, Video, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function RaceMediaDialog({ open, onOpenChange, race, defaultTab = 'gpx', onSave }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [saving, setSaving] = useState(false);

  // Media states
  const [gpxFileId, setGpxFileId] = useState(null);
  const [graphicImageId, setGraphicImageId] = useState(null);
  const [galleryIds, setGalleryIds] = useState([]);
  const [locationEmbed, setLocationEmbed] = useState('');
  const [youtubeEmbed, setYoutubeEmbed] = useState('');

  // Initialise values when drawer opens or race changes
  useEffect(() => {
    if (open && race) {
      setGpxFileId(race.gpx_file_id || null);
      setGraphicImageId(race.graphic_image_id || null);
      setGalleryIds(race.gallery_ids || (race.gallery || []).map((g) => g.id) || []);
      setLocationEmbed(race.location_embed || '');
      setYoutubeEmbed(race.youtube_embed || '');
      setActiveTab(defaultTab || 'gpx');
    }
  }, [open, race, defaultTab]);

  const handleSave = async () => {
    if (!race) return;
    setSaving(true);

    try {
      const updatedFields = {
        gpx_file_id: gpxFileId,
        graphic_image_id: graphicImageId,
        gallery_ids: galleryIds,
        location_embed: locationEmbed,
        youtube_embed: youtubeEmbed,
      };

      await onSave({ id: race.id, updatedFields, currentRace: race });
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message || 'Medya bilgileri güncellenirken hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <RightDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Medya & İçerik Düzenleyici"
      size="2xl"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-lg text-xs"
            disabled={saving}
          >
            Kapat
          </Button>
          <Button
            onClick={handleSave}
            className="h-9 rounded-lg text-xs gap-1.5"
            disabled={saving}
          >
            {saving ? (
              <>
                <LoaderCircle className="size-3.5 animate-spin" /> Kaydediliyor...
              </>
            ) : (
              'Değişiklikleri Kaydet'
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">
          <strong>Yarış:</strong> {race?.title?.tr || ''} <br />
          Yarışa ait harita rotası, profil grafik görseli, fotoğraf galerisi ve tanıtım videolarını buradan hızlıca güncelleyin.
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 bg-muted/50 p-1 rounded-xl h-10 border border-border/80">
            <TabsTrigger value="gpx" className="text-[10px] font-bold rounded-lg flex items-center justify-center gap-1">
              <Map className="size-3.5" /> GPX Rota
            </TabsTrigger>
            <TabsTrigger value="graphic" className="text-[10px] font-bold rounded-lg flex items-center justify-center gap-1">
              <AreaChart className="size-3.5" /> Profil
            </TabsTrigger>
            <TabsTrigger value="gallery" className="text-[10px] font-bold rounded-lg flex items-center justify-center gap-1">
              <Images className="size-3.5" /> Galeri
            </TabsTrigger>
            <TabsTrigger value="strava" className="text-[10px] font-bold rounded-lg flex items-center justify-center gap-1">
              <Compass className="size-3.5" /> Strava
            </TabsTrigger>
            <TabsTrigger value="video" className="text-[10px] font-bold rounded-lg flex items-center justify-center gap-1">
              <Video className="size-3.5" /> Video
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 min-h-[220px]">
            {/* GPX Tab */}
            <TabsContent value="gpx" className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">GPX Rota Dosyası Yükle</Label>
                <p className="text-[10px] text-muted-foreground/80">Sporcuların akıllı saatlerinde veya harita uygulamalarında kullanabileceği rota koordinat dosyası (.gpx).</p>
              </div>
              <FileUpload
                value={gpxFileId}
                onChange={setGpxFileId}
                accept=".gpx"
                maxSizeMB={15}
                placeholder="GPX dosyasını buraya sürükleyin veya seçin"
                description="Yalnızca .gpx formatındaki rota dosyaları desteklenir. Max: 15MB."
              />
            </TabsContent>

            {/* Graphic Profile Tab */}
            <TabsContent value="graphic" className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">Yükseklik Profil Grafiği</Label>
                <p className="text-[10px] text-muted-foreground/80">Yarış parkurunun yükseklik (irtifa kazanımı/kaybı) grafik görseli.</p>
              </div>
              <FileUpload
                value={graphicImageId}
                onChange={setGraphicImageId}
                accept="image/*"
                maxSizeMB={5}
                placeholder="Profil görselini buraya sürükleyin veya seçin"
                description="Görsel formatları (PNG, JPG, WEBP) desteklenir. Max: 5MB."
              />
            </TabsContent>

            {/* Gallery Tab */}
            <TabsContent value="gallery" className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">Yarış Fotoğraf Galerisi</Label>
                <p className="text-[10px] text-muted-foreground/80">Yarış parkuruna, önceki yıllara veya manzara detaylarına ait fotoğraf albümü.</p>
              </div>
              <FileUpload
                value={galleryIds}
                onChange={setGalleryIds}
                isMultiple={true}
                accept="image/*"
                maxSizeMB={10}
                placeholder="Görselleri sürükleyin veya seçin (Çoklu Seçim)"
                description="Görsel formatları desteklenir. İstediğiniz kadar fotoğraf ekleyebilirsiniz."
              />
            </TabsContent>

            {/* Strava Embed Tab */}
            <TabsContent value="strava" className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">Strava Rota Entegrasyon Kodu</Label>
                <p className="text-[10px] text-muted-foreground/80">Strava üzerindeki rotanın iframe paylaşım embed kodunu veya doğrudan URL linkini buraya yapıştırın.</p>
              </div>
              <div className="space-y-2">
                <Input
                  type="text"
                  value={locationEmbed}
                  onChange={(e) => setLocationEmbed(e.target.value)}
                  placeholder="<iframe src='https://www.strava.com/routes/...' ...></iframe> veya https://..."
                  className="text-xs h-10 rounded-lg bg-card border border-border"
                />
                {locationEmbed && locationEmbed.includes('<iframe') && (
                  <div className="p-3 bg-muted/40 border border-border/60 rounded-lg text-[10px] text-muted-foreground/90 font-medium">
                    ✓ Geçerli embed iframe kodu girildi. Sayfada etkileşimli harita olarak görüntülenecektir.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Youtube Embed Tab */}
            <TabsContent value="video" className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">Youtube Tanıtım Videosu</Label>
                <p className="text-[10px] text-muted-foreground/80">Yarışa ait tanıtım videosunun Youtube embed adresini veya standart video linkini buraya ekleyin.</p>
              </div>
              <div className="space-y-2">
                <Input
                  type="text"
                  value={youtubeEmbed}
                  onChange={(e) => setYoutubeEmbed(e.target.value)}
                  placeholder="https://www.youtube.com/embed/... veya https://youtu.be/..."
                  className="text-xs h-10 rounded-lg bg-card border border-border"
                />
                {youtubeEmbed && (
                  <div className="p-3 bg-muted/40 border border-border/60 rounded-lg text-[10px] text-muted-foreground/90 font-medium">
                    ℹ️ Video URL adresi kaydedildi. Kullanıcı detay sayfasında gömülü olarak oynatılabilecektir.
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </RightDrawer>
  );
}
