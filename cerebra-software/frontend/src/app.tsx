import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import {
  Folder,
  Pin,
  Settings,
  Moon,
  Sun,
  Search,
  X,
  Home,
  Plus,
  Pin as StickyIcon,
} from 'lucide-react';
import type { Folder as FolderType, Note } from './types/electron';
import { useFolders } from './hooks/useFolders';
import { useNotes } from './hooks/useNotes';
import { useStickyNotes } from './hooks/useStickyNotes';
import { useSettings } from './hooks/useSettings';
import { searchNotes } from './services/noteService';
import FolderList from './components/FolderList';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import StickyNoteCard from './components/StickyNoteCard';
import SearchResults from './components/SearchResults';

const CreateFolderModal = lazy(() => import('./components/CreateFolderModal'));
const CreateNoteModal = lazy(() => import('./components/CreateNoteModal'));
const CreateStickyNoteModal = lazy(() => import('./components/CreateStickyNoteModal'));
const EditFolderModal = lazy(() => import('./components/EditFolderModal'));
const DeleteConfirmModal = lazy(() => import('./components/DeleteConfirmModal'));
const SettingsPanel = lazy(() => import('./components/SettingsPanel'));
const ViewStickyNoteModal = lazy(() => import('./components/ViewStickyNoteModal'));

