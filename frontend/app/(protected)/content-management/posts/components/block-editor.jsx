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
  Check
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
      return (
        <div className="border border-border/60 rounded-xl p-4 bg-muted/5 space-y-3 max-w-2xl relative my-2 w-full" contentEditable={false}>
          <div className="flex items-center gap-3">
            <div className="w-32">
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
                <SelectTrigger className="h-8 text-xs bg-card">
                  <SelectValue placeholder="Veri Türü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="race" className="text-xs">Yarışlar</SelectItem>
                  <SelectItem value="category" className="text-xs">Kategoriler</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-32">
              <Select
                value={block.props.display_style || 'grid'}
                onValueChange={(val) => {
                  editor.updateBlock(block, {
                    props: { ...block.props, display_style: val }
                  });
                }}
              >
                <SelectTrigger className="h-8 text-xs bg-card">
                  <SelectValue placeholder="Tasarım" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid" className="text-xs">Kutu Izgarası</SelectItem>
                  <SelectItem value="carousel" className="text-xs">Kaydırıcı (Carousel)</SelectItem>
                  <SelectItem value="list" className="text-xs">Liste</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 select-none ml-auto text-xs font-semibold text-muted-foreground">
              <span>Fiyat Gösterilsin</span>
              <input
                type="checkbox"
                checked={block.props.show_price !== false}
                onChange={(e) => {
                  editor.updateBlock(block, {
                    props: { ...block.props, show_price: e.target.checked }
                  });
                }}
                className="size-4 text-primary bg-card border-border rounded"
              />
            </div>
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

  const editor = useCreateBlockNote({
    schema
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
      if (block.type === 'paragraph' || block.type === 'bulletListItem' || block.type === 'numberedListItem') {
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
