'use client';

import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  RiCheckboxCircleFill,
  RiErrorWarningFill,
} from '@remixicon/react';
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  FolderOpen,
  GripVertical,
  Link as LinkIcon,
  LoaderCircleIcon,
  Plus,
  Save,
  Trash2,
  X,
  Indent,
  Outdent,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RightDrawer } from '@/components/common/right-drawer';
import { Sortable, SortableItem, SortableItemHandle } from '@/components/ui/sortable';
import { cn } from '@/lib/utils';

// Schema for the Navigation settings (Name, Key, Active)
const NavigationSettingsSchema = z.object({
  name: z.string().min(1, 'Menu Name is required').max(255),
  key: z
    .string()
    .min(1, 'Menu Key is required')
    .max(255)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Key must only contain alphanumeric characters, underscores, and hyphens'),
  is_active: z.boolean(),
});

// Schema for adding/editing an individual menu item
const MenuItemSchema = z.object({
  titleTr: z.string().min(1, 'Turkish Title is required').max(255),
  titleEn: z.string().max(255).optional().or(z.literal('')),
  type: z.enum(['custom', 'content']).default('custom'),
  url: z.string().max(2000).nullable().optional(),
  target: z.enum(['_self', '_blank']).default('_self'),
  is_active: z.boolean().default(true),
});

