'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BlockNoteSchema,
  defaultBlockSpecs,
  filterSuggestionItems,
  insertOrUpdateBlockForSlashMenu
} from "@blocknote/core";
import {
  createReactBlockSpec,
  useCreateBlockNote,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { SuggestionMenuController } from "@blocknote/react";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import {
  GripVertical,
  Plus,
  Trash2,
  Heading2,
  FileText,
  Image as ImageIcon,
  Quote,
  Layers,
  Search,
  Check,
  Settings
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FileUpload } from '@/components/ui/file-upload';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { apiFetch } from '@/lib/api';

// Block Selection Grid
function EntityPicker({ entityType, selectedIds, onChange }) {
  const [search, setSearch] = useState('');

  // Fetch races if type is race
  const { data: racesData } = useQuery({
    queryKey: ['admin-races-picker'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/races');
      if (!res.ok) throw new Error('Failed to fetch races');
      const json = await res.json();
      return json.data || [];
    },
    enabled: entityType === 'race'
  });

  // Fetch categories of all types
  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories-picker'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const json = await res.json();
      return json.data || [];
    },
    enabled: entityType === 'category'
  });

  const items = useMemo(() => {
    if (entityType === 'race') return racesData || [];
    if (entityType === 'category') return categoriesData || [];
    return [];
  }, [entityType, racesData, categoriesData]);

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter(item => {
      const title = item.title || item.name;
      const text = typeof title === 'object' ? (title.tr || title.en || '') : (title || '');
      return text.toLowerCase().includes(lower);
    });
  }, [items, search]);

  const handleToggle = (id) => {
    const ids = [...selectedIds];
    if (ids.includes(id)) {
      onChange(ids.filter(i => i !== id));
    } else {
      onChange([...ids, id]);
    }
  };

  return (
    <div className="space-y-2 mt-2">
      <div className="relative">
        <Search className="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground/50" />
        <Input
          size="sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`${entityType === 'race' ? 'Yarış' : 'Kategori'} ara...`}
          className="pl-8 h-8 text-xs"
        />
      </div>
      <div className="grid grid-cols-2 gap-1.5 max-h-[280px] overflow-y-auto p-1.5 border border-border/80 rounded-lg bg-muted/10">
        {filteredItems.map((item) => {
          const title = item.title || item.name;
          const label = typeof title === 'object' ? (title.tr || title.en || '') : (title || '');
          const isSelected = selectedIds.includes(item.id);

          return (
            <div
              key={item.id}
              onClick={() => handleToggle(item.id)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-[11px] font-semibold cursor-pointer select-none transition-all ${
                isSelected
                  ? "border-primary/30 bg-primary/5 text-primary"
                  : "border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`size-3.5 rounded border flex items-center justify-center shrink-0 ${
                isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
              }`}>
                {isSelected && <Check className="size-2.5 stroke-[3]" />}
              </div>
              <span className="truncate">{label}</span>
            </div>
          );
        })}
        {filteredItems.length === 0 && (
          <div className="col-span-full py-4 text-center text-xs text-muted-foreground">
            Bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
}

// Sortable Item Wrapper
// Custom Block Note integration specs
const ImageBlock = createReactBlockSpec(
  {
    type: "imageBlock",
    propSchema: {
      image_id: { default: null },
      caption: { default: "" }
    },
    content: "none"
  },
  {
    render: ({ block, editor }) => {
      return (
        <div className="space-y-2.5 max-w-xl border border-border/40 p-4 rounded-xl bg-muted/5 relative my-2 w-full" contentEditable={false}>
          <div className="border border-border/80 rounded-xl overflow-hidden bg-muted/5">
            <FileUpload
              value={block.props.image_id ? [block.props.image_id] : []}
              onChange={(val) => {
                editor.updateBlock(block, {
                  props: { ...block.props, image_id: val && val.length > 0 ? val[0] : null }
                });
              }}
              isMultiple={false}
              placeholder="Görsel seçin veya sürükleyin"
            />
          </div>
          <input
            type="text"
            value={block.props.caption || ''}
            onChange={(e) => {
              editor.updateBlock(block, {
                props: { ...block.props, caption: e.target.value }
              });
            }}
            placeholder="Görsel açıklaması yazın (isteğe bağlı)..."
            className="w-full bg-transparent text-xs text-muted-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-0 border-0 p-0 italic mt-1"
          />
        </div>
      );
    }
  }
);

function PreviewCard({ item, type, showPrice }) {
  const title = item.title || item.name;
  const label = typeof title === 'object' ? (title.tr || title.en || '') : (title || '');
  const slug = typeof item.slug === 'object' ? (item.slug.tr || item.slug.en || '') : (item.slug || '');
  
  const imageUrl = item.cover_image?.url || item.image?.url || null;
  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
  const fullImageUrl = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${backendUrl}${imageUrl}`) : null;

  return (
    <div className="border border-border/80 rounded-xl p-2.5 bg-card flex flex-col justify-between h-[180px] shadow-2xs hover:shadow-xs transition-shadow">
      <div className="space-y-2 min-w-0">
        <div className="w-full h-20 rounded-lg bg-muted/40 overflow-hidden flex items-center justify-center border border-border/30 shrink-0">
          {fullImageUrl ? (
            <img src={fullImageUrl} alt={label} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="size-5 text-muted-foreground/30" />
          )}
        </div>
        <div className="space-y-0.5 px-0.5 min-w-0">
          <h5 className="text-[11px] font-bold text-foreground line-clamp-1 truncate" title={label}>{label}</h5>
          <p className="text-[9px] text-muted-foreground/80 font-mono line-clamp-1 truncate">{slug}</p>
        </div>
      </div>
      
      {type === 'race' && showPrice !== false && (
        <div className="flex items-center justify-between border-t border-border/30 pt-1.5 mt-1.5 px-0.5">
          <span className="text-[9px] text-muted-foreground font-semibold">Başlangıç</span>
          <span className="text-[10px] font-extrabold text-primary">{item.price ? `${item.price} ₺` : 'Ücretsiz'}</span>
        </div>
      )}
    </div>
  );
}

function PreviewListRow({ item, type, showPrice }) {
  const title = item.title || item.name;
  const label = typeof title === 'object' ? (title.tr || title.en || '') : (title || '');
  const slug = typeof item.slug === 'object' ? (item.slug.tr || item.slug.en || '') : (item.slug || '');
  
  const imageUrl = item.cover_image?.url || item.image?.url || null;
  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
  const fullImageUrl = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${backendUrl}${imageUrl}`) : null;

  return (
    <div className="flex items-center justify-between p-3 hover:bg-muted/10 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="size-10 rounded-lg bg-muted/40 overflow-hidden shrink-0 flex items-center justify-center border border-border/30">
          {fullImageUrl ? (
            <img src={fullImageUrl} alt={label} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="size-4 text-muted-foreground/30" />
          )}
        </div>
        <div className="min-w-0">
          <h5 className="text-[11px] font-bold text-foreground truncate" title={label}>{label}</h5>
          <p className="text-[9px] text-muted-foreground/80 font-mono truncate">{slug}</p>
        </div>
      </div>

      {type === 'race' && showPrice !== false && (
        <div className="text-right shrink-0">
          <span className="text-[10px] font-extrabold text-primary block">{item.price ? `${item.price} ₺` : 'Ücretsiz'}</span>
        </div>
      )}
    </div>
  );
}

const ShowcaseBlock = createReactBlockSpec(
  {
    type: "showcaseBlock",
    propSchema: {
      entity_type: { default: "race" },
      entity_ids: { default: [] },
      display_style: { default: "grid" },
      show_price: { default: true }
    },
    content: "none"
  },
  {
    render: ({ block, editor }) => {
      const [isDrawerOpen, setIsDrawerOpen] = useState(false);

      // Fetch races & categories for live preview and selection
      const { data: races } = useQuery({
        queryKey: ['admin-races-showcase-preview'],
        queryFn: async () => {
          const res = await apiFetch('/api/admin/races');
          if (!res.ok) throw new Error('Failed to fetch races');
          const json = await res.json();
          return json.data || [];
        }
      });

      const { data: categories } = useQuery({
        queryKey: ['admin-categories-showcase-preview'],
        queryFn: async () => {
          const res = await apiFetch('/api/admin/categories');
          if (!res.ok) throw new Error('Failed to fetch categories');
          const json = await res.json();
          return json.data || [];
        }
      });

      const allItems = block.props.entity_type === 'race' ? (races || []) : (categories || []);
      const selectedItems = allItems.filter(item => block.props.entity_ids?.includes(item.id));

      return (
        <div className="my-3 w-full" contentEditable={false}>
          {selectedItems.length === 0 ? (
            /* Blank Slate Placeholder Box */
            <div
              className="border-2 border-dashed border-border/80 hover:border-primary/50 hover:bg-muted/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all w-full"
              onClick={() => setIsDrawerOpen(true)}
            >
              <div className="p-4 rounded-full bg-muted/40 text-muted-foreground/60 mb-3">
                <Layers className="size-8" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Boş Vitrin (Showcase) Bloku</h4>
              <p className="text-xs text-muted-foreground max-w-md mt-1.5 mb-4">
                Yazı içinde sergilenecek yarışları veya kategorileri seçmek ve görünümlerini düzenlemek için tıklayın.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 font-bold text-xs bg-card border-border shadow-xs hover:bg-muted/40 transition-colors"
                onClick={(e) => { e.stopPropagation(); setIsDrawerOpen(true); }}
              >
                <Settings className="size-3.5" /> Vitrini Yapılandır
              </Button>
            </div>
          ) : (
            /* Live Proportional Layout Previews */
            <div className="border border-border/60 rounded-2xl p-4 bg-muted/5 relative w-full group transition-all hover:border-primary/20">
              {/* Header Action Bar */}
              <div className="flex items-center justify-between border-b border-border/40 pb-2.5 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <Layers className="size-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold text-foreground uppercase tracking-wider block">
                      Vitrin: {block.props.entity_type === 'race' ? 'Yarışlar' : 'Kategoriler'} ({selectedItems.length})
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-semibold tracking-wide uppercase px-2 py-0 bg-card">
                    {block.props.display_style === 'grid' ? 'Izgara' : block.props.display_style === 'carousel' ? 'Kaydırıcı' : 'Liste'}
                  </Badge>
                </div>
                <Button
                  size="xs"
                  variant="ghost"
                  className="h-8 px-3 gap-1.5 font-bold text-[10px] text-muted-foreground hover:text-foreground border border-border bg-card rounded-lg shrink-0 shadow-xs hover:bg-muted/40 transition-all"
                  onClick={() => setIsDrawerOpen(true)}
                >
                  <Settings className="size-3.5" /> Düzenle
                </Button>
              </div>

              {/* Layout Content Renderer */}
              {block.props.display_style === 'grid' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full animate-in fade-in-50 duration-200">
                  {selectedItems.map(item => (
                    <PreviewCard key={item.id} item={item} type={block.props.entity_type} showPrice={block.props.show_price} />
                  ))}
                </div>
              )}

              {block.props.display_style === 'carousel' && (
                <div className="flex items-center gap-3 overflow-x-auto w-full no-scrollbar pb-1 pt-0.5 animate-in fade-in-50 duration-200">
                  {selectedItems.map(item => (
                    <div key={item.id} className="w-[180px] shrink-0">
                      <PreviewCard item={item} type={block.props.entity_type} showPrice={block.props.show_price} />
                    </div>
                  ))}
                </div>
              )}

              {block.props.display_style === 'list' && (
                <div className="divide-y divide-border/60 w-full border border-border/60 rounded-xl bg-card overflow-hidden shadow-xs animate-in fade-in-50 duration-200">
                  {selectedItems.map(item => (
                    <PreviewListRow key={item.id} item={item} type={block.props.entity_type} showPrice={block.props.show_price} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Configuration Right Drawer Panel */}
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetContent className="w-[420px] sm:w-[500px] flex flex-col h-full bg-background p-0 border-l border-border shadow-2xl">
              {/* Header */}
              <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/40">
                <SheetTitle className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <Layers className="size-4 text-primary" /> Vitrin Bloku Ayarları
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground mt-1">
                  Yazı içerisinde sergilenecek yarışları veya kategorileri seçin ve tasarımını özelleştirin.
                </SheetDescription>
              </SheetHeader>

              {/* Settings Form Body */}
              <SheetBody className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                {/* 1. Entity Type Selection */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground/80">Sergilenecek Veri Türü</Label>
                  <Select
                    value={block.props.entity_type || 'race'}
                    onValueChange={(val) => {
                      editor.updateBlock(block, {
                        props: {
                          ...block.props,
                          entity_type: val,
                          entity_ids: []
                        }
                      });
                    }}
                  >
                    <SelectTrigger className="h-9 bg-card text-xs font-semibold">
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="race" className="text-xs font-medium">Yarışlar (Races)</SelectItem>
                      <SelectItem value="category" className="text-xs font-medium">Kategoriler (Categories)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 2. Display Style Selection */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground/80">Görünüm Tasarımı</Label>
                  <Select
                    value={block.props.display_style || 'grid'}
                    onValueChange={(val) => {
                      editor.updateBlock(block, {
                        props: { ...block.props, display_style: val }
                      });
                    }}
                  >
                    <SelectTrigger className="h-9 bg-card text-xs font-semibold">
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid" className="text-xs font-medium">Kutu Izgarası (Grid)</SelectItem>
                      <SelectItem value="carousel" className="text-xs font-medium">Kaydırıcı (Carousel)</SelectItem>
                      <SelectItem value="list" className="text-xs font-medium">Liste (List)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 3. Show Price Option (Conditional) */}
                {block.props.entity_type === 'race' && (
                  <div className="flex items-center justify-between border-t border-b border-border/40 py-3.5 select-none">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground/80">Fiyat Gösterimi</Label>
                      <p className="text-[10px] text-muted-foreground">Yarış başlangıç fiyatlarını kartlar üzerinde göster.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={block.props.show_price !== false}
                      onChange={(e) => {
                        editor.updateBlock(block, {
                          props: { ...block.props, show_price: e.target.checked }
                        });
                      }}
                      className="size-4 text-primary bg-card border-border rounded focus:ring-primary cursor-pointer"
                    />
                  </div>
                )}

                {/* 4. Entity Picker */}
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground/80">
                      {block.props.entity_type === 'race' ? 'Yarışları' : 'Kategorileri'} Seçin
                    </Label>
                    <p className="text-[10px] text-muted-foreground">Listeye eklemek istediklerinizi seçin.</p>
                  </div>

                  <EntityPicker
                    entityType={block.props.entity_type || 'race'}
                    selectedIds={block.props.entity_ids || []}
                    onChange={(newIds) => {
                      editor.updateBlock(block, {
                        props: { ...block.props, entity_ids: newIds }
                      });
                    }}
                  />
                </div>
              </SheetBody>

              {/* Footer */}
              <SheetFooter className="px-6 py-4 border-t border-border/40 bg-muted/5">
                <SheetClose asChild>
                  <Button size="sm" className="w-full font-bold text-xs">Kaydet ve Kapat</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      );
    }
  }
);

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    imageBlock: ImageBlock(),
    showcaseBlock: ShowcaseBlock()
  }
});

// Main Component
export default function BlockEditor({ value = [], onChange, activeLang = 'tr' }) {
  const [isLoaded, setIsLoaded] = useState(false);

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiFetch('/api/admin/media/files', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      throw new Error('Dosya yüklenemedi');
    }
    const json = await res.json();
    return json.data.url;
  };

  const editor = useCreateBlockNote({
    schema,
    uploadFile
  });

  // 1. Convert DB custom blocks -> BlockNote blocks on mount
  useEffect(() => {
    if (!editor || isLoaded) return;

    const loadBlocks = async () => {
      const documentBlocks = [];
      for (const b of value) {
        if (b.type === 'text') {
          const html = b.data.text?.[activeLang] || '';
          const parsed = editor.tryParseHTMLToBlocks(html);
          documentBlocks.push(...parsed);
        } else if (b.type === 'heading') {
          const levelMap = { h2: 1, h3: 2, h4: 3 };
          documentBlocks.push({
            type: 'heading',
            props: { level: levelMap[b.data.level] || 1 },
            content: [{ type: 'text', text: b.data.text?.[activeLang] || '', styles: {} }]
          });
        } else if (b.type === 'quote') {
          documentBlocks.push({
            type: 'quote',
            content: [{ type: 'text', text: b.data.text?.[activeLang] || '', styles: {} }]
          });
        } else if (b.type === 'image') {
          documentBlocks.push({
            type: 'imageBlock',
            props: {
              image_id: b.data.image_id,
              caption: b.data.caption?.[activeLang] || ''
            }
          });
        } else if (b.type === 'entity_showcase') {
          documentBlocks.push({
            type: 'showcaseBlock',
            props: {
              entity_type: b.data.entity_type || 'race',
              entity_ids: b.data.entity_ids || [],
              display_style: b.data.display_style || 'grid',
              show_price: b.data.settings?.show_price !== false
            }
          });
        }
      }

      if (documentBlocks.length === 0) {
        documentBlocks.push({ type: 'paragraph', content: [] });
      }

      editor.replaceBlocks(editor.document, documentBlocks);
      setIsLoaded(true);
    };

    loadBlocks();
  }, [editor, value, isLoaded, activeLang]);

  // 2. Convert BlockNote blocks -> DB custom blocks on editor changes
  const handleEditorChange = async () => {
    if (!editor || !isLoaded) return;

    const docBlocks = editor.document;
    const customBlocks = [];

    for (const block of docBlocks) {
      if (
        block.type === 'paragraph' ||
        block.type === 'bulletListItem' ||
        block.type === 'numberedListItem' ||
        block.type === 'image' ||
        block.type === 'video' ||
        block.type === 'file' ||
        block.type === 'audio'
      ) {
        const html = editor.blocksToHTMLLossy([block]);
        customBlocks.push({
          id: block.id,
          type: 'text',
          data: {
            text: {
              [activeLang]: html,
              en: ''
            }
          }
        });
      } else if (block.type === 'heading') {
        const levelMap = { 1: 'h2', 2: 'h3', 3: 'h4' };
        const textContent = block.content.map(c => c.text).join('');
        customBlocks.push({
          id: block.id,
          type: 'heading',
          data: {
            level: levelMap[block.props.level] || 'h2',
            text: {
              [activeLang]: textContent,
              en: ''
            }
          }
        });
      } else if (block.type === 'quote') {
        const textContent = block.content.map(c => c.text).join('');
        customBlocks.push({
          id: block.id,
          type: 'quote',
          data: {
            text: {
              [activeLang]: textContent,
              en: ''
            },
            author: ''
          }
        });
      } else if (block.type === 'imageBlock') {
        customBlocks.push({
          id: block.id,
          type: 'image',
          data: {
            image_id: block.props.image_id,
            caption: {
              [activeLang]: block.props.caption || '',
              en: ''
            }
          }
        });
      } else if (block.type === 'showcaseBlock') {
        customBlocks.push({
          id: block.id,
          type: 'entity_showcase',
          data: {
            entity_type: block.props.entity_type,
            entity_ids: block.props.entity_ids,
            display_style: block.props.display_style,
            settings: {
              show_price: block.props.show_price !== false
            }
          }
        });
      }
    }

    const hasChanged = JSON.stringify(customBlocks) !== JSON.stringify(value);
    if (hasChanged) {
      onChange(customBlocks);
    }
  };

  const getSlashMenuItems = (editorInstance) => [
    ...getDefaultReactSlashMenuItems(editorInstance),
    {
      title: "Resim (Görsel)",
      onItemClick: () => {
        insertOrUpdateBlockForSlashMenu(editorInstance, {
          type: "imageBlock",
          props: { image_id: null, caption: "" }
        });
      },
      aliases: ["image", "görsel", "resim", "photo"],
      group: "Medya",
      icon: <ImageIcon className="size-4 text-purple-500" />,
      subtext: "Dosya kütüphanesinden görsel yerleştirin"
    },
    {
      title: "Vitrin (Liste)",
      onItemClick: () => {
        insertOrUpdateBlockForSlashMenu(editorInstance, {
          type: "showcaseBlock",
          props: { entity_type: "race", entity_ids: [], display_style: "grid", show_price: true }
        });
      },
      aliases: ["vitrin", "showcase", "yarış", "kategori", "liste"],
      group: "Özel",
      icon: <Layers className="size-4 text-indigo-500" />,
      subtext: "Yarış veya kategori listesi ekleyin"
    }
  ];

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground select-none">
        Editör yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-4 relative w-full blocknote-editor-wrapper">
      <style>{`
        .blocknote-editor-wrapper .bn-editor {
          padding-inline: 0px !important;
        }
      `}</style>
      <BlockNoteView
        editor={editor}
        onChange={handleEditorChange}
        slashMenu={false}
        theme="light"
        className="min-h-[300px] text-foreground bg-transparent"
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) =>
            filterSuggestionItems(getSlashMenuItems(editor), query)
          }
        />
      </BlockNoteView>
    </div>
  );
}
