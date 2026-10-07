import React, { useEffect, useState } from 'react';
import { 
  X, 
  Folder, 
  HardDrive, 
  ArrowUp, 
  ChevronRight, 
  Search, 
  Check, 
  Sparkles, 
  RotateCw, 
  FolderCheck,
  FolderOpen
} from 'lucide-react';

interface DirectoryItem {
  name: string;
  fullPath: string;
  isProject?: boolean;
  projectType?: string;
}

interface DirectoryListResult {
  currentPath: string;
  parentPath: string | null;
  drives: string[];
  directories: DirectoryItem[];
  bookmarks: Array<{ label: string; path: string; icon: string }>;
}

interface FolderBrowserModalProps {
  isOpen: boolean;
  initialPath?: string;
  onSelect: (selectedPath: string) => void;
  onClose: () => void;
}

export const FolderBrowserModal: React.FC<FolderBrowserModalProps> = ({
  isOpen,
  initialPath,
  onSelect,
  onClose,
}) => {
  const [currentPath, setCurrentPath] = useState('');
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [drives, setDrives] = useState<string[]>([]);
  const [directories, setDirectories] = useState<DirectoryItem[]>([]);
  const [bookmarks, setBookmarks] = useState<Array<{ label: string; path: string; icon: string }>>([]);
  const [selectedDir, setSelectedDir] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNativeBrowsing, setIsNativeBrowsing] = useState(false);

  const fetchDirectory = async (targetPath?: string) => {
    setLoading(true);
    try {
      const url = targetPath 
        ? `/api/system/list-directories?path=${encodeURIComponent(targetPath)}`
        : '/api/system/list-directories';
      const res = await fetch(url);
      if (res.ok) {
        const data: DirectoryListResult = await res.json();
        setCurrentPath(data.currentPath);
        setParentPath(data.parentPath);
        setDrives(data.drives || ['C:']);
        setDirectories(data.directories || []);
        setBookmarks(data.bookmarks || []);
        setSelectedDir(data.currentPath);
        setSearchFilter('');
      }
    } catch (e) {
      console.error('Fetch directory error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDirectory(initialPath);
    }
  }, [isOpen, initialPath]);

  if (!isOpen) return null;

  // Handle native Windows explorer dialog from within the modal
  const handleOpenNativeDialog = async () => {
    setIsNativeBrowsing(true);
    try {
      const res = await fetch('/api/system/browse-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialPath: currentPath }),
      });
      const data = await res.json();
      if (data.success && data.path) {
        onSelect(data.path);
        onClose();
      }
    } catch (e) {
      console.error('Native folder dialog error', e);
    } finally {
      setIsNativeBrowsing(false);
    }
  };

  // Breadcrumbs click
  const handleBreadcrumbClick = (idx: number, parts: string[]) => {
    const isDrive = parts[0].includes(':');
    let target = '';
    if (isDrive) {
      target = parts.slice(0, idx + 1).join('\\');
      if (idx === 0) target += '\\';
    } else {
      target = '/' + parts.slice(0, idx + 1).join('/');
    }
    fetchDirectory(target);
  };

  const pathParts = currentPath ? currentPath.split(/\\|\//).filter(Boolean) : [];

  const filteredDirs = directories.filter((d) =>
    d.name.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="fluent-card relative flex flex-col max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-xl shadow-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1C1C1C] min-[1440px]:w-[80vw] min-[1440px]:max-w-[80vw] min-[1440px]:h-[90vh] min-[1440px]:max-h-[90vh] modal-extension-large">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] px-5 py-3.5 bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-md text-white">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <span>Duyệt Thư Mục Mã Nguồn</span>
                <span className="rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-semibold px-2 py-0.5 border border-sky-500/20">
                  Windows 11 Explorer
                </span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Chọn thư mục dự án chứa file package.json, requirements.txt, hoặc Dockerfile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] hover:text-neutral-700 dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drives & Bookmarks Ribbon */}
        <div className="border-b border-black/[0.06] dark:border-white/[0.06] px-5 py-2.5 bg-neutral-50/70 dark:bg-neutral-900/50 flex items-center justify-between gap-3 flex-wrap text-xs">
          {/* Drive selector buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mr-1">
              Ổ Đĩa:
            </span>
            {drives.map((drv) => {
              const isActive = currentPath.toLowerCase().startsWith(drv.toLowerCase());
              return (
                <button
                  key={drv}
                  onClick={() => fetchDirectory(`${drv}\\`)}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[var(--hub-accent)] text-white shadow-xs'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                  }`}
                >
                  <HardDrive className="h-3 w-3" />
                  <span>{drv}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Bookmarks */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {bookmarks.map((bm, idx) => (
              <button
                key={idx}
                onClick={() => fetchDirectory(bm.path)}
                className="inline-flex items-center gap-1 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-sky-400 px-2 py-1 text-[11px] font-medium text-neutral-600 dark:text-neutral-300 transition-colors shadow-2xs"
                title={bm.path}
              >
                <span>{bm.icon}</span>
                <span>{bm.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Path Navigation & Search Bar */}
        <div className="p-3.5 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center gap-2">
          {/* Up Level Button */}
          <button
            onClick={() => parentPath && fetchDirectory(parentPath)}
            disabled={!parentPath}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-30 disabled:pointer-events-none transition-colors shrink-0"
            title="Lên một cấp thư mục (..)"
          >
            <ArrowUp className="h-4 w-4" />
          </button>

          {/* Breadcrumbs trail */}
          <div className="flex-1 flex items-center gap-1 overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2.5 py-1 text-xs font-mono text-neutral-600 dark:text-neutral-300 no-scrollbar">
            {pathParts.map((part, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="h-3 w-3 opacity-40 shrink-0" />}
                <button
                  onClick={() => handleBreadcrumbClick(idx, pathParts)}
                  className="hover:underline hover:text-sky-600 dark:hover:text-sky-400 font-semibold shrink-0"
                >
                  {part}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Quick Filter */}
          <div className="relative w-40 shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Lọc thư mục..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="h-8 w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 pl-8 pr-2.5 text-xs text-neutral-800 dark:text-neutral-200 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Directory List Container */}
        <div className="flex-1 overflow-y-auto p-3.5 min-h-[300px] max-h-[380px]">
          {loading ? (
            <div className="h-48 flex flex-col items-center justify-center gap-2 text-xs text-neutral-400">
              <RotateCw className="h-5 w-5 animate-spin text-sky-500" />
              <span>Đang đọc cấu trúc thư mục...</span>
            </div>
          ) : filteredDirs.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center gap-2 text-xs text-neutral-400">
              <Folder className="h-8 w-8 stroke-1 text-neutral-300 dark:text-neutral-700" />
              <span>Không tìm thấy thư mục con nào phù hợp</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {filteredDirs.map((dir) => {
                const isSelected = selectedDir === dir.fullPath;
                return (
                  <div
                    key={dir.fullPath}
                    onClick={() => setSelectedDir(dir.fullPath)}
                    onDoubleClick={() => fetchDirectory(dir.fullPath)}
                    className={`group flex items-center justify-between gap-2 p-2 rounded-lg border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500/10 text-sky-900 dark:text-sky-200 ring-1 ring-sky-500'
                        : 'border-transparent bg-black/[0.015] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Folder className={`h-4 w-4 shrink-0 ${dir.isProject ? 'text-amber-500' : 'text-sky-500'}`} />
                      <span className="text-xs font-semibold truncate text-neutral-800 dark:text-neutral-200">
                        {dir.name}
                      </span>
                      {dir.isProject && (
                        <span className="shrink-0 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-1.5 py-0.2 border border-amber-500/20">
                          {dir.projectType || 'Project'}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fetchDirectory(dir.fullPath);
                      }}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-semibold text-neutral-500 hover:text-sky-600 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-all"
                      title="Mở thư mục con này"
                    >
                      <span>Vào</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Path Preview & Actions Footer */}
        <div className="border-t border-black/[0.08] dark:border-white/[0.08] px-5 py-3 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">
              Thư mục đang chọn:
            </span>
            <div className="font-mono text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate" title={selectedDir || currentPath}>
              {selectedDir || currentPath}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Native OS Dialog Trigger Button */}
            <button
              onClick={handleOpenNativeDialog}
              disabled={isNativeBrowsing}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors shadow-2xs"
              title="Mở hộp thoại chọn thư mục gốc của Windows Explorer"
            >
              {isNativeBrowsing ? (
                <>
                  <RotateCw className="h-3.5 w-3.5 animate-spin text-sky-500" />
                  <span>Đang mở Windows...</span>
                </>
              ) : (
                <>
                  <FolderCheck className="h-3.5 w-3.5 text-sky-500" />
                  <span>🪟 Windows Explorer</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="rounded-lg border border-neutral-200 dark:border-neutral-700 px-3.5 py-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Hủy
            </button>

            <button
              onClick={() => {
                onSelect(selectedDir || currentPath);
                onClose();
              }}
              className="fluent-btn-primary px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Check className="h-4 w-4" />
              <span>Chọn Thư Mục Này</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