export default function MenuBuilder({ navigation }) {
  const queryClient = useQueryClient();

  // Settings form
  const settingsForm = useForm({
    resolver: zodResolver(NavigationSettingsSchema),
    defaultValues: {
      name: navigation.name || '',
      key: navigation.key || '',
      is_active: navigation.is_active ?? true,
    },
  });

  // State of the menu items hierarchy tree
  const [items, setItems] = useState(() => {
    // Generate simple ID for nodes if they don't have one (for local key mapping)
    const mapNodes = (nodes) => {
      return (nodes || []).map((node) => ({
        ...node,
        id: node.id || `temp_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
        children: mapNodes(node.children),
      }));
    };
    return mapNodes(navigation.items);
  });

  // Drawer, Modal & Language tab states
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [addLang, setAddLang] = useState('tr');
  const [editLang, setEditLang] = useState('tr');
  const [collapsedItems, setCollapsedItems] = useState({});
  const [itemToDelete, setItemToDelete] = useState(null);

  // Add Item form state
  const addItemForm = useForm({
    resolver: zodResolver(MenuItemSchema),
    defaultValues: {
      titleTr: '',
      titleEn: '',
      type: 'custom',
      url: '',
      target: '_self',
      is_active: true,
    },
  });

  // Edit Item modal state
  const [editingItem, setEditingItem] = useState(null);
  const editItemForm = useForm({
    resolver: zodResolver(MenuItemSchema),
  });

  // Fetch active CMS content types
  const { data: contentTypes = [] } = useQuery({
    queryKey: ['admin-content-types'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/content-types');
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    },
  });

  // Fetch entries for all content types
  const [contentEntries, setContentEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  useEffect(() => {
    if (contentTypes.length > 0) {
      const fetchAllEntries = async () => {
        setLoadingEntries(true);
        try {
          const allEntries = [];
          await Promise.all(
            contentTypes.map(async (type) => {
              try {
                const res = await apiFetch(`/api/admin/content-types/${type.id}/entries`);
                if (res.ok) {
                  const json = await res.json();
                  const data = json.data || [];
                  data.forEach((entry) => {
                    allEntries.push({
                      ...entry,
                      contentTypeSlug: type.slug,
                      contentTypeName: type.name,
                    });
                  });
                }
              } catch (e) {
                console.error(e);
              }
            })
          );
          setContentEntries(allEntries);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingEntries(false);
        }
      };
      fetchAllEntries();
    }
  }, [contentTypes]);

  // Tab auto-switching on validation errors
  const addTrError = addItemForm.formState.errors.titleTr;
  const addEnError = addItemForm.formState.errors.titleEn;
  useEffect(() => {
    if (addTrError && !addEnError) {
      setAddLang('tr');
    } else if (addEnError && !addTrError) {
      setAddLang('en');
    }
  }, [addTrError, addEnError]);

  const editTrError = editItemForm.formState.errors.titleTr;
  const editEnError = editItemForm.formState.errors.titleEn;
  useEffect(() => {
    if (editTrError && !editEnError) {
      setEditLang('tr');
    } else if (editEnError && !editTrError) {
      setEditLang('en');
    }
  }, [editTrError, editEnError]);

  // Mutation for saving navigation and items
  const mutation = useMutation({
    mutationFn: async (values) => {
      // Map tree structure to clean payload format for DTO
      const cleanNodes = (nodes) => {
        return nodes.map((node) => ({
          title: typeof node.title === 'string' ? { tr: node.title, en: node.title } : node.title,
          type: node.type,
          url: node.url || '',
          target: node.target,
          is_active: node.is_active,
          children: cleanNodes(node.children || []),
        }));
      };

      const payload = {
        name: values.name,
        key: values.key,
        is_active: values.is_active,
        items: cleanNodes(items),
      };

      const response = await apiFetch(`/api/user-management/navigations/${navigation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }

      return response.json();
    },
    onSuccess: () => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="success">
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Menu structure saved successfully</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
      queryClient.invalidateQueries({ queryKey: ['user-navigation', String(navigation.id)] });
      queryClient.invalidateQueries({ queryKey: ['user-navigations'] });
    },
    onError: (error) => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive">
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{error.message}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  // Helper functions for tree manipulation
  const copyTree = () => JSON.parse(JSON.stringify(items));

  const findParentAndIndex = (list, targetId) => {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === targetId) {
        return { parentList: list, index: i, parentNode: null };
      }
      if (list[i].children && list[i].children.length > 0) {
        const result = findParentAndIndex(list[i].children, targetId);
        if (result) {
          return { ...result, parentNode: list[i] };
        }
      }
    }
    return null;
  };

  const handleMoveUp = (targetId) => {
    const tree = copyTree();
    const result = findParentAndIndex(tree, targetId);
    if (result && result.index > 0) {
      const { parentList, index } = result;
      const temp = parentList[index];
      parentList[index] = parentList[index - 1];
      parentList[index - 1] = temp;
      setItems(tree);
    }
  };

  const handleMoveDown = (targetId) => {
    const tree = copyTree();
    const result = findParentAndIndex(tree, targetId);
    if (result) {
      const { parentList, index } = result;
      if (index < parentList.length - 1) {
        const temp = parentList[index];
        parentList[index] = parentList[index + 1];
        parentList[index + 1] = temp;
        setItems(tree);
      }
    }
  };

  const handleIndent = (targetId) => {
    const tree = copyTree();
    const result = findParentAndIndex(tree, targetId);
    if (result && result.index > 0) {
      const { parentList, index } = result;
      const siblingAbove = parentList[index - 1];
      const node = parentList[index];
      parentList.splice(index, 1);
      if (!siblingAbove.children) siblingAbove.children = [];
      siblingAbove.children.push(node);
      setItems(tree);
    }
  };

  const handleOutdent = (targetId) => {
    const tree = copyTree();
    const result = findParentAndIndex(tree, targetId);
    if (result && result.parentNode) {
      const parentResult = findParentAndIndex(tree, result.parentNode.id);
      if (parentResult) {
        const node = result.parentList[result.index];
        result.parentList.splice(result.index, 1);
        parentResult.parentList.splice(parentResult.index + 1, 0, node);
        setItems(tree);
      }
    }
  };

  const handleDeleteItem = (targetId) => {
    const tree = copyTree();
    const result = findParentAndIndex(tree, targetId);
    if (result) {
      const { parentList, index } = result;
      parentList.splice(index, 1);
      setItems(tree);
    }
  };

  const handleAddMenuItem = (values) => {
    const newItem = {
      id: `temp_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
      title: {
        tr: values.titleTr,
        en: values.titleEn || values.titleTr,
      },
      type: values.type,
      url: values.url || '',
      target: values.target,
      is_active: values.is_active,
      children: [],
    };
    setItems([...items, newItem]);
    addItemForm.reset({
      titleTr: '',
      titleEn: '',
      type: 'custom',
      url: '',
      target: '_self',
      is_active: true,
    });
    toast.success('Item added to menu list. Don\'t forget to Save Changes!');
  };

  const handleOpenEditItem = (item) => {
    setEditingItem(item);
    editItemForm.reset({
      titleTr: typeof item.title === 'string' ? item.title : item.title.tr || '',
      titleEn: typeof item.title === 'string' ? item.title : item.title.en || '',
      type: item.type || 'custom',
      url: item.url || '',
      target: item.target || '_self',
      is_active: item.is_active ?? true,
    });
  };

  const handleSaveEditItem = (values) => {
    const tree = copyTree();
    const updateNode = (list) => {
      for (let i = 0; i < list.length; i++) {
        if (list[i].id === editingItem.id) {
          list[i].title = {
            tr: values.titleTr,
            en: values.titleEn || values.titleTr,
          };
          list[i].type = values.type;
          list[i].url = values.url || '';
          list[i].target = values.target;
          list[i].is_active = values.is_active;
          return true;
        }
        if (list[i].children && list[i].children.length > 0) {
          const updated = updateNode(list[i].children);
          if (updated) return true;
        }
      }
      return false;
    };
    updateNode(tree);
    setItems(tree);
    setEditingItem(null);
  };

  const onSubmit = (settingsValues) => {
    mutation.mutate(settingsValues);
  };

  const toggleCollapse = (id) => {
    setCollapsedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const updateListAtParent = (parentId, newList) => {
    const tree = copyTree();
    if (!parentId) {
      setItems(newList);
      return;
    }
    const updateNode = (list) => {
      for (let i = 0; i < list.length; i++) {
        if (list[i].id === parentId) {
          list[i].children = newList;
          return true;
        }
        if (list[i].children && list[i].children.length > 0) {
          const updated = updateNode(list[i].children);
          if (updated) return true;
        }
      }
      return false;
    };
    updateNode(tree);
    setItems(tree);
  };

  // Helper to recursively render tree items with indents
  const renderMenuItemsList = (list, depth = 0, parentNode = null) => {
    if (!list || list.length === 0) return null;

    return (
      <Sortable
        value={list}
        onValueChange={(newList) => updateListAtParent(parentNode?.id, newList)}
        getItemValue={(item) => item.id}
        className="space-y-2"
      >
        {list.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === list.length - 1;
          const hasSiblingAbove = index > 0;
          const hasParent = parentNode !== null;
          const hasChildren = item.children && item.children.length > 0;
          const isCollapsed = collapsedItems[item.id];

          const titleDisplay =
            typeof item.title === 'string'
              ? item.title
              : `${item.title?.tr || ''} (${item.title?.en || ''})`;

          return (
            <SortableItem key={item.id} value={item.id} className="w-full relative">
              {/* Branching Guide Lines */}
              {depth > 0 && (
                <>
                  {/* Vertical Line */}
                  <div
                    className={cn(
                      "absolute left-[-10px] w-[1px] bg-border/60 z-10",
                      isLast ? "top-0 h-[22px]" : "top-0 bottom-0"
                    )}
                  />
                  {/* Horizontal Line */}
                  <div className="absolute left-[-10px] top-[22px] w-2.5 h-[1px] bg-border/60 z-10" />
                </>
              )}

              {/* Menu Item Box */}
              <div
                className="group relative flex items-center justify-between border border-border/40 py-2.5 px-3 hover:bg-slate-50 dark:hover:bg-slate-900/20 transition-all rounded-md bg-card"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Drag Handle */}
                  <SortableItemHandle className="flex items-center shrink-0">
                    <GripVertical className="size-4 text-muted-foreground/40 cursor-grab" />
                  </SortableItemHandle>

                  {/* Accordion Expand/Collapse Trigger */}
                  {hasChildren ? (
                    <button
                      type="button"
                      className="p-1 hover:bg-muted rounded text-muted-foreground transition-transform shrink-0"
                      onClick={() => toggleCollapse(item.id)}
                    >
                      <ChevronRight
                        className={cn(
                          "size-3.5 transition-transform duration-200",
                          !isCollapsed && "rotate-90"
                        )}
                      />
                    </button>
                  ) : (
                    <span className="w-6 shrink-0" /> // Spacer
                  )}

                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {item.type === 'custom' ? (
                      <LinkIcon className="size-4 text-primary shrink-0" />
                    ) : (
                      <FolderOpen className="size-4 text-success shrink-0" />
                    )}
                    <span className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate max-w-[150px] sm:max-w-[240px]">
                      {titleDisplay}
                    </span>
                    <span className="text-xs text-muted-foreground hidden md:inline truncate max-w-xs">
                      {item.url || '#'}
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 ms-2 shrink-0">
                    {item.target === '_blank' && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                        New Tab
                      </Badge>
                    )}
                    {!item.is_active && (
                      <Badge variant="dim" className="text-[10px] py-0 px-1.5 h-4">
                        Disabled
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Tree manipulation controls */}
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                  {/* Indent (Make Submenu) */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => handleIndent(item.id)}
                    disabled={!hasSiblingAbove}
                    title="Make Submenu"
                  >
                    <Indent className="size-3.5" />
                  </Button>

                  {/* Outdent (Promote Level) */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => handleOutdent(item.id)}
                    disabled={!hasParent}
                    title="Promote Level"
                  >
                    <Outdent className="size-3.5" />
                  </Button>

                  {/* Edit details */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-primary hover:text-primary-active"
                    onClick={() => handleOpenEditItem(item)}
                    title="Edit Details"
                  >
                    <Edit2 className="size-3.5" />
                  </Button>

                  {/* Delete item */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive-active"
                    onClick={() => setItemToDelete(item)}
                    title="Delete Link"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* Children nodes recursive rendering */}
              {!isCollapsed && hasChildren && (
                <div className="pl-[20px] relative space-y-2 mt-2">
                  {renderMenuItemsList(item.children, depth + 1, item)}
                </div>
              )}
            </SortableItem>
          );
        })}
      </Sortable>
    );
  };

  return (
    <div className="space-y-6">
      {/* Visual form wrapper */}
      <form onSubmit={settingsForm.handleSubmit(onSubmit)}>
        {/* Menu Settings Toolbar - STICKY */}
        <div className="sticky top-0 z-30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-background/95 backdrop-blur-md rounded-lg p-5 border border-border/50 mb-6 shadow-sm">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">Menu Management</h3>
            <p className="text-muted-foreground text-xs">Configure menu settings and layout items list.</p>
          </div>
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={mutation.status === 'pending'}
            >
              {mutation.status === 'pending' ? (
                <LoaderCircleIcon className="animate-spin size-4 mr-2" />
              ) : (
                <Save className="size-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* General menu settings */}
            <Card>
              <CardHeader>
                <CardTitle>Menu Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="menu-name">Menu Name</Label>
                  <Input
                    id="menu-name"
                    placeholder="e.g. Primary Sidebar"
                    {...settingsForm.register('name')}
                  />
                  {settingsForm.formState.errors.name && (
                    <p className="text-xs text-red-500">{settingsForm.formState.errors.name.message}</p>
                  )}
                </div>

                {/* Key */}
                <div className="space-y-1.5">
                  <Label htmlFor="menu-key">Menu Identifier Key</Label>
                  <Input
                    id="menu-key"
                    placeholder="e.g. primary_sidebar"
                    {...settingsForm.register('key')}
                  />
                  {settingsForm.formState.errors.key && (
                    <p className="text-xs text-red-500">{settingsForm.formState.errors.key.message}</p>
                  )}
                </div>

                {/* Status Toggle */}
                <div className="flex items-center justify-between border rounded-md p-3.5 bg-accent/30 mt-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="menu-active" className="text-sm font-semibold">Active Status</Label>
                    <p className="text-xs text-muted-foreground">Toggle visibility status.</p>
                  </div>
                  <Switch
                    id="menu-active"
                    checked={settingsForm.watch('is_active')}
                    onCheckedChange={(val) => settingsForm.setValue('is_active', val)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tree Builder list */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="border-b border-border flex flex-row items-center justify-between py-4">
                <CardTitle>Menu Structure Tree</CardTitle>
                <Button
                  type="button"
                  size="sm"
                  className="h-8"
                  onClick={() => setIsAddDrawerOpen(true)}
                >
                  <Plus className="size-3.5 mr-1.5" /> Yeni Link Ekle
                </Button>
              </CardHeader>
              <CardContent className="py-6">
                <div className="space-y-2 min-h-[300px] border border-dashed rounded-lg p-4 bg-slate-50/20">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                      <GripVertical className="size-10 text-muted-foreground/35" />
                      <p className="font-semibold text-gray-500">Menu list is currently empty</p>
                      <p className="text-xs text-muted-foreground">Click "Yeni Link Ekle" to add links and build your menu hierarchy.</p>
                    </div>
                  ) : (
                    renderMenuItemsList(items)
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Add Item Drawer */}
      <RightDrawer
        open={isAddDrawerOpen}
        onOpenChange={setIsAddDrawerOpen}
        title="Yeni Link Ekle"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddDrawerOpen(false)}
            >
              İptal
            </Button>
            <Button
              type="button"
              onClick={addItemForm.handleSubmit((values) => {
                handleAddMenuItem(values);
                setIsAddDrawerOpen(false);
              })}
            >
              Ekle
            </Button>
          </div>
        }
      >
        <div className="space-y-4 pt-2.5">
          {/* Language tabs */}
          <div className="flex border-b border-border mb-2">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
                addLang === 'tr'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setAddLang('tr')}
            >
              Türkçe
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
                addLang === 'en'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setAddLang('en')}
            >
              English
            </button>
          </div>

          {/* Title based on selected tab */}
          {addLang === 'tr' ? (
            <div className="space-y-1.5">
              <Label htmlFor="item-title-tr">Başlık (Türkçe)</Label>
              <Input
                id="item-title-tr"
                placeholder="Örn. Anasayfa"
                {...addItemForm.register('titleTr')}
              />
              {addItemForm.formState.errors.titleTr && (
                <p className="text-xs text-red-500">{addItemForm.formState.errors.titleTr.message}</p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="item-title-en">Title (English) <span className="text-muted-foreground font-normal text-xs">(İsteğe bağlı)</span></Label>
              <Input
                id="item-title-en"
                placeholder="e.g. Home"
                {...addItemForm.register('titleEn')}
              />
              {addItemForm.formState.errors.titleEn && (
                <p className="text-xs text-red-500">{addItemForm.formState.errors.titleEn.message}</p>
              )}
            </div>
          )}

          {/* Link Type Selector */}
          <div className="space-y-1.5">
            <Label htmlFor="item-type">Link Type</Label>
            <select
              id="item-type"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              {...addItemForm.register('type')}
            >
              <option value="custom">Custom Link</option>
              <option value="content">Content Route</option>
            </select>
          </div>

          {/* Content Route Dynamic Dropdown Selector */}
          {addItemForm.watch('type') === 'content' && (
            <div className="space-y-1.5 transition-all">
              <Label htmlFor="item-content-route">Content Page/Category</Label>
              {loadingEntries ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircleIcon className="size-4 animate-spin" />
                  Loading contents...
                </div>
              ) : (
                <select
                  id="item-content-route"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onChange={(e) => {
                    const entryId = e.target.value;
                    const selectedEntry = contentEntries.find((entry) => String(entry.id) === entryId);
                    if (selectedEntry) {
                      const titleTr = selectedEntry.data?.title?.tr || selectedEntry.title?.tr || selectedEntry.data?.title || selectedEntry.title || '';
                      const titleEn = selectedEntry.data?.title?.en || selectedEntry.title?.en || selectedEntry.data?.title || selectedEntry.title || '';
                      const slugTr = selectedEntry.data?.slug?.tr || selectedEntry.slug?.tr || selectedEntry.data?.slug || selectedEntry.slug || '';
                      const slugEn = selectedEntry.data?.slug?.en || selectedEntry.slug?.en || selectedEntry.data?.slug || selectedEntry.slug || '';
                      const finalSlug = slugTr || slugEn || '';
                      const isPage = ['pages', 'page'].includes(selectedEntry.contentTypeSlug.toLowerCase());
                      const finalUrl = isPage ? `/${finalSlug}` : `/${selectedEntry.contentTypeSlug}/${finalSlug}`;

                      addItemForm.setValue('url', finalUrl);
                      const finalTitleTr = typeof titleTr === 'object' ? titleTr.tr || titleTr.en : titleTr;
                      const finalTitleEn = typeof titleEn === 'object' ? titleEn.en || titleEn.tr : titleEn;
                      if (finalTitleTr) addItemForm.setValue('titleTr', finalTitleTr);
                      if (finalTitleEn) addItemForm.setValue('titleEn', finalTitleEn || finalTitleTr);
                      if (finalTitleTr && !finalTitleEn) addItemForm.setValue('titleEn', finalTitleTr);
                    }
                  }}
                >
                  <option value="">-- Select content --</option>
                  {Object.entries(
                    contentEntries.reduce((groups, entry) => {
                      const groupName = entry.contentTypeName || 'Other';
                      if (!groups[groupName]) groups[groupName] = [];
                      groups[groupName].push(entry);
                      return groups;
                    }, {})
                  ).map(([groupName, entries]) => (
                    <optgroup key={groupName} label={groupName}>
                      {entries.map((entry) => {
                        const titleTr = entry.data?.title?.tr || entry.title?.tr || entry.data?.title || entry.title || `Entry #${entry.id}`;
                        const titleDisplay = typeof titleTr === 'object' ? titleTr.tr || titleTr.en : titleTr;
                        return (
                          <option key={entry.id} value={entry.id}>
                            {titleDisplay}
                          </option>
                        );
                      })}
                    </optgroup>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* URL Input */}
          <div className="space-y-1.5">
            <Label htmlFor="item-url">Link URL</Label>
            <Input
              id="item-url"
              placeholder="e.g. /home or https://..."
              disabled={addItemForm.watch('type') === 'content'}
              {...addItemForm.register('url')}
            />
          </div>

          {/* Target Selector */}
          <div className="space-y-1.5">
            <Label htmlFor="item-target">Target</Label>
            <select
              id="item-target"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              {...addItemForm.register('target')}
            >
              <option value="_self">Same Window (_self)</option>
              <option value="_blank">New Window (_blank)</option>
            </select>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between border rounded-md p-3.5 bg-accent/30 mt-2">
            <div className="space-y-0.5">
              <Label htmlFor="item-active" className="text-sm font-semibold">Active Link</Label>
            </div>
            <Switch
              id="item-active"
              checked={addItemForm.watch('is_active')}
              onCheckedChange={(val) => addItemForm.setValue('is_active', val)}
            />
          </div>
        </div>
      </RightDrawer>

      {/* Edit Item Details Dialog Modal */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Menu Link Details</DialogTitle>
            </DialogHeader>
            <DialogBody className="space-y-4 pt-2.5">
              {/* Language tabs */}
              <div className="flex border-b border-border mb-2">
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
                    editLang === 'tr'
                      ? 'border-primary text-primary font-semibold'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setEditLang('tr')}
                >
                  Türkçe
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
                    editLang === 'en'
                      ? 'border-primary text-primary font-semibold'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setEditLang('en')}
                >
                  English
                </button>
              </div>

              {/* Localized Title field */}
              {editLang === 'tr' ? (
                <div className="space-y-1.5">
                  <Label htmlFor="edit-title-tr">Başlık (Türkçe)</Label>
                  <Input
                    id="edit-title-tr"
                    placeholder="Örn. Anasayfa"
                    {...editItemForm.register('titleTr')}
                  />
                  {editItemForm.formState.errors.titleTr && (
                    <p className="text-xs text-red-500">{editItemForm.formState.errors.titleTr.message}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="edit-title-en">Title (English) <span className="text-muted-foreground font-normal text-xs">(İsteğe bağlı)</span></Label>
                  <Input
                    id="edit-title-en"
                    placeholder="e.g. Home"
                    {...editItemForm.register('titleEn')}
                  />
                  {editItemForm.formState.errors.titleEn && (
                    <p className="text-xs text-red-500">{editItemForm.formState.errors.titleEn.message}</p>
                  )}
                </div>
              )}

              {/* Link Type */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-type">Link Type</Label>
                <select
                  id="edit-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  {...editItemForm.register('type')}
                >
                  <option value="custom">Custom Link</option>
                  <option value="content">Content Route</option>
                </select>
              </div>

              {/* Content Route Dynamic Dropdown Selector */}
              {editItemForm.watch('type') === 'content' && (
                <div className="space-y-1.5 transition-all">
                  <Label htmlFor="edit-content-route">Content Page/Category</Label>
                  {loadingEntries ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <LoaderCircleIcon className="size-4 animate-spin" />
                      Loading contents...
                    </div>
                  ) : (
                    <select
                      id="edit-content-route"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onChange={(e) => {
                        const entryId = e.target.value;
                        const selectedEntry = contentEntries.find((entry) => String(entry.id) === entryId);
                        if (selectedEntry) {
                          const titleTr = selectedEntry.data?.title?.tr || selectedEntry.title?.tr || selectedEntry.data?.title || selectedEntry.title || '';
                          const titleEn = selectedEntry.data?.title?.en || selectedEntry.title?.en || selectedEntry.data?.title || selectedEntry.title || '';
                          const slugTr = selectedEntry.data?.slug?.tr || selectedEntry.slug?.tr || selectedEntry.data?.slug || selectedEntry.slug || '';
                          const slugEn = selectedEntry.data?.slug?.en || selectedEntry.slug?.en || selectedEntry.data?.slug || selectedEntry.slug || '';
                          const finalSlug = slugTr || slugEn || '';
                          const isPage = ['pages', 'page'].includes(selectedEntry.contentTypeSlug.toLowerCase());
                          const finalUrl = isPage ? `/${finalSlug}` : `/${selectedEntry.contentTypeSlug}/${finalSlug}`;

                          editItemForm.setValue('url', finalUrl);
                          const finalTitleTr = typeof titleTr === 'object' ? titleTr.tr || titleTr.en : titleTr;
                          const finalTitleEn = typeof titleEn === 'object' ? titleEn.en || titleEn.tr : titleEn;
                          if (finalTitleTr) editItemForm.setValue('titleTr', finalTitleTr);
                          if (finalTitleEn) editItemForm.setValue('titleEn', finalTitleEn || finalTitleTr);
                          if (finalTitleTr && !finalTitleEn) editItemForm.setValue('titleEn', finalTitleTr);
                        }
                      }}
                    >
                      <option value="">-- Select content --</option>
                      {Object.entries(
                        contentEntries.reduce((groups, entry) => {
                          const groupName = entry.contentTypeName || 'Other';
                          if (!groups[groupName]) groups[groupName] = [];
                          groups[groupName].push(entry);
                          return groups;
                        }, {})
                      ).map(([groupName, entries]) => (
                        <optgroup key={groupName} label={groupName}>
                          {entries.map((entry) => {
                            const titleTr = entry.data?.title?.tr || entry.title?.tr || entry.data?.title || entry.title || `Entry #${entry.id}`;
                            const titleDisplay = typeof titleTr === 'object' ? titleTr.tr || titleTr.en : titleTr;
                            return (
                              <option key={entry.id} value={entry.id}>
                                {titleDisplay}
                              </option>
                            );
                          })}
                        </optgroup>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* URL */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-url">Link URL</Label>
                <Input
                  id="edit-url"
                  placeholder="e.g. /home"
                  disabled={editItemForm.watch('type') === 'content'}
                  {...editItemForm.register('url')}
                />
              </div>

              {/* Target Selector */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-target">Target</Label>
                <select
                  id="edit-target"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  {...editItemForm.register('target')}
                >
                  <option value="_self">Same Window (_self)</option>
                  <option value="_blank">New Window (_blank)</option>
                </select>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between border rounded-md p-3.5 bg-accent/30 mt-2">
                <div className="space-y-0.5">
                  <Label htmlFor="edit-active" className="text-sm font-semibold">Active Link</Label>
                </div>
                <Switch
                  id="edit-active"
                  checked={editItemForm.watch('is_active')}
                  onCheckedChange={(val) => editItemForm.setValue('is_active', val)}
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={editItemForm.handleSubmit(handleSaveEditItem)}>
                Update Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {itemToDelete && (
        <Dialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <RiErrorWarningFill className="size-5" />
                Delete Menu Item
              </DialogTitle>
            </DialogHeader>
            <DialogBody>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <strong>{typeof itemToDelete.title === 'string' ? itemToDelete.title : (itemToDelete.title?.tr || itemToDelete.title?.en)}</strong>?
              </p>
              {itemToDelete.children && itemToDelete.children.length > 0 && (
                <p className="text-xs text-red-500 font-semibold mt-2">
                  Warning: This will also delete all of its {itemToDelete.children.length} nested child item(s)!
                </p>
              )}
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setItemToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  handleDeleteItem(itemToDelete.id);
                  setItemToDelete(null);
                }}
              >
                Confirm Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
