import { useState, useEffect } from 'react';
import type { Folder, Note } from './types/electron';
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
import CreateFolderModal from './components/CreateFolderModal';
import CreateNoteModal from './components/CreateNoteModal';
import CreateStickyNoteModal from './components/CreateStickyNoteModal';
import EditFolderModal from './components/EditFolderModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import SettingsPanel from './components/SettingsPanel';
import ViewStickyNoteModal from './components/ViewStickyNoteModal';

export default function App() {
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  const { folders, create: createFolder, update: updateFolder, remove: removeFolder } = useFolders();
  const { notes, create: createNote, update: updateNote, remove: removeNote } = useNotes(selectedFolder?.id ?? null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<number | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<number | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [showCreateNote, setShowCreateNote] = useState(false);
  const { stickyNotes, create: createStickyNote, remove: removeStickyNote } = useStickyNotes();
  const [showCreateStickyNote, setShowCreateStickyNote] = useState(false);
  const [deletingStickyNoteId, setDeletingStickyNoteId] = useState<number | null>(null);
  const [viewingStickyNoteId, setViewingStickyNoteId] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { settings, updateSetting } = useSettings();

  // Theme state — persisted in settings
  const theme = settings.theme === 'dark' ? 'dark' : 'light';

  // Apply theme to document
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

  // Derive the selected note from the notes array so it auto-updates after saves
  const selectedNote = selectedNoteId !== null ? notes.find(n => n.id === selectedNoteId) ?? null : null;

  // Clear selected note when switching folders
  useEffect(() => {
    setSelectedNoteId(null);
  }, [selectedFolder?.id]);

  // Apply font-size and animations settings to the body element
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

  // Only show root-level folders on homepage (matching v1.0.0 behavior)
  const rootFolders = folders.filter(f => f.parent_id === null);

  // Get subfolders of the currently selected folder
  const subfolders = selectedFolder ? folders.filter(f => f.parent_id === selectedFolder.id) : [];

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResultNotes, setSearchResultNotes] = useState<Note[]>([]);

  // Debounced search — searches notes via IPC, folders filtered client-side
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResultNotes([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchNotes(searchQuery.trim());
      setSearchResultNotes(results);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter folders by search query (client-side, all folders not just root)
  const searchMatchingFolders = searchQuery.trim()
    ? folders.filter(f => f.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : [];


  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>

      {/* SIDEBAR */}
      <aside className="flex flex-col flex-shrink-0 w-64 transition-colors duration-300" style={{ background: 'var(--bg-sidebar)', color: 'var(--text-sidebar)' }}>

        {/* Sidebar header */}
        <div className="flex items-center justify-center h-[72px] border-b transition-colors duration-300" style={{ background: 'var(--bg-sidebar-header)', borderColor: 'var(--divider-color)' }}>
          <h1 className="text-2xl font-bold tracking-[3px]" style={{ color: 'var(--text-sidebar)' }}>{settings.appName || 'CEREBRA'}</h1>
        </div>

        {/* Folders section */}
        <div className="px-4 py-5">
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-light)' }}>FOLDERS</h3>
            <button
              className="w-5 h-5 rounded border text-xs font-bold flex items-center justify-center transition-all hover:scale-110"
              style={{ borderColor: 'var(--text-light)', color: 'var(--text-light)' }}
              onClick={() => {
                setCreateFolderParentId(null);
                setShowCreateFolder(true);
              }}
            >+</button>
          </div>
          <div className="flex flex-col gap-1">
            {rootFolders.length === 0 ? (
              <p className="text-xs italic px-3 py-2" style={{ color: 'var(--text-secondary)' }}>No folders yet</p>
            ) : (
              rootFolders.map(folder => (
                <div
                  key={folder.id}
                  className="px-3 py-2 rounded-md text-sm cursor-pointer transition-all hover:translate-x-1"
                  style={{
                    color: 'var(--text-sidebar)',
                    background: selectedFolder?.id === folder.id ? 'var(--divider-color)' : 'transparent'
                  }}
                  onClick={() => setSelectedFolder(folder)}
                >
                  📁 {folder.name}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px" style={{ background: 'var(--divider-color)' }} />

        {/* Sticky notes section */}
        <div className="px-4 py-5">
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-light)' }}>STICKY NOTES</h3>
            <button
              className="w-5 h-5 rounded border text-xs font-bold flex items-center justify-center transition-all hover:scale-110"
              style={{ borderColor: 'var(--text-light)', color: 'var(--text-light)' }}
              onClick={() => setShowCreateStickyNote(true)}
            >+</button>
          </div>
          {stickyNotes.length === 0 ? (
            <p className="text-xs italic px-3 py-2" style={{ color: 'var(--text-secondary)' }}>No sticky notes yet</p>
          ) : (
            <div className="flex flex-col gap-1">
              {stickyNotes.map(sticky => (
                <div
                  key={sticky.id}
                  className="px-3 py-2 rounded-md text-sm cursor-pointer transition-all hover:translate-x-1"
                  style={{ color: 'var(--text-sidebar)' }}
                >
                  📌 {sticky.title || 'Quick Note'}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Divider */}
        <div className="mx-4 h-px" style={{ background: 'var(--divider-color)' }} />

        {/* Bottom buttons */}
        <div className="flex justify-center gap-2 p-4 transition-colors duration-300" style={{ background: 'var(--bg-sidebar-header)' }}>
          <button
            className="w-10 h-10 rounded-lg border flex items-center justify-center text-xl transition-all hover:scale-105"
            style={{ borderColor: 'var(--divider-color)', color: 'var(--text-sidebar)' }}
            onClick={() => setShowSettings(true)}
          >⚙</button>
          <button
            className="w-10 h-10 rounded-lg border flex items-center justify-center text-xl transition-all hover:scale-105"
            style={{ borderColor: 'var(--divider-color)', color: 'var(--text-sidebar)' }}
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >{theme === 'light' ? '🌙' : '☀️'}</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex flex-col flex-1 overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center px-6 h-[72px] border-b flex-shrink-0 transition-colors duration-300" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <div className="flex flex-1 items-center rounded-xl px-4 py-2 border gap-2 transition-colors duration-300" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>🔍</span>
            <input
              className="flex-1 bg-transparent outline-none text-sm"
              placeholder="Search notes, folders, and content..."
              style={{ color: 'var(--text-primary)' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="text-sm transition-colors hover:text-red-500"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => setSearchQuery('')}
              >✕</button>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center px-4 h-[50px] border-b gap-2 flex-shrink-0 transition-colors duration-300" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          <button className="w-9 h-9 rounded border flex items-center justify-center text-lg opacity-30 cursor-not-allowed" style={{ borderColor: 'var(--border-color)' }}>←</button>
          <button className="w-9 h-9 rounded border flex items-center justify-center text-lg opacity-30 cursor-not-allowed" style={{ borderColor: 'var(--border-color)' }}>→</button>

          {/* Home tab */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm cursor-pointer transition-all"
            style={{
              background: selectedFolder === null ? 'var(--bg-primary)' : 'var(--border-color)',
              fontWeight: selectedFolder === null ? 600 : 400,
              color: 'var(--text-primary)',
              minWidth: '120px'
            }}
            onClick={() => setSelectedFolder(null)}
          >
            🏠 <span>Homepage</span>
          </div>

          {/* Folder tab */}
          {selectedFolder && (
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-semibold"
              style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', minWidth: '120px' }}
            >
              📁 <span className="truncate max-w-[120px]">{selectedFolder.name}</span>
              <button
                className="ml-auto text-base leading-none hover:text-red-500 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onClick={() => setSelectedFolder(null)}
              >×</button>
            </div>
          )}

          <button className="w-8 h-8 rounded border flex items-center justify-center text-lg font-bold ml-1 transition-all hover:bg-blue-500 hover:text-white hover:border-blue-500" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>+</button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-8 transition-colors duration-300" style={{ background: 'var(--bg-primary)' }}>
          {searchQuery.trim() ? (
            <SearchResults
              query={searchQuery.trim()}
              folders={searchMatchingFolders}
              notes={searchResultNotes}
              onFolderClick={(folder) => {
                setSelectedFolder(folder);
                setSearchQuery('');
              }}
              onNoteClick={(note) => {
                const noteFolder = folders.find(f => f.id === note.folder_id);
                if (noteFolder) setSelectedFolder(noteFolder);
                setSearchQuery('');
              }}
            />
          ) : selectedFolder === null ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Folders</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{rootFolders.length} folder{rootFolders.length !== 1 ? 's' : ''}</p>
              </div>
              <FolderList
                folders={rootFolders}
                onSelect={setSelectedFolder}
                onEdit={setEditingFolder}
                onDelete={setDeletingFolderId}
              />

              <hr className="my-10 border-0 h-px" style={{ background: 'linear-gradient(to right, transparent, var(--border-color), transparent)' }} />

              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Sticky Notes</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{stickyNotes.length} sticky note{stickyNotes.length !== 1 ? 's' : ''}</p>
              </div>
              {stickyNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-6xl mb-5 opacity-50">📌</div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>No sticky notes yet</h3>
                  <p className="text-sm" style={{ color: 'var(--text-light)' }}>Create a quick sticky note for reminders</p>
                </div>
              ) : (
                <div
                  className="grid gap-5"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
                >
                  {stickyNotes.map(sticky => (
                    <StickyNoteCard
                      key={sticky.id}
                      stickyNote={sticky}
                      onClick={() => setViewingStickyNoteId(sticky.id)}
                      onDelete={() => setDeletingStickyNoteId(sticky.id)}
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
              onNoteClick={(note: Note) => setSelectedNoteId(note.id)}
              onNoteDelete={removeNote}
              onAddNote={() => setShowCreateNote(true)}
              onAddFolder={() => {
                setCreateFolderParentId(selectedFolder!.id);
                setShowCreateFolder(true);
              }}
              onSubfolderSelect={setSelectedFolder}
              onSubfolderEdit={setEditingFolder}
              onSubfolderDelete={setDeletingFolderId}
            />
          )}
        </div>
      </main>

      {/* Create Folder Modal */}
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

      {/* Edit Folder Modal */}
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

      {/* Delete Folder Confirm Modal */}
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

      {/* Create Note Modal */}
      {showCreateNote && (
        <CreateNoteModal
          onClose={() => setShowCreateNote(false)}
          onCreate={async (title) => {
            await createNote(title);
            setShowCreateNote(false);
          }}
        />
      )}

      {/* Create Sticky Note Modal */}
      {showCreateStickyNote && (
        <CreateStickyNoteModal
          onClose={() => setShowCreateStickyNote(false)}
          onCreate={async (content, title) => {
            await createStickyNote(content, title);
            setShowCreateStickyNote(false);
          }}
        />
      )}

      {/* Delete Sticky Note Confirm Modal */}
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

      {/* View Sticky Note Modal */}
      {viewingStickyNoteId !== null && (() => {
        const sticky = stickyNotes.find(s => s.id === viewingStickyNoteId);
        return sticky ? (
          <ViewStickyNoteModal
            stickyNote={sticky}
            onClose={() => setViewingStickyNoteId(null)}
          />
        ) : null;
      })()}

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onUpdate={updateSetting}
          onClose={() => setShowSettings(false)}
        />
      )}

    </div>
  );
}
