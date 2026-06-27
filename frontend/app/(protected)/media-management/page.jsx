'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Folder,
  FolderPlus,
  Upload,
  Search,
  LayoutGrid,
  List,
  MoreVertical,
  Edit,
  Trash,
  Move,
  Eye,
  ArrowUpLeft,
  ChevronRight,
  LoaderCircleIcon,
  File,
  X,
  FileImage,
  Image as ImageIcon,
  ExternalLink,
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
import { Card, CardHeader, CardTable } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { FileUpload } from '@/components/ui/file-upload';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';

// Components
import FolderDialog from './components/folder-dialog';
import MediaMetaDrawer from './components/media-meta-drawer';
import MoveItemDialog from './components/move-item-dialog';

export default function MediaManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const currentFolderId = searchParams.get('folder') || 'root';
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadArea, setShowUploadArea] = useState(false);

  // Dialog & Drawer States
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [selectedFolderForEdit, setSelectedFolderForEdit] = useState(null);

  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [itemToMove, setItemToMove] = useState(null);
  const [itemTypeToMove, setItemTypeToMove] = useState(null); // 'file' | 'folder'

  const [metaDrawerOpen, setMetaDrawerOpen] = useState(false);
  const [selectedFileForMeta, setSelectedFileForMeta] = useState(null);

  const [uploadValue, setUploadValue] = useState([]);

  // Fetch all folders flat (for breadcrumb builder and tree structure)
  const { data: allFolders } = useQuery({
    queryKey: ['admin-media-folders-all'],
    queryFn: async () => {
      const res = await apiFetch('/api/admin/media/folders');
      if (!res.ok) throw new Error('Klasör listesi alınamadı.');
      const json = await res.json();
      return json.data || [];
    },
  });

  // Fetch folders in the active directory
  const { data: activeFolders, isLoading: foldersLoading } = useQuery({
    queryKey: ['admin-media-folders', currentFolderId],
    queryFn: async () => {
      const res = await apiFetch(`/api/admin/media/folders?parent_id=${currentFolderId}`);
      if (!res.ok) throw new Error('Klasörler yüklenemedi.');
      const json = await res.json();
      return json.data || [];
    },
  });

  // Fetch files in the active directory
  const { data: activeFilesResponse, isLoading: filesLoading } = useQuery({
    queryKey: ['admin-media-files', currentFolderId],
    queryFn: async () => {
      const res = await apiFetch(`/api/admin/media/files?folder_id=${currentFolderId}&limit=100`);
      if (!res.ok) throw new Error('Dosyalar yüklenemedi.');
      const json = await res.json();
      return json || { data: [] };
    },
  });

  const activeFiles = activeFilesResponse?.data || [];

  // Reset upload area state and files when folder changes
  useEffect(() => {
    setShowUploadArea(false);
    setUploadValue([]);
  }, [currentFolderId]);

  // Invalidate list queries when upload is completed to refresh lists immediately
  const handleUploadChange = (newVal) => {
    setUploadValue(newVal);
    queryClient.invalidateQueries({ queryKey: ['admin-media-files', currentFolderId] });
  };

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/admin/media/folders/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Klasör silinemedi.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-media-folders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-media-folders-all'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Klasör başarıyla silindi.</AlertTitle>
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

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (id) => {
      const res = await apiFetch(`/api/admin/media/files/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Dosya silinemedi.');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-media-files', currentFolderId] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Dosya başarıyla silindi.</AlertTitle>
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

  // Navigate folder
  const navigateToFolder = (id) => {
    if (id === 'root') {
      router.push('/media-management');
    } else {
      router.push(`/media-management?folder=${id}`);
    }
  };

  // Build Breadcrumbs from flat folders list
  const breadcrumbs = useMemo(() => {
    const list = [];
    if (currentFolderId !== 'root' && allFolders) {
      let curr = allFolders.find((f) => String(f.id) === String(currentFolderId));
      while (curr) {
        list.unshift({ id: curr.id, name: curr.name });
        if (curr.parent_id !== null) {
          curr = allFolders.find((f) => String(f.id) === String(curr.parent_id));
        } else {
          curr = null;
        }
      }
    }
    return list;
  }, [currentFolderId, allFolders]);

  // Filters locally based on search term
  const filteredFolders = useMemo(() => {
    if (!activeFolders) return [];
    if (!searchQuery) return activeFolders;
    const query = searchQuery.toLowerCase();
    return activeFolders.filter((f) => f.name.toLowerCase().includes(query));
  }, [activeFolders, searchQuery]);

  const filteredFiles = useMemo(() => {
    if (!activeFiles) return [];
    if (!searchQuery) return activeFiles;
    const query = searchQuery.toLowerCase();
    return activeFiles.filter(
      (f) =>
        f.name?.toLowerCase().includes(query) ||
        f.file_name?.toLowerCase().includes(query)
    );
  }, [activeFiles, searchQuery]);

  const handleEditFolderClick = (folder, e) => {
    e.stopPropagation();
    setSelectedFolderForEdit(folder);
    setFolderDialogOpen(true);
  };

  const handleDeleteFolderClick = (folderId, name, e) => {
    e.stopPropagation();
    if (confirm(`"${name}" klasörünü ve içindeki tüm alt öğeleri silmek istediğinizden emin misiniz?`)) {
      deleteFolderMutation.mutate(folderId);
    }
  };

  const handleMoveClick = (item, type, e) => {
    e.stopPropagation();
    setItemToMove(item);
    setItemTypeToMove(type);
    setMoveDialogOpen(true);
  };

  const handleFileClick = (file) => {
    setSelectedFileForMeta(file);
    setMetaDrawerOpen(true);
  };

  const handleDeleteFileClick = (fileId, name, e) => {
    e.stopPropagation();
    if (confirm(`"${name}" dosyasını silmek istediğinizden emin misiniz?`)) {
      deleteFileMutation.mutate(fileId);
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const isFolderParentRoot = useMemo(() => {
    if (currentFolderId === 'root') return false;
    if (!allFolders) return false;
    const curr = allFolders.find((f) => String(f.id) === String(currentFolderId));
    return curr?.parent_id === null;
  }, [currentFolderId, allFolders]);

  const parentFolderId = useMemo(() => {
    if (currentFolderId === 'root') return null;
    if (!allFolders) return null;
    const curr = allFolders.find((f) => String(f.id) === String(currentFolderId));
    return curr?.parent_id || 'root';
  }, [currentFolderId, allFolders]);

  const isLoading = foldersLoading || filesLoading;

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Medya Kütüphanesi</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={() => navigateToFolder('root')} className="cursor-pointer">
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={() => navigateToFolder('root')} className="cursor-pointer">
                    Media Library
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <span key={crumb.id} className="flex items-center gap-1.5">
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink onClick={() => navigateToFolder(crumb.id)} className="cursor-pointer">
                            {crumb.name}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </span>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container className="space-y-4">
        {/* Main Controls Card */}
        <Card className="p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search and view toggle */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Klasör veya dosya ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 w-full"
                />
                {searchQuery && (
                  <Button
                    mode="icon"
                    variant="dim"
                    onClick={() => setSearchQuery('')}
                    className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                  >
                    <X className="size-3" />
                  </Button>
                )}
              </div>

              {/* View Toggle */}
              <div className="flex border border-border rounded-lg p-0.5 shrink-0 bg-muted/10">
                <Button
                  variant={viewMode === 'grid' ? 'dim' : 'ghost'}
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                  title="Grid Görünümü"
                >
                  <LayoutGrid className="size-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'dim' : 'ghost'}
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0"
                  title="Liste Görünümü"
                >
                  <List className="size-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              {currentFolderId !== 'root' && (
                <Button
                  variant="outline"
                  onClick={() => navigateToFolder(parentFolderId)}
                  className="gap-1.5"
                  title="Yukarı Git"
                >
                  <ArrowUpLeft className="size-4" />
                  Geri Git
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => {
                  setSelectedFolderForEdit(null);
                  setFolderDialogOpen(true);
                }}
                className="gap-1.5"
              >
                <FolderPlus className="size-4" />
                Yeni Klasör
              </Button>

              <Button
                variant="primary"
                onClick={() => setShowUploadArea(!showUploadArea)}
                className="gap-1.5"
              >
                <Upload className="size-4" />
                Dosya Yükle
              </Button>
            </div>
          </div>

          {/* Toggleable Uploader Slide Box */}
          {showUploadArea && (
            <div className="mt-4 p-4 border border-border rounded-xl bg-muted/5 animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="flex items-center justify-between mb-3 select-none">
                <span className="text-xs font-bold text-foreground">
                  Yükleme Alanı ({currentFolderId === 'root' ? 'Ana Dizin' : breadcrumbs[breadcrumbs.length - 1]?.name})
                </span>
                <Button
                  variant="ghost"
                  onClick={() => setShowUploadArea(false)}
                  className="h-6 w-6 p-0 hover:bg-muted"
                >
                  <X className="size-4" />
                </Button>
              </div>
              <FileUpload
                value={uploadValue}
                onChange={handleUploadChange}
                isMultiple={true}
                folderId={currentFolderId}
                placeholder="Dosyaları buraya sürükleyin veya yüklemek için tıklayın"
              />
            </div>
          )}
        </Card>

        {/* Directory Explorer Listings */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <LoaderCircleIcon className="size-8 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Medya öğeleri listeleniyor...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Grid View Mode */}
            {viewMode === 'grid' && (
              <div className="space-y-6">
                {/* 1. Folder Grid */}
                {filteredFolders.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider select-none">Klasörler</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredFolders.map((folder) => (
                        <div
                          key={folder.id}
                          onDoubleClick={() => navigateToFolder(folder.id)}
                          className="group relative border border-border rounded-xl p-4 bg-card hover:bg-muted/15 hover:shadow-xs transition-all duration-200 cursor-pointer select-none flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3 grow truncate">
                            <div className="p-2.5 rounded-lg bg-yellow-500/10 text-yellow-500 shrink-0">
                              <Folder className="size-5 fill-yellow-500/20" />
                            </div>
                            <div className="truncate">
                              <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors" title={folder.name}>
                                {folder.name}
                              </h4>
                              <p className="text-[10px] text-muted-foreground font-medium">
                                {folder.children_count || 0} klasör, {folder.media_count || 0} dosya
                              </p>
                            </div>
                          </div>

                          {/* Context Menu Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                              >
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem onClick={() => navigateToFolder(folder.id)}>
                                <Eye className="size-3.5 mr-2" />
                                Klasörü Aç
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => handleEditFolderClick(folder, e)}>
                                <Edit className="size-3.5 mr-2" />
                                Yeniden Adlandır
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => handleMoveClick(folder, 'folder', e)}>
                                <Move className="size-3.5 mr-2" />
                                Taşı
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={(e) => handleDeleteFolderClick(folder.id, folder.name, e)}
                              >
                                <Trash className="size-3.5 mr-2" />
                                Sil
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. File Grid */}
                {filteredFiles.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider select-none">Dosyalar</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {filteredFiles.map((file) => {
                        const isImage = file.mime_type?.startsWith('image/');
                        const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
                        const fileUrl = file.url ? (file.url.startsWith('http') ? file.url : `${backendUrl}${file.url}`) : '';

                        return (
                          <div
                            key={file.id}
                            onClick={() => handleFileClick(file)}
                            className="group relative border border-border bg-card rounded-xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer flex flex-col h-[180px]"
                          >
                            {/* File Preview Frame */}
                            <div className="w-full h-28 bg-muted/20 border-b border-border flex items-center justify-center overflow-hidden relative">
                              {isImage && fileUrl ? (
                                <img
                                  src={fileUrl}
                                  alt={file.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                />
                              ) : file.mime_type?.startsWith('video/') && fileUrl ? (
                                <video
                                  src={fileUrl}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  muted
                                  playsInline
                                />
                              ) : (
                                <File className="size-10 text-muted-foreground" />
                              )}

                              {/* Hover details button overlay */}
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Button variant="primary" size="xs" className="h-7 gap-1">
                                  <Eye className="size-3" /> Detaylar
                                </Button>
                              </div>
                            </div>

                            {/* Details footer */}
                            <div className="p-2.5 flex flex-col justify-between grow min-w-0">
                              <h4 className="font-semibold text-xs text-foreground truncate w-full" title={file.name}>
                                {file.name}
                              </h4>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {formatBytes(file.size)}
                                </span>

                                {/* Context Menu */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="h-6 w-6 p-0 hover:bg-muted"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreVertical className="size-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-36">
                                    <DropdownMenuItem onClick={() => handleFileClick(file)}>
                                      <Eye className="size-3.5 mr-2" />
                                      Bilgi/Meta
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => handleMoveClick(file, 'file', e)}>
                                      <Move className="size-3.5 mr-2" />
                                      Taşı
                                    </DropdownMenuItem>
                                    {fileUrl && (
                                      <DropdownMenuItem asChild>
                                        <a href={fileUrl} target="_blank" rel="noreferrer">
                                          <ExternalLink className="size-3.5 mr-2" />
                                          Dosyayı Aç
                                        </a>
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onClick={(e) => handleDeleteFileClick(file.id, file.name, e)}
                                    >
                                      <Trash className="size-3.5 mr-2" />
                                      Sil
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* List View Mode */}
            {viewMode === 'list' && (
              <Card>
                <CardTable>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/10 text-muted-foreground text-xs font-bold uppercase tracking-wider select-none">
                        <th className="py-3 px-5">İsim</th>
                        <th className="py-3 px-4">Tür</th>
                        <th className="py-3 px-4">Boyut</th>
                        <th className="py-3 px-4">Tarih</th>
                        <th className="py-3 px-5 text-right">Aksiyonlar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      {/* Folders in list */}
                      {filteredFolders.map((folder) => (
                        <tr
                          key={folder.id}
                          onDoubleClick={() => navigateToFolder(folder.id)}
                          className="hover:bg-muted/10 cursor-pointer transition-colors group"
                        >
                          <td className="py-3 px-5 font-semibold flex items-center gap-2.5 truncate max-w-sm">
                            <Folder className="size-4 text-yellow-500 fill-yellow-500/10 shrink-0" />
                            <span className="truncate group-hover:text-primary transition-colors" title={folder.name}>
                              {folder.name}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">Klasör</td>
                          <td className="py-3 px-4 text-xs text-muted-foreground font-mono">
                            {folder.children_count || 0} klasör, {folder.media_count || 0} dosya
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">
                            {folder.updated_at ? new Date(folder.updated_at).toLocaleDateString('tr-TR') : '-'}
                          </td>
                          <td className="py-3 px-5 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="dim"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => navigateToFolder(folder.id)}
                                title="Aç"
                              >
                                <Eye className="size-3.5" />
                              </Button>
                              <Button
                                variant="dim"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={(e) => handleEditFolderClick(folder, e)}
                                title="Yeniden Adlandır"
                              >
                                <Edit className="size-3.5" />
                              </Button>
                              <Button
                                variant="dim"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={(e) => handleMoveClick(folder, 'folder', e)}
                                title="Taşı"
                              >
                                <Move className="size-3.5" />
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={(e) => handleDeleteFolderClick(folder.id, folder.name, e)}
                                title="Sil"
                              >
                                <Trash className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {/* Files in list */}
                      {filteredFiles.map((file) => {
                        const isImage = file.mime_type?.startsWith('image/');
                        const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';
                        const fileUrl = file.url ? (file.url.startsWith('http') ? file.url : `${backendUrl}${file.url}`) : '';

                        return (
                          <tr
                            key={file.id}
                            onClick={() => handleFileClick(file)}
                            className="hover:bg-muted/10 cursor-pointer transition-colors group"
                          >
                            <td className="py-3 px-5 font-semibold flex items-center gap-2.5 truncate max-w-sm">
                              {isImage ? (
                                <FileImage className="size-4 text-primary shrink-0" />
                              ) : (
                                <File className="size-4 text-muted-foreground shrink-0" />
                              )}
                              <span className="truncate" title={file.name}>{file.name}</span>
                            </td>
                            <td className="py-3 px-4 text-xs text-muted-foreground font-mono max-w-[120px] truncate" title={file.mime_type}>
                              {file.mime_type}
                            </td>
                            <td className="py-3 px-4 text-xs text-muted-foreground font-mono">
                              {formatBytes(file.size)}
                            </td>
                            <td className="py-3 px-4 text-xs text-muted-foreground">
                              {file.created_at ? new Date(file.created_at).toLocaleDateString('tr-TR') : '-'}
                            </td>
                            <td className="py-3 px-5 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="dim"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFileClick(file);
                                  }}
                                  title="Detaylar"
                                >
                                  <Eye className="size-3.5" />
                                </Button>
                                <Button
                                  variant="dim"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={(e) => handleMoveClick(file, 'file', e)}
                                  title="Taşı"
                                >
                                  <Move className="size-3.5" />
                                </Button>
                                {fileUrl && (
                                  <Button
                                    variant="dim"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    asChild
                                    onClick={(e) => e.stopPropagation()}
                                    title="Yeni sekmede aç"
                                  >
                                    <a href={fileUrl} target="_blank" rel="noreferrer">
                                      <ExternalLink className="size-3.5" />
                                    </a>
                                  </Button>
                                )}
                                <Button
                                  variant="danger"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={(e) => handleDeleteFileClick(file.id, file.name, e)}
                                  title="Sil"
                                >
                                  <Trash className="size-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardTable>
              </Card>
            )}

            {/* Empty State */}
            {filteredFolders.length === 0 && filteredFiles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl bg-card">
                <FolderOpen className="size-12 text-muted-foreground/60 mb-3" />
                <h3 className="font-semibold text-base text-foreground mb-1">Bu klasör boş</h3>
                <p className="text-xs text-muted-foreground text-center max-w-xs">
                  Klasörde herhangi bir alt klasör veya dosya bulunmuyor. Yeni bir klasör oluşturabilir veya dosya yükleyebilirsiniz.
                </p>
              </div>
            )}
          </div>
        )}
      </Container>

      {/* Dialogs and Drawer Rendering */}
      {folderDialogOpen && (
        <FolderDialog
          open={folderDialogOpen}
          closeDialog={() => {
            setFolderDialogOpen(false);
            setSelectedFolderForEdit(null);
          }}
          folder={selectedFolderForEdit}
          parentId={currentFolderId}
        />
      )}

      {moveDialogOpen && itemToMove && (
        <MoveItemDialog
          open={moveDialogOpen}
          closeDialog={() => {
            setMoveDialogOpen(false);
            setItemToMove(null);
            setItemTypeToMove(null);
          }}
          item={itemToMove}
          itemType={itemTypeToMove}
          currentFolderId={currentFolderId}
        />
      )}

      {metaDrawerOpen && selectedFileForMeta && (
        <MediaMetaDrawer
          open={metaDrawerOpen}
          onOpenChange={setMetaDrawerOpen}
          file={selectedFileForMeta}
          folderId={currentFolderId}
        />
      )}
    </>
  );
}
