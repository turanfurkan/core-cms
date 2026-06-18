'use client';

import { useEffect, useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Folder, FolderOpen, ChevronRight, ChevronDown, Check, LoaderCircleIcon, ArrowRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';

export default function MoveItemDialog({ open, closeDialog, item, itemType, currentFolderId }) {
  const queryClient = useQueryClient();
  const [selectedFolderId, setSelectedFolderId] = useState('root');
  const [expandedFolders, setExpandedFolders] = useState({});

  // Fetch all folders to construct the tree locally
  const { data: allFolders, isLoading } = useQuery({
    queryKey: ['admin-media-folders-all'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/media/folders');
      if (!res.ok) throw new Error('Klasörler yüklenemedi.');
      const json = await res.json();
      return json.data || [];
    },
    enabled: open,
  });

  // Toggle expand / collapse of tree nodes
  const toggleExpand = (folderId, e) => {
    e.stopPropagation();
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  // Construct hierarchy from flat array of folders
  const folderTree = useMemo(() => {
    if (!allFolders) return [];

    // Map by id for easy access
    const map = {};
    allFolders.forEach((f) => {
      map[f.id] = { ...f, children: [] };
    });

    const roots = [];
    allFolders.forEach((f) => {
      const mapped = map[f.id];
      if (f.parent_id === null || f.parent_id === undefined) {
        roots.push(mapped);
      } else {
        const parent = map[f.parent_id];
        if (parent) {
          parent.children.push(mapped);
        } else {
          // If parent not found, fallback to root level
          roots.push(mapped);
        }
      }
    });

    return roots;
  }, [allFolders]);

  // Recursively determine if folder B is a subfolder of folder A
  const isDescendant = (parentFolderId, childFolderId) => {
    if (!allFolders) return false;
    const child = allFolders.find((f) => f.id === childFolderId);
    if (!child || !child.parent_id) return false;
    if (child.parent_id === parentFolderId) return true;
    return isDescendant(parentFolderId, child.parent_id);
  };

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const url = itemType === 'folder'
        ? `/api/admin/media/folders/${item.id}/move`
        : `/api/admin/media/files/${item.id}/move`;

      const res = await apiFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Taşıma işlemi başarısız oldu.');
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate everything to show the updated file/folder listings
      queryClient.invalidateQueries({ queryKey: ['admin-media-folders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-media-folders-all'] });
      queryClient.invalidateQueries({ queryKey: ['admin-media-files'] });
      if (currentFolderId && currentFolderId !== 'root') {
        queryClient.invalidateQueries({ queryKey: ['admin-media-folder-detail', String(currentFolderId)] });
      }
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Konum başarıyla değiştirildi.</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
      closeDialog();
    },
    onError: (err) => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive" close={false}>
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{err.message || 'Taşıma işlemi başarısız.'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    },
  });

  const handleMove = () => {
    const targetId = selectedFolderId === 'root' ? null : parseInt(selectedFolderId, 10);
    const payload = itemType === 'folder' ? { parent_id: targetId } : { folder_id: targetId };
    mutation.mutate(payload);
  };

  // Recursive Tree Node Renderer
  const renderTreeNode = (node, depth = 0) => {
    const isExpanded = !!expandedFolders[node.id];
    const isSelected = selectedFolderId === String(node.id);
    const hasChildren = node.children && node.children.length > 0;

    // Disabled flag: A folder cannot be moved into itself, or its own children
    const isSelf = itemType === 'folder' && item.id === node.id;
    const isSelfDescendant = itemType === 'folder' && isDescendant(item.id, node.id);
    const isDisabled = isSelf || isSelfDescendant;

    return (
      <div key={node.id} className="flex flex-col">
        <div
          onClick={() => !isDisabled && setSelectedFolderId(String(node.id))}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          className={`flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-colors text-sm ${
            isSelected
              ? 'bg-primary/10 text-primary font-semibold'
              : isDisabled
              ? 'opacity-40 cursor-not-allowed text-muted-foreground'
              : 'hover:bg-muted/40 text-foreground'
          }`}
        >
          <div className="flex items-center gap-2 grow truncate">
            {/* Toggle button */}
            <span
              onClick={(e) => {
                if (hasChildren) {
                  toggleExpand(node.id, e);
                }
              }}
              className="p-1 rounded-md hover:bg-muted/80 text-muted-foreground cursor-pointer shrink-0"
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="size-3.5" />
                ) : (
                  <ChevronRight className="size-3.5" />
                )
              ) : (
                <span className="w-3.5 h-3.5 block" />
              )}
            </span>

            {/* Folder Icon */}
            {isSelected ? (
              <FolderOpen className="size-4 text-primary shrink-0" />
            ) : (
              <Folder className="size-4 text-muted-foreground shrink-0" />
            )}

            <span className="truncate">{node.name}</span>
          </div>

          {isSelected && <Check className="size-4 text-primary shrink-0" />}
        </div>

        {/* Children Render */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col mt-0.5">
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Konumu Değiştir / Taşı</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4 max-h-[350px] overflow-y-auto">
          <div className="p-3 bg-muted/20 border border-border rounded-lg text-xs flex items-center gap-2 select-none">
            <span className="font-semibold text-foreground truncate max-w-[150px]">{item?.name || 'Seçili Öğe'}</span>
            <ArrowRight className="size-3 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Hedef klasör seçin:</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoaderCircleIcon className="size-6 text-muted-foreground animate-spin" />
            </div>
          ) : (
            <div className="space-y-1">
              {/* Root Selection Option */}
              <div
                onClick={() => setSelectedFolderId('root')}
                className={`flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-colors text-sm ${
                  selectedFolderId === 'root'
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'hover:bg-muted/40 text-foreground'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5.5" />
                  <FolderOpen className="size-4 text-muted-foreground shrink-0" />
                  <span>Ana Dizin (Root)</span>
                </div>
                {selectedFolderId === 'root' && <Check className="size-4 text-primary shrink-0" />}
              </div>

              {/* Recursive Folder Nodes */}
              {folderTree.map((node) => renderTreeNode(node))}

              {!isLoading && folderTree.length === 0 && (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  Gösterilecek başka klasör bulunmuyor.
                </div>
              )}
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={closeDialog}>
            İptal
          </Button>
          <Button
            type="button"
            onClick={handleMove}
            disabled={mutation.isPending || (itemType === 'folder' && String(item?.parent_id || 'root') === selectedFolderId) || (itemType === 'file' && String(item?.folder_id || 'root') === selectedFolderId)}
          >
            {mutation.isPending ? (
              <LoaderCircleIcon className="size-4 animate-spin mr-1.5" />
            ) : (
              <ArrowRight className="size-4 mr-1.5" />
            )}
            Taşı
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
