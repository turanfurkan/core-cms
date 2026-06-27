'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  GripVertical,
  Plus,
  Trash2,
  Heading2,
  FileText,
  Image as ImageIcon,
  Quote,
  Layers,
  ChevronDown,
  ChevronUp,
  Search,
  Check
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import RichTextEditor from '@/components/common/rich-text-editor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 max-h-[140px] overflow-y-auto p-1.5 border border-border/80 rounded-lg bg-muted/10">
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
function SortableBlock({ id, block, activeLang, onUpdate, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const [expanded, setExpanded] = useState(true);

  const blockTypeLabels = {
    heading: 'Başlık (Heading)',
    text: 'Zengin Metin (Text)',
    image: 'Görsel (Image)',
    quote: 'Alıntı (Quote)',
    entity_showcase: 'Vitrin / İlişkilendirme (Showcase)',
  };

  const blockTypeIcons = {
    heading: <Heading2 className="size-4 text-blue-500" />,
    text: <FileText className="size-4 text-emerald-500" />,
    image: <ImageIcon className="size-4 text-purple-500" />,
    quote: <Quote className="size-4 text-amber-500" />,
    entity_showcase: <Layers className="size-4 text-indigo-500" />,
  };

  const handleDataChange = (field, value) => {
    onUpdate(id, {
      ...block.data,
      [field]: value
    });
  };

  const handleLocalizedChange = (field, lang, value) => {
    const currentLocalized = block.data[field] || { tr: '', en: '' };
    onUpdate(id, {
      ...block.data,
      [field]: {
        ...currentLocalized,
        [lang]: value
      }
    });
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`border border-border/80 bg-card overflow-hidden shadow-xs hover:shadow-sm transition-all ${
        isDragging ? 'border-primary' : ''
      }`}
    >
      {/* Block Header */}
      <div className="flex items-center justify-between p-3.5 bg-muted/15 border-b border-border/50 select-none">
        <div className="flex items-center gap-3 min-w-0">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted/50"
          >
            <GripVertical className="size-4" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            {blockTypeIcons[block.type]}
            <span className="font-bold text-xs text-foreground truncate">
              {blockTypeLabels[block.type] || 'Blok'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
            className="size-7 rounded-lg text-muted-foreground hover:bg-muted"
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDelete(id)}
            className="size-7 rounded-lg text-destructive/80 hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Block Content Inputs */}
      {expanded && (
        <div className="p-4 space-y-4 bg-card/30">
          {/* HEADING BLOCK */}
          {block.type === 'heading' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5 md:col-span-1">
                <Label className="text-xs">Seviye (H Level)</Label>
                <Select
                  value={block.data.level || 'h2'}
                  onValueChange={(val) => handleDataChange('level', val)}
                >
                  <SelectTrigger className="h-8.5 text-xs bg-card">
                    <SelectValue placeholder="Seç" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="h2" className="text-xs">H2 (Büyük)</SelectItem>
                    <SelectItem value="h3" className="text-xs">H3 (Orta)</SelectItem>
                    <SelectItem value="h4" className="text-xs">H4 (Küçük)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-3">
                <Label className="text-xs flex items-center gap-1">
                  Başlık Metni ({activeLang.toUpperCase()})
                </Label>
                <Input
                  className="h-8.5 text-xs"
                  value={block.data.text?.[activeLang] || ''}
                  onChange={(e) => handleLocalizedChange('text', activeLang, e.target.value)}
                  placeholder="Başlık metnini yazın..."
                />
              </div>
            </div>
          )}

          {/* TEXT BLOCK */}
          {block.type === 'text' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Metin İçeriği ({activeLang.toUpperCase()})</Label>
              <RichTextEditor
                value={block.data.text?.[activeLang] || ''}
                onChange={(val) => handleLocalizedChange('text', activeLang, val)}
                placeholder="Metin veya paragraf yazın..."
              />
            </div>
          )}

          {/* IMAGE BLOCK */}
          {block.type === 'image' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 md:col-span-1">
                <Label className="text-xs">Görsel Seç</Label>
                <FileUpload
                  value={block.data.image_id ? [block.data.image_id] : []}
                  onChange={(val) => handleDataChange('image_id', val && val.length > 0 ? val[0] : null)}
                  isMultiple={false}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs">Görsel Alt Yazısı / Caption ({activeLang.toUpperCase()})</Label>
                <Textarea
                  rows={2}
                  className="text-xs"
                  value={block.data.caption?.[activeLang] || ''}
                  onChange={(e) => handleLocalizedChange('caption', activeLang, e.target.value)}
                  placeholder="Görsel altına gelecek açıklama metni..."
                />
              </div>
            </div>
          )}

          {/* QUOTE BLOCK */}
          {block.type === 'quote' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Alıntı Söz ({activeLang.toUpperCase()})</Label>
                <Textarea
                  rows={2}
                  className="text-xs"
                  value={block.data.text?.[activeLang] || ''}
                  onChange={(e) => handleLocalizedChange('text', activeLang, e.target.value)}
                  placeholder="Eklemek istediğiniz alıntı cümlesi..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Söyleyen (Yazar/Kaynak)</Label>
                <Input
                  className="h-8.5 text-xs"
                  value={block.data.author || ''}
                  onChange={(e) => handleDataChange('author', e.target.value)}
                  placeholder="Örn: Mustafa Kemal Atatürk"
                />
              </div>
            </div>
          )}

          {/* ENTITY SHOWCASE BLOCK */}
          {block.type === 'entity_showcase' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Veri Türü</Label>
                  <Select
                    value={block.data.entity_type || 'race'}
                    onValueChange={(val) => {
                      onUpdate(id, {
                        ...block.data,
                        entity_type: val,
                        entity_ids: [] // reset chosen items
                      });
                    }}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-card">
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="race" className="text-xs">Yarışlar (Races)</SelectItem>
                      <SelectItem value="category" className="text-xs">Kategoriler (Categories)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tasarım Tipi</Label>
                  <Select
                    value={block.data.display_style || 'grid'}
                    onValueChange={(val) => handleDataChange('display_style', val)}
                  >
                    <SelectTrigger className="h-8.5 text-xs bg-card">
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid" className="text-xs">Grid (Kutular)</SelectItem>
                      <SelectItem value="carousel" className="text-xs">Carousel (Sürgülü)</SelectItem>
                      <SelectItem value="list" className="text-xs">List (Liste)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 flex items-center justify-between p-3 rounded-lg border border-border bg-card/50 mt-4.5">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-foreground block">Fiyat Gösterilsin mi?</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={block.data.settings?.show_price !== false}
                    onChange={(e) => {
                      const settings = block.data.settings || {};
                      handleDataChange('settings', { ...settings, show_price: e.target.checked });
                    }}
                    className="size-4 text-primary bg-card border-border rounded"
                  />
                </div>
              </div>

              {/* Picker Component */}
              <div className="space-y-1">
                <Label className="text-xs">İlişkili Kayıtları Seçin</Label>
                <EntityPicker
                  entityType={block.data.entity_type || 'race'}
                  selectedIds={block.data.entity_ids || []}
                  onChange={(newIds) => handleDataChange('entity_ids', newIds)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// Main Component
export default function BlockEditor({ value = [], onChange, activeLang = 'tr' }) {
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [blockFilter, setBlockFilter] = useState('');

  const blockOptions = [
    { type: 'text', label: 'Yazı (Metin)', icon: <FileText className="size-4 text-emerald-500" />, desc: 'Zengin metin paragrafları ve içerik ekleyin.' },
    { type: 'heading', label: 'Başlık', icon: <Heading2 className="size-4 text-blue-500" />, desc: 'Büyük, orta veya küçük başlıklar ekleyin.' },
    { type: 'image', label: 'Resim (Görsel)', icon: <ImageIcon className="size-4 text-purple-500" />, desc: 'Medya kütüphanesinden görsel yerleştirin.' },
    { type: 'quote', label: 'Alıntı', icon: <Quote className="size-4 text-amber-500" />, desc: 'Önemli alıntılar ve söyleyen bilgisi.' },
    { type: 'entity_showcase', label: 'Vitrin (Yarış/Kategori)', icon: <Layers className="size-4 text-indigo-500" />, desc: 'Dinamik yarış veya kategori listeleri ekleyin.' },
  ];

  const filteredOptions = blockOptions.filter(opt => 
    opt.label.toLowerCase().includes(blockFilter.toLowerCase())
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = value.findIndex((b) => b.id === active.id);
    const newIndex = value.findIndex((b) => b.id === over.id);

    const reordered = arrayMove(value, oldIndex, newIndex);
    onChange(reordered);
  };

  const handleAddBlock = (type) => {
    const newBlock = {
      id: `block_${type}_${Date.now()}`,
      type,
      data: type === 'entity_showcase'
        ? { entity_type: 'race', entity_ids: [], display_style: 'grid', settings: { show_price: true } }
        : type === 'image'
        ? { image_id: null, caption: { tr: '', en: '' } }
        : type === 'heading'
        ? { level: 'h2', text: { tr: '', en: '' } }
        : type === 'quote'
        ? { text: { tr: '', en: '' }, author: '' }
        : { text: { tr: '', en: '' } }
    };

    onChange([...value, newBlock]);
  };

  const handleUpdateBlock = (id, updatedData) => {
    const updated = value.map((block) => {
      if (block.id !== id) return block;
      return {
        ...block,
        data: updatedData
      };
    });
    onChange(updated);
  };

  const handleDeleteBlock = (id) => {
    onChange(value.filter((b) => b.id !== id));
  };

  return (
    <div className="space-y-6 relative">
      {/* Block List Sorting Context */}
      {value.length === 0 ? (
        <div className="relative py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowBlockMenu(!showBlockMenu)}
            className="size-8 rounded-full border border-border/80 bg-background hover:bg-muted flex items-center justify-center text-foreground shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="size-4" />
          </button>
          <span
            onClick={() => setShowBlockMenu(!showBlockMenu)}
            className="text-sm text-muted-foreground/60 select-none cursor-pointer hover:text-muted-foreground/80 transition-colors"
          >
            Başlamak için + tuşuna basarak yeni bir blok ekleyin veya TAB tuşuna basın.
          </span>

          {/* Popover Block Picker Overlay */}
          {showBlockMenu && (
            <div className="absolute z-50 left-0 top-12 w-72 bg-card border border-border shadow-md rounded-xl overflow-hidden py-1">
              <div className="p-2 border-b border-border/40">
                <Input
                  placeholder="Filter"
                  value={blockFilter}
                  onChange={(e) => setBlockFilter(e.target.value)}
                  className="h-8 text-xs bg-muted/10 border-border"
                  autoFocus
                />
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-border/30">
                {filteredOptions.map((opt) => (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => {
                      handleAddBlock(opt.type);
                      setShowBlockMenu(false);
                      setBlockFilter('');
                    }}
                    className="w-full flex items-start gap-3 px-3.5 py-2.5 hover:bg-muted text-left transition-colors cursor-pointer"
                  >
                    <span className="mt-0.5 p-1.5 bg-muted/50 rounded-md border border-border/40 shrink-0">{opt.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground">{opt.label}</p>
                      <p className="text-[10px] text-muted-foreground/80 leading-normal line-clamp-2 mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                ))}
                {filteredOptions.length === 0 && (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Blok bulunamadı.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={value.map(b => b.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {value.map((block) => (
                  <SortableBlock
                    key={block.id}
                    id={block.id}
                    block={block}
                    activeLang={activeLang}
                    onUpdate={handleUpdateBlock}
                    onDelete={handleDeleteBlock}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Add block inline button at the bottom of the list */}
          <div className="relative pt-4 flex justify-start">
            <button
              type="button"
              onClick={() => setShowBlockMenu(!showBlockMenu)}
              className="size-8 rounded-full border border-border/80 bg-background hover:bg-muted flex items-center justify-center text-foreground shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="size-4" />
            </button>

            {/* Popover Block Picker Overlay */}
            {showBlockMenu && (
              <div className="absolute z-50 left-0 top-12 w-72 bg-card border border-border shadow-md rounded-xl overflow-hidden py-1">
                <div className="p-2 border-b border-border/40">
                  <Input
                    placeholder="Filter"
                    value={blockFilter}
                    onChange={(e) => setBlockFilter(e.target.value)}
                    className="h-8 text-xs bg-muted/10 border-border"
                    autoFocus
                  />
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-border/30">
                  {filteredOptions.map((opt) => (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => {
                        handleAddBlock(opt.type);
                        setShowBlockMenu(false);
                        setBlockFilter('');
                      }}
                      className="w-full flex items-start gap-3 px-3.5 py-2.5 hover:bg-muted text-left transition-colors cursor-pointer"
                    >
                      <span className="mt-0.5 p-1.5 bg-muted/50 rounded-md border border-border/40 shrink-0">{opt.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground">{opt.label}</p>
                        <p className="text-[10px] text-muted-foreground/80 leading-normal line-clamp-2 mt-0.5">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                  {filteredOptions.length === 0 && (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      Blok bulunamadı.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