export default function App() {
  const [openTabs, setOpenTabs] = useState<(FolderType | null)[]>([null]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const selectedFolder = openTabs[activeTabIndex] ?? null;

  const {
    folders,
    itemCounts,
    loading: foldersLoading,
    error: foldersError,
    create: createFolder,
    update: updateFolder,
    remove: removeFolder,
  } = useFolders();
  const {
    notes,
    loading: notesLoading,
    error: notesError,
    create: createNote,
    update: updateNote,
    remove: removeNote,
  } = useNotes(selectedFolder?.id ?? null);
  const { stickyNotes, create: createStickyNote, remove: removeStickyNote } = useStickyNotes();
  const { settings, updateSetting } = useSettings();

  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<number | null>(null);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<number | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [showCreateStickyNote, setShowCreateStickyNote] = useState(false);
  const [deletingStickyNoteId, setDeletingStickyNoteId] = useState<number | null>(null);
  const [viewingStickyNoteId, setViewingStickyNoteId] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const confirmDelete = settings.confirmDelete !== 'false';
  const theme = settings.theme === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

  const toggleTheme = () => {
    updateSetting('theme', theme === 'light' ? 'dark' : 'light');
  };

  const selectedNote =
    selectedNoteId !== null ? (notes.find((n) => n.id === selectedNoteId) ?? null) : null;

  useEffect(() => {
    setSelectedNoteId(null);
  }, [selectedFolder?.id]);

  useEffect(() => {
    const folderIds = new Set(folders.map((f) => f.id));
    setOpenTabs((prev) => {
      if (!prev.some((t) => t !== null && !folderIds.has(t.id))) return prev;
      const cleaned = prev.filter((t) => t === null || folderIds.has(t.id));
      return cleaned.length > 0 ? cleaned : [null];
    });
  }, [folders]);

  useEffect(() => {
    if (activeTabIndex >= openTabs.length) {
      setActiveTabIndex(Math.max(0, openTabs.length - 1));
    }
  }, [openTabs.length, activeTabIndex]);

  const navigateTo = (folder: FolderType | null) => {
    if (folder === null) {
      const homeIndex = openTabs.indexOf(null);
      if (homeIndex >= 0) setActiveTabIndex(homeIndex);
      return;
    }
    const existingIndex = openTabs.findIndex((t) => t !== null && t.id === folder.id);
    if (existingIndex >= 0) {
      setActiveTabIndex(existingIndex);
    } else {
      const newIndex = openTabs.length;
      setOpenTabs((prev) => [...prev, folder]);
      setActiveTabIndex(newIndex);
    }
  };

  const closeTab = (index: number) => {
    if (openTabs.length <= 1) return;
    const wasActive = activeTabIndex === index;
    setOpenTabs((prev) => prev.filter((_, i) => i !== index));
    if (wasActive) {
      setActiveTabIndex(Math.max(0, index - 1));
    } else if (activeTabIndex > index) {
      setActiveTabIndex(activeTabIndex - 1);
    }
  };

  useEffect(() => {
    const fs = settings.fontSize || 'medium';
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add(`font-${fs}`);

    if (settings.animations === 'false') {
      document.body.classList.add('no-animations');
    } else {
      document.body.classList.remove('no-animations');
    }
  }, [settings.fontSize, settings.animations]);

  const rootFolders = folders.filter((f) => f.parent_id === null);
  const subfolders = selectedFolder ? folders.filter((f) => f.parent_id === selectedFolder.id) : [];

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResultNotes, setSearchResultNotes] = useState<Note[]>([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResultNotes([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await searchNotes(searchQuery.trim());
        setSearchResultNotes(results);
      } catch {
        setSearchResultNotes([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchMatchingFolders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return q ? folders.filter((f) => f.name.toLowerCase().includes(q)) : [];
  }, [searchQuery, folders]);

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}
    >
      <aside
        className="flex flex-col flex-shrink-0 w-64 transition-colors duration-300"
        style={{ background: 'var(--bg-sidebar)', color: 'var(--text-sidebar)' }}
      >
        <div
          className="flex items-center justify-center h-[72px] border-b transition-colors duration-300"
          style={{ background: 'var(--bg-sidebar-header)', borderColor: 'var(--divider-color)' }}
        >
          <h1
            className="text-2xl font-bold tracking-[3px]"
            style={{ color: 'var(--text-sidebar)' }}
          >
            {settings.appName || 'CEREBRA'}
          </h1>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 flex flex-col px-4 py-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-3 px-1 flex-shrink-0">
              <h3
                className="text-[11px] uppercase tracking-wider font-semibold"
                style={{ color: 'var(--text-light)' }}
              >
                FOLDERS
              </h3>
              <button
                className="w-5 h-5 rounded border text-xs font-bold flex items-center justify-center transition-all hover:scale-110"
                style={{ borderColor: 'var(--text-light)', color: 'var(--text-light)' }}
                onClick={() => {
                  setCreateFolderParentId(null);
                  setShowCreateFolder(true);
                }}
              >
                <Plus size={12} />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {rootFolders.length === 0 ? (
                <p className="text-xs italic px-3 py-2" style={{ color: 'var(--text-secondary)' }}>
                  No folders yet
                </p>
              ) : (
                rootFolders.map((folder) => (
                  <div
                    key={folder.id}
                    className="px-3 py-2 rounded-md text-sm cursor-pointer transition-all hover:translate-x-1 flex items-center gap-2"
                    style={{
                      color: 'var(--text-sidebar)',
                      background:
                        selectedFolder?.id === folder.id ? 'var(--divider-color)' : 'transparent',
                    }}
                    onClick={() => navigateTo(folder)}
                  >
                    <Folder size={14} /> {folder.name}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mx-4 h-px flex-shrink-0" style={{ background: 'var(--divider-color)' }} />

          <div className="flex-1 min-h-0 flex flex-col px-4 py-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-3 px-1 flex-shrink-0">
              <h3
                className="text-[11px] uppercase tracking-wider font-semibold"
                style={{ color: 'var(--text-light)' }}
              >
                STICKY NOTES
              </h3>
              <button
                className="w-5 h-5 rounded border text-xs font-bold flex items-center justify-center transition-all hover:scale-110"
                style={{ borderColor: 'var(--text-light)', color: 'var(--text-light)' }}
                onClick={() => setShowCreateStickyNote(true)}
              >
                <Plus size={12} />
              </button>
            </div>
            {stickyNotes.length === 0 ? (
              <p className="text-xs italic px-3 py-2" style={{ color: 'var(--text-secondary)' }}>
                No sticky notes yet
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {stickyNotes.map((sticky) => (
                  <div
                    key={sticky.id}
                    className="px-3 py-2 rounded-md text-sm cursor-pointer transition-all hover:translate-x-1 flex items-center gap-2"
                    style={{ color: 'var(--text-sidebar)' }}
                    onClick={() => setViewingStickyNoteId(sticky.id)}
                  >
                    <Pin size={14} /> {sticky.title || 'Quick Note'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mx-4 h-px" style={{ background: 'var(--divider-color)' }} />

        <div
          className="flex justify-center gap-2 p-4 transition-colors duration-300"
          style={{ background: 'var(--bg-sidebar-header)' }}
        >
          <button
            className="w-10 h-10 rounded-lg border flex items-center justify-center transition-all hover:scale-105"
            style={{ borderColor: 'var(--divider-color)', color: 'var(--text-sidebar)' }}
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <Settings size={18} />
          </button>
          <button
            className="w-10 h-10 rounded-lg border flex items-center justify-center transition-all hover:scale-105"
            style={{ borderColor: 'var(--divider-color)', color: 'var(--text-sidebar)' }}
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </aside>

      <main className="flex flex-col flex-1 overflow-hidden">
        <div
          className="flex items-center px-6 h-[72px] border-b flex-shrink-0 transition-colors duration-300"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <div
            className="flex flex-1 items-center rounded-xl px-4 py-2 border gap-2 transition-colors duration-300"
            style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
          >
            <Search size={16} style={{ color: 'var(--text-secondary)' }} />
            <input
              className="flex-1 bg-transparent outline-none text-sm"
              placeholder="Search notes, folders, and content..."
              style={{ color: 'var(--text-primary)' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="transition-colors hover:text-red-500"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div
          className="flex items-center px-4 h-[50px] border-b gap-2 flex-shrink-0 transition-colors duration-300"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          {openTabs.map((tab, index) => {
            const displayName =
              tab === null ? 'Homepage' : (folders.find((f) => f.id === tab.id)?.name ?? tab.name);
            return (
              <div
                key={tab === null ? `home-${index}` : `folder-${tab.id}`}
                className="flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm cursor-pointer transition-all"
                style={{
                  background:
                    index === activeTabIndex ? 'var(--bg-primary)' : 'var(--border-color)',
                  fontWeight: index === activeTabIndex ? 600 : 400,
                  color: 'var(--text-primary)',
                  minWidth: '120px',
                }}
                onClick={() => setActiveTabIndex(index)}
              >
                {tab === null ? <Home size={14} /> : <Folder size={14} />}
                <span className="truncate max-w-[120px]">{displayName}</span>
                {openTabs.length > 1 && (
                  <button
                    className="ml-auto hover:text-red-500 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(index);
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            );
          })}
          <button
            className="w-8 h-8 rounded border flex items-center justify-center font-bold ml-1 transition-all hover:bg-blue-500 hover:text-white hover:border-blue-500"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            onClick={() => {
              const newIndex = openTabs.length;
              setOpenTabs((prev) => [...prev, null]);
              setActiveTabIndex(newIndex);
            }}
          >
            <Plus size={16} />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto p-8 transition-colors duration-300"
          style={{ background: 'var(--bg-primary)' }}
        >
          {(foldersError || notesError) && (
            <div
              className="mb-4 px-4 py-3 rounded-lg text-sm font-medium"
              style={{
                background: 'var(--error-bg)',
                color: 'var(--error-text)',
                border: '1px solid var(--error-border)',
              }}
            >
              {foldersError || notesError}
            </div>
          )}

          {foldersLoading || (selectedFolder && notesLoading) ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div
                className="w-8 h-8 border-3 rounded-full animate-spin mb-4"
                style={{
                  borderColor: 'var(--border-color)',
                  borderTopColor: 'var(--accent-blue)',
                  borderWidth: '3px',
                }}
              />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Loading...
              </p>
            </div>
          ) : searchQuery.trim() ? (
            <SearchResults
              query={searchQuery.trim()}
              folders={searchMatchingFolders}
              notes={searchResultNotes}
              onFolderClick={(folder) => {
                navigateTo(folder);
                setSearchQuery('');
              }}
              onNoteClick={(note) => {
                const noteFolder = folders.find((f) => f.id === note.folder_id);
                if (noteFolder) navigateTo(noteFolder);
                setSearchQuery('');
              }}
            />
          ) : selectedFolder === null ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Folders
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {rootFolders.length} folder{rootFolders.length !== 1 ? 's' : ''}
                </p>
              </div>
              <FolderList
                folders={rootFolders}
                itemCounts={itemCounts}
                onSelect={navigateTo}
                onEdit={setEditingFolder}
                onDelete={async (id) => {
                  if (confirmDelete) {
                    setDeletingFolderId(id);
                  } else {
                    await removeFolder(id);
                  }
                }}
              />

              <hr
                className="my-10 border-0 h-px"
                style={{
                  background:
                    'linear-gradient(to right, transparent, var(--border-color), transparent)',
                }}
              />

              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Sticky Notes
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {stickyNotes.length} sticky note{stickyNotes.length !== 1 ? 's' : ''}
                </p>
              </div>
              {stickyNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <StickyIcon
                    size={56}
                    className="mb-5 opacity-50"
                    style={{ color: 'var(--text-secondary)' }}
                  />
                  <h3
                    className="text-xl font-semibold mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    No sticky notes yet
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-light)' }}>
                    Create a quick sticky note for reminders
                  </p>
                </div>
              ) : (
                <div
                  className="grid gap-5"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
                >
                  {stickyNotes.map((sticky) => (
                    <StickyNoteCard
                      key={sticky.id}
                      stickyNote={sticky}
                      onClick={() => setViewingStickyNoteId(sticky.id)}
                      onDelete={async () => {
                        if (confirmDelete) {
                          setDeletingStickyNoteId(sticky.id);
                        } else {
                          await removeStickyNote(sticky.id);
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          ) : selectedNote ? (
            <NoteEditor
              note={selectedNote}
              folderName={selectedFolder.name}
              onBack={() => setSelectedNoteId(null)}
              onSave={async (id, input) => {
                await updateNote(id, input);
              }}
              onDelete={async (id) => {
                await removeNote(id);
                setSelectedNoteId(null);
              }}
            />
          ) : (
            <NoteList
              folder={selectedFolder}
              notes={notes}
              subfolders={subfolders}
              itemCounts={itemCounts}
              onBack={() => navigateTo(null)}
              onNoteClick={(note: Note) => setSelectedNoteId(note.id)}
              onNoteDelete={async (id) => {
                if (confirmDelete) {
                  setDeletingNoteId(id);
                } else {
                  await removeNote(id);
                }
              }}
              onAddNote={() => setShowCreateNote(true)}
              onAddFolder={() => {
                setCreateFolderParentId(selectedFolder!.id);
                setShowCreateFolder(true);
              }}
              onSubfolderSelect={navigateTo}
              onSubfolderEdit={setEditingFolder}
              onSubfolderDelete={async (id) => {
                if (confirmDelete) {
                  setDeletingFolderId(id);
                } else {
                  await removeFolder(id);
                }
              }}
            />
          )}
        </div>
      </main>

      <Suspense fallback={null}>
        {showCreateFolder && (
          <CreateFolderModal
            parentId={createFolderParentId}
            onClose={() => setShowCreateFolder(false)}
            onCreate={async (name, parentId) => {
              await createFolder(name, parentId);
              setShowCreateFolder(false);
            }}
          />
        )}

        {editingFolder && (
          <EditFolderModal
            folder={editingFolder}
            onClose={() => setEditingFolder(null)}
            onSave={async (id, newName) => {
              await updateFolder(id, { name: newName });
              setEditingFolder(null);
            }}
          />
        )}

        {deletingFolderId !== null && (
          <DeleteConfirmModal
            title="Delete Folder"
            message="Are you sure you want to delete this folder? This action cannot be undone."
            onClose={() => setDeletingFolderId(null)}
            onConfirm={async () => {
              await removeFolder(deletingFolderId);
              setDeletingFolderId(null);
            }}
          />
        )}

        {deletingNoteId !== null && (
          <DeleteConfirmModal
            title="Delete Note"
            message="Are you sure you want to delete this note? This action cannot be undone."
            onClose={() => setDeletingNoteId(null)}
            onConfirm={async () => {
              await removeNote(deletingNoteId);
              setDeletingNoteId(null);
            }}
          />
        )}

        {showCreateNote && (
          <CreateNoteModal
            onClose={() => setShowCreateNote(false)}
            onCreate={async (title) => {
              await createNote(title);
              setShowCreateNote(false);
            }}
          />
        )}

        {showCreateStickyNote && (
          <CreateStickyNoteModal
            onClose={() => setShowCreateStickyNote(false)}
            onCreate={async (content, title) => {
              await createStickyNote(content, title);
              setShowCreateStickyNote(false);
            }}
          />
        )}

        {deletingStickyNoteId !== null && (
          <DeleteConfirmModal
            title="Delete Sticky Note"
            message="Are you sure you want to delete this sticky note? This action cannot be undone."
            onClose={() => setDeletingStickyNoteId(null)}
            onConfirm={async () => {
              await removeStickyNote(deletingStickyNoteId);
              setDeletingStickyNoteId(null);
            }}
          />
        )}

        {viewingStickyNoteId !== null &&
          (() => {
            const sticky = stickyNotes.find((s) => s.id === viewingStickyNoteId);
            return sticky ? (
              <ViewStickyNoteModal
                stickyNote={sticky}
                onClose={() => setViewingStickyNoteId(null)}
              />
            ) : null;
          })()}

        {showSettings && (
          <SettingsPanel
            settings={settings}
            onUpdate={updateSetting}
            onClose={() => setShowSettings(false)}
          />
        )}
      </Suspense>
    </div>
  );
}
