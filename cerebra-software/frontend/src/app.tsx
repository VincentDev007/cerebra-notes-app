/**
 * App COMPONENT — frontend/src/app.tsx
 *
 * PURPOSE:
 * The root React component. This is the "brain" of the entire frontend —
 * it owns ALL application state and coordinates every feature.
 * Child components are purely presentational; they receive data and callbacks as props.
 *
 * ─── LAYOUT ──────────────────────────────────────────────────────────────────
 * The UI is a two-column flex layout:
 *   <aside> (w-64, fixed) — Sidebar with folder list, sticky notes list, action buttons
 *   <main>  (flex-1)      — Toolbar (search bar) + Tab bar + Content area
 *
 * Content area renders ONE of these views based on state priority (top = highest):
 *   1. Loading spinner      — while foldersLoading or notesLoading
 *   2. SearchResults        — when searchQuery is non-empty
 *   3. Homepage             — when selectedFolder === null (FolderList + StickyNotes grid)
 *   4. NoteEditor           — when selectedNote is non-null (a note is open for editing)
 *   5. NoteList             — default folder view (notes grid + subfolders)
 *
 * ─── STATE INVENTORY ─────────────────────────────────────────────────────────
 * Tab management:
 *   openTabs[]       — array of (Folder | null), where null = Homepage tab
 *   activeTabIndex   — index into openTabs[] for the currently visible tab
 *   selectedFolder   — derived: openTabs[activeTabIndex] ?? null
 *
 * Hooks (all data lives here, passed down as props):
 *   useFolders()     — folders[], itemCounts, CRUD (create/update/remove folder)
 *   useNotes(id)     — notes[] for the selectedFolder, CRUD (create/update/remove note)
 *   useStickyNotes() — stickyNotes[], create/remove sticky note
 *   useSettings()    — settings Record<string,string>, updateSetting
 *
 * Modal / panel state (each is a boolean or an ID/object):
 *   showCreateFolder, createFolderParentId  — create folder dialog
 *   editingFolder (Folder | null)           — edit folder dialog
 *   deletingFolderId (number | null)        — folder delete confirm
 *   deletingNoteId (number | null)          — note delete confirm
 *   selectedNoteId (number | null)          — which note is open in the editor
 *   showCreateNote                          — create note dialog
 *   showCreateStickyNote                    — create sticky note dialog
 *   deletingStickyNoteId (number | null)    — sticky note delete confirm
 *   viewingStickyNoteId (number | null)     — view sticky note modal
 *   showSettings                            — settings panel
 *
 * Search:
 *   searchQuery          — the raw text input value
 *   searchResultNotes[]  — IPC search results (notes that match)
 *   searchMatchingFolders — client-side filtered from all folders[] (derived, not stored)
 *
 * ─── TAB SYSTEM ──────────────────────────────────────────────────────────────
 * openTabs is (Folder | null)[] — null represents the Homepage.
 * Always starts with [null] so the user always has a Home tab.
 *
 * navigateTo(folder):
 *   If folder is null → jump to the Home tab (find its index in openTabs).
 *   If folder already has a tab → jump to that tab (findIndex by id).
 *   Otherwise → push the folder to openTabs and switch to the new tab.
 *   This prevents duplicate tabs for the same folder.
 *
 * closeTab(index):
 *   Guards: can't close if only 1 tab remains.
 *   If closing the active tab → move to the tab to the left (max(0, index-1)).
 *   If closing a tab to the left of active → decrement activeTabIndex by 1.
 *
 * Tab display name: looks up the folder in the live folders[] array (not the tab snapshot).
 *   folders.find(f => f.id === tab.id)?.name ?? tab.name
 *   Why? A rename updates folders[] but not the stale Folder object stored in openTabs.
 *   This ensures the tab shows the new name after a rename without closing it.
 *
 * ─── SETTINGS AND THEME ──────────────────────────────────────────────────────
 * Two settings affect global DOM state (applied via useEffect, not inline styles):
 *   theme:       document.documentElement.setAttribute('data-theme', 'dark') or removes it.
 *                CSS variables in index.css switch all colors when [data-theme=dark] is set.
 *   fontSize + animations: document.body.classList management.
 *                Classes like 'font-small', 'font-large', 'no-animations' on <body>.
 *
 * toggleTheme(): flips 'light' ↔ 'dark', writes via updateSetting (IPC + local state).
 *
 * ─── SEARCH ──────────────────────────────────────────────────────────────────
 * DUAL STRATEGY:
 *   Notes:   IPC call → backend SQL LIKE query → returns matching Note[] (server-side)
 *   Folders: client-side filter on the already-loaded folders[] array
 * Debounce: useEffect + setTimeout(300ms) delays IPC calls until the user stops typing.
 *   Cleanup: return () => clearTimeout(timer) cancels a pending call if the query changes.
 * When query is empty: immediately clear searchResultNotes, show normal views.
 *
 * ─── CONFIRM DELETE GUARD ────────────────────────────────────────────────────
 * confirmDelete = settings.confirmDelete !== 'false'  → boolean
 * All delete handlers check this:
 *   if (confirmDelete) → set the deletingXxxId state → render DeleteConfirmModal
 *   else               → call removeXxx() directly (no dialog)
 * DeleteConfirmModal's onConfirm calls the actual remove function then clears the ID.
 *
 * ─── DERIVED STATE ───────────────────────────────────────────────────────────
 * selectedNote: notes.find(n => n.id === selectedNoteId) — derived, not stored.
 *   Why derived? If a note is saved, notes[] updates. Derived selectedNote then reflects
 *   the latest content automatically (no manual state sync needed).
 * rootFolders: folders.filter(f => f.parent_id === null) — only top-level for sidebar/homepage.
 * subfolders:  folders.filter(f => f.parent_id === selectedFolder.id) — for NoteList header.
 *
 * ─── KEY EFFECTS ─────────────────────────────────────────────────────────────
 * 1. Theme effect:       [theme]               → apply/remove data-theme attribute
 * 2. Clear note effect:  [selectedFolder?.id]  → clear selectedNoteId on folder switch
 * 3. Tab cleanup effect: [folders]             → remove tabs for deleted folders
 * 4. Tab bounds effect:  [openTabs.length, activeTabIndex] → clamp activeTabIndex in bounds
 * 5. Settings effect:    [fontSize, animations] → add/remove body classes
 * 6. Search effect:      [searchQuery]          → debounced IPC search
 *
 * ─── MODAL RENDERING ─────────────────────────────────────────────────────────
 * All modals are rendered at the bottom of the JSX, outside the sidebar/main layout.
 * They use fixed positioning and z-50 to float above everything.
 * The pattern: {showXxx && <XxxModal onClose={...} onCreate={...} />}
 * For ID-based modals: {deletingFolderId !== null && <DeleteConfirmModal ... />}
 * ViewStickyNoteModal uses an IIFE pattern to find the sticky object from the ID:
 *   {viewingStickyNoteId !== null && (() => { const sticky = ...; return sticky ? <Modal /> : null; })()}
 */

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
  /**
   * TAB STATE
   * openTabs: (Folder | null)[] — null = Homepage, Folder = a folder tab
   * Starts as [null] so the Home tab always exists.
   * selectedFolder is derived — never stored separately — to avoid sync bugs.
   */
  const [openTabs, setOpenTabs] = useState<(Folder | null)[]>([null]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const selectedFolder = openTabs[activeTabIndex] ?? null;  // null = Homepage

  /**
   * DATA HOOKS
   * useFolders: loads all folders (root + subfolders) and item counts on mount.
   * useNotes: loads notes for the currently selected folder. Re-runs when selectedFolder changes.
   *   selectedFolder?.id ?? null: if no folder selected, pass null → useNotes won't fetch.
   * useStickyNotes: loads all sticky notes (not folder-scoped).
   * useSettings: loads all settings as Record<string, string>.
   *
   * Rename aliases (loading: foldersLoading) avoid name collisions when destructuring
   * two hooks that both return { loading, error }.
   */
  const { folders, itemCounts, loading: foldersLoading, error: foldersError, create: createFolder, update: updateFolder, remove: removeFolder } = useFolders();
  const { notes, loading: notesLoading, error: notesError, create: createNote, update: updateNote, remove: removeNote } = useNotes(selectedFolder?.id ?? null);
  const { stickyNotes, create: createStickyNote, remove: removeStickyNote } = useStickyNotes();
  const { settings, updateSetting } = useSettings();

  /**
   * MODAL / PANEL STATE
   * Each modal is controlled by a boolean flag OR an ID/object (null = closed).
   * ID-based state (deletingFolderId, editingFolder, etc.) is cleaner than a boolean +
   * separate "which item" state — one piece of state instead of two.
   */
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<number | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<number | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [showCreateStickyNote, setShowCreateStickyNote] = useState(false);
  const [deletingStickyNoteId, setDeletingStickyNoteId] = useState<number | null>(null);
  const [viewingStickyNoteId, setViewingStickyNoteId] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  /**
   * SETTINGS-DERIVED FLAGS
   * Parse string settings into usable types.
   * confirmDelete: boolean — controls whether deletes show a confirmation dialog.
   *   !== 'false' means: true by default (missing key '' is !== 'false').
   * theme: 'light' | 'dark' — used to drive the data-theme attribute and toggleTheme.
   */
  const confirmDelete = settings.confirmDelete !== 'false';
  const theme = settings.theme === 'dark' ? 'dark' : 'light';

  /**
   * EFFECT 1: THEME — apply/remove [data-theme=dark] on <html>.
   * CSS variables in index.css switch colors when [data-theme=dark] is present.
   * All color values in JSX are CSS variables (e.g. var(--bg-primary)) so they
   * automatically update when data-theme changes — no component re-renders needed.
   */
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

  /** toggleTheme — flips light ↔ dark and persists via updateSetting (IPC + local state). */
  const toggleTheme = () => {
    updateSetting('theme', theme === 'light' ? 'dark' : 'light');
  };

  /**
   * DERIVED: selectedNote
   * Find the note object from notes[] using selectedNoteId.
   * Derived (not stored) so it automatically reflects the latest content after saves.
   * If notes[] is refreshed (after updateNote), selectedNote picks up the new data
   * without any manual sync.
   */
  const selectedNote = selectedNoteId !== null ? notes.find(n => n.id === selectedNoteId) ?? null : null;

  /**
   * EFFECT 2: CLEAR SELECTED NOTE on folder switch.
   * When the user navigates to a different folder, clear the open note.
   * Dependency: selectedFolder?.id (not the whole object) to avoid spurious triggers
   * if the folder object reference changes but the ID stays the same.
   */
  useEffect(() => {
    setSelectedNoteId(null);
  }, [selectedFolder?.id]);

  /**
   * EFFECT 3: TAB CLEANUP — remove tabs for folders that were deleted.
   * When folders[] changes, scan openTabs for any tab referencing a deleted folder.
   * If found, filter those tabs out. If no tabs remain, restore [null] (Home tab).
   *
   * Early return optimization:
   *   if (!prev.some(t => t !== null && !folderIds.has(t.id))) return prev;
   *   → If no stale tabs exist, return the same array reference to skip a re-render.
   */
  useEffect(() => {
    const folderIds = new Set(folders.map(f => f.id));
    setOpenTabs(prev => {
      if (!prev.some(t => t !== null && !folderIds.has(t.id))) return prev;  // no stale tabs
      const cleaned = prev.filter(t => t === null || folderIds.has(t.id));
      return cleaned.length > 0 ? cleaned : [null];  // always keep at least the Home tab
    });
  }, [folders]);

  /**
   * EFFECT 4: CLAMP activeTabIndex in bounds.
   * If openTabs shrinks (e.g. a tab is closed and it was the last one),
   * clamp activeTabIndex to the new valid range.
   * Math.max(0, ...) ensures we never go below index 0.
   */
  useEffect(() => {
    if (activeTabIndex >= openTabs.length) {
      setActiveTabIndex(Math.max(0, openTabs.length - 1));
    }
  }, [openTabs.length, activeTabIndex]);

  /**
   * navigateTo(folder) — open or switch to a tab for the given folder.
   *
   * folder === null → navigate to the Home tab (find its index in openTabs).
   * folder already open → jump to its existing tab (findIndex by id).
   * folder not open → append it to openTabs and switch to the new tab.
   *
   * This pattern prevents duplicate tabs for the same folder.
   * Search results use navigateTo() to jump to the matching folder on click.
   */
  const navigateTo = (folder: Folder | null) => {
    if (folder === null) {
      const homeIndex = openTabs.indexOf(null);
      if (homeIndex >= 0) setActiveTabIndex(homeIndex);
      return;
    }
    const existingIndex = openTabs.findIndex(t => t !== null && t.id === folder.id);
    if (existingIndex >= 0) {
      setActiveTabIndex(existingIndex);  // Tab already open — just switch to it
    } else {
      const newIndex = openTabs.length;
      setOpenTabs(prev => [...prev, folder]);  // Append new tab
      setActiveTabIndex(newIndex);             // Switch to the new tab
    }
  };

  /**
   * closeTab(index) — remove a tab by index.
   *
   * Guards:
   *   openTabs.length <= 1 → can't close the last tab (always need at least one).
   * wasActive: if we're closing the currently active tab, move left (max(0, index-1)).
   * activeTabIndex > index: closing a tab to the LEFT of active → decrement the index
   *   so the same tab stays selected after the array shifts.
   * activeTabIndex < index: closing a tab to the RIGHT → no adjustment needed.
   */
  const closeTab = (index: number) => {
    if (openTabs.length <= 1) return;  // Can't close the last tab
    const wasActive = activeTabIndex === index;
    setOpenTabs(prev => prev.filter((_, i) => i !== index));
    if (wasActive) {
      setActiveTabIndex(Math.max(0, index - 1));  // Move to the tab on the left
    } else if (activeTabIndex > index) {
      setActiveTabIndex(activeTabIndex - 1);  // Compensate for the shifted index
    }
  };

  /**
   * EFFECT 5: BODY CLASSES for font size and animations.
   * font-small / font-medium / font-large: CSS classes on <body> control base font size.
   * no-animations: disables CSS transitions when animations setting is 'false'.
   * Remove all three font classes first, then add the correct one — prevents stacking.
   */
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

  /**
   * DERIVED FOLDER LISTS
   * rootFolders: only parent_id === null folders — shown in sidebar and homepage grid.
   * subfolders: children of selectedFolder — shown in the NoteList header section.
   * Both are derived from the master folders[] array, no extra state needed.
   */
  const rootFolders = folders.filter(f => f.parent_id === null);
  const subfolders = selectedFolder ? folders.filter(f => f.parent_id === selectedFolder.id) : [];

  /**
   * SEARCH STATE
   * searchQuery: controlled input value — drives both search strategies.
   * searchResultNotes: IPC results for note content/title matching.
   * searchMatchingFolders: client-side derived (not stored) — filtered from all folders[].
   */
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResultNotes, setSearchResultNotes] = useState<Note[]>([]);

  /**
   * EFFECT 6: DEBOUNCED SEARCH
   * Fires 300ms after the last keystroke to avoid IPC on every character.
   *
   * If query is empty: immediately clear results and return (no timer needed).
   * Otherwise: create a timer → on fire, call searchNotes(IPC) → store results.
   * Cleanup: return () => clearTimeout(timer) cancels an in-flight timer if the
   * query changes before 300ms expires. This prevents stale results from earlier
   * (slower) queries overwriting results from the current query.
   */
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResultNotes([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchNotes(searchQuery.trim());
      setSearchResultNotes(results);
    }, 300);
    return () => clearTimeout(timer);  // Cancel previous timer on re-run
  }, [searchQuery]);

  /**
   * searchMatchingFolders — client-side folder search (no IPC needed).
   * Searches ALL folders (not just root) — a subfolder named "Work" will appear.
   * Case-insensitive: both sides lowercased before comparison.
   * Returns [] when searchQuery is empty (the ternary short-circuit).
   */
  const searchMatchingFolders = searchQuery.trim()
    ? folders.filter(f => f.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : [];


  /**
   * ─── JSX STRUCTURE ────────────────────────────────────────────────────────────
   * Root: flex h-screen — full viewport height, two columns.
   * Left: <aside> w-64 flex-shrink-0 — fixed sidebar, never grows or shrinks.
   * Right: <main> flex-1 — takes all remaining horizontal space.
   */
  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>

      {/* ── SIDEBAR ──────────────────────────────────────────────────────────── */}
      {/*   Fixed 256px wide column. Contains: header, folder list, sticky notes, */}
      {/*   spacer, bottom action buttons (settings + theme toggle).               */}
      <aside className="flex flex-col flex-shrink-0 w-64 transition-colors duration-300" style={{ background: 'var(--bg-sidebar)', color: 'var(--text-sidebar)' }}>

        {/* Sidebar header — shows the customizable app name (settings.appName) */}
        <div className="flex items-center justify-center h-[72px] border-b transition-colors duration-300" style={{ background: 'var(--bg-sidebar-header)', borderColor: 'var(--divider-color)' }}>
          <h1 className="text-2xl font-bold tracking-[3px]" style={{ color: 'var(--text-sidebar)' }}>{settings.appName || 'CEREBRA'}</h1>
        </div>

        {/* Sidebar — FOLDERS section */}
        {/* "+" button: sets createFolderParentId=null (root folder) + shows modal */}
        {/* Active folder highlighted with var(--divider-color) background */}
        {/* onClick: navigateTo() opens/switches to the folder's tab */}
        <div className="px-4 py-5">
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-light)' }}>FOLDERS</h3>
            <button
              className="w-5 h-5 rounded border text-xs font-bold flex items-center justify-center transition-all hover:scale-110"
              style={{ borderColor: 'var(--text-light)', color: 'var(--text-light)' }}
              onClick={() => {
                setCreateFolderParentId(null);  // null = create root-level folder
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
                    // Highlight the folder whose tab is currently active
                    background: selectedFolder?.id === folder.id ? 'var(--divider-color)' : 'transparent'
                  }}
                  onClick={() => navigateTo(folder)}
                >
                  📁 {folder.name}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mx-4 h-px" style={{ background: 'var(--divider-color)' }} />

        {/* Sidebar — STICKY NOTES section */}
        {/* "+" button: opens CreateStickyNoteModal */}
        {/* Each sticky note item: clicking opens ViewStickyNoteModal (read-only) */}
        {/* sticky.title || 'Quick Note': fallback for untitled stickies */}
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
                  onClick={() => setViewingStickyNoteId(sticky.id)}
                >
                  📌 {sticky.title || 'Quick Note'}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spacer — pushes bottom buttons to the bottom of the sidebar */}
        <div className="flex-1" />

        <div className="mx-4 h-px" style={{ background: 'var(--divider-color)' }} />

        {/* Bottom action buttons: Settings gear + Theme toggle (🌙/☀️) */}
        {/* toggleTheme: flips 'light' ↔ 'dark', persists via updateSetting */}
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

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      {/*   flex-col: toolbar (fixed height) + tab bar (fixed height) + content area (flex-1) */}
      <main className="flex flex-col flex-1 overflow-hidden">

        {/* ── TOOLBAR (search bar) ── h-[72px] matches sidebar header height */}
        {/* Controlled input: value={searchQuery} + onChange → setSearchQuery */}
        {/* ✕ clear button: only shown when searchQuery is non-empty */}
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

        {/* ── TAB BAR ── h-[50px] */}
        {/* openTabs.map: renders one tab button per open tab. */}
        {/* displayName: looks up folder in live folders[] to show renamed names. */}
        {/* key: "home-{index}" for null tabs, "folder-{id}" for folder tabs.     */}
        {/*   Using id-based keys prevents React reconciliation bugs on tab close. */}
        {/* Close button: e.stopPropagation() prevents the tab click from firing.  */}
        {/* "+" button: appends a new null (Home) tab and switches to it.          */}
        <div className="flex items-center px-4 h-[50px] border-b gap-2 flex-shrink-0 transition-colors duration-300" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
          {openTabs.map((tab, index) => {
            // Look up the live folder name (handles renames without reopening the tab)
            const displayName = tab === null ? 'Homepage' : (folders.find(f => f.id === tab.id)?.name ?? tab.name);
            return (
              <div
                key={tab === null ? `home-${index}` : `folder-${tab.id}`}
                className="flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm cursor-pointer transition-all"
                style={{
                  background: index === activeTabIndex ? 'var(--bg-primary)' : 'var(--border-color)',
                  fontWeight: index === activeTabIndex ? 600 : 400,
                  color: 'var(--text-primary)',
                  minWidth: '120px'
                }}
                onClick={() => setActiveTabIndex(index)}
              >
                {tab === null ? '🏠' : '📁'} <span className="truncate max-w-[120px]">{displayName}</span>
                {openTabs.length > 1 && (
                  <button
                    className="ml-auto text-base leading-none hover:text-red-500 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onClick={(e) => { e.stopPropagation(); closeTab(index); }}
                  >×</button>
                )}
              </div>
            );
          })}
          {/* "+" new tab button — always opens a Home tab */}
          <button
            className="w-8 h-8 rounded border flex items-center justify-center text-lg font-bold ml-1 transition-all hover:bg-blue-500 hover:text-white hover:border-blue-500"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            onClick={() => {
              const newIndex = openTabs.length;
              setOpenTabs(prev => [...prev, null]);  // null = new Home tab
              setActiveTabIndex(newIndex);
            }}
          >+</button>
        </div>

        {/* ── CONTENT AREA ── flex-1, scrollable */}
        {/* Priority chain (top = checked first):                                  */}
        {/* 1. Error banner   — shows if foldersError or notesError is non-null    */}
        {/* 2. Loading        — spinner while initial data loads                   */}
        {/* 3. SearchResults  — when searchQuery is non-empty                      */}
        {/* 4. Homepage       — when selectedFolder is null (FolderList + Stickies)*/}
        {/* 5. NoteEditor     — when a note is selected (selectedNote non-null)    */}
        {/* 6. NoteList       — default folder view (notes + subfolders)           */}
        <div className="flex-1 overflow-y-auto p-8 transition-colors duration-300" style={{ background: 'var(--bg-primary)' }}>

          {/* Error banner — shown above all other content if a hook reports an error */}
          {(foldersError || notesError) && (
            <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: 'var(--error-bg)', color: 'var(--error-text)', border: '1px solid var(--error-border)' }}>
              {foldersError || notesError}
            </div>
          )}

          {/* CONTENT PRIORITY CHAIN */}
          {(foldersLoading || (selectedFolder && notesLoading)) ? (
            // PRIORITY 2: Loading spinner
            // selectedFolder && notesLoading: only show spinner for notes loading
            // when a folder IS selected (avoid false spinner on homepage).
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-8 h-8 border-3 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--accent-blue)', borderWidth: '3px' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading...</p>
            </div>
          ) : searchQuery.trim() ? (
            // PRIORITY 3: Search results
            // onFolderClick: navigate to the folder + clear search
            // onNoteClick: find note's parent folder → navigate there + clear search
            <SearchResults
              query={searchQuery.trim()}
              folders={searchMatchingFolders}
              notes={searchResultNotes}
              onFolderClick={(folder) => {
                navigateTo(folder);
                setSearchQuery('');  // Clear search to return to normal view
              }}
              onNoteClick={(note) => {
                const noteFolder = folders.find(f => f.id === note.folder_id);
                if (noteFolder) navigateTo(noteFolder);
                setSearchQuery('');  // Clear search
                // Note: we don't auto-open the note, just navigate to its folder
              }}
            />
          ) : selectedFolder === null ? (
            // PRIORITY 4: Homepage (no folder selected)
            // Two sections: root FolderList grid + StickyNotes grid
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Folders</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{rootFolders.length} folder{rootFolders.length !== 1 ? 's' : ''}</p>
              </div>
              {/* FolderList: root folders only (parent_id === null) */}
              {/* onDelete: confirm guard → either show modal OR delete directly */}
              <FolderList
                folders={rootFolders}
                itemCounts={itemCounts}
                onSelect={navigateTo}
                onEdit={setEditingFolder}
                onDelete={async (id) => {
                  if (confirmDelete) {
                    setDeletingFolderId(id);  // Show confirmation dialog
                  } else {
                    await removeFolder(id);   // Delete immediately
                  }
                }}
              />

              {/* Gradient divider between Folders and Sticky Notes sections */}
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
                // auto-fill grid: cards wrap responsively, minimum 200px wide each
                <div
                  className="grid gap-5"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
                >
                  {stickyNotes.map(sticky => (
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
            // PRIORITY 5: Note Editor (a note is open)
            // onBack: clear selectedNoteId → returns to NoteList view
            // onDelete: removes note from DB + clears selectedNoteId
            <NoteEditor
              note={selectedNote}
              folderName={selectedFolder.name}
              onBack={() => setSelectedNoteId(null)}
              onSave={async (id, input) => {
                await updateNote(id, input);
              }}
              onDelete={async (id) => {
                await removeNote(id);
                setSelectedNoteId(null);  // Return to NoteList after delete
              }}
            />
          ) : (
            // PRIORITY 6: NoteList (folder selected, no note open)
            // onAddFolder: sets parentId to selectedFolder.id → creates subfolder
            // onSubfolderSelect: navigateTo → opens subfolder in a new tab
            <NoteList
              folder={selectedFolder}
              notes={notes}
              subfolders={subfolders}
              itemCounts={itemCounts}
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
                setCreateFolderParentId(selectedFolder!.id);  // subfolder of current folder
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

      {/* ── MODALS / PANELS ────────────────────────────────────────────────────── */}
      {/* All modals are rendered OUTSIDE the sidebar/main layout, at the root level. */}
      {/* They use fixed positioning + z-50 to float above all page content.          */}
      {/* Pattern: {showXxx && <XxxModal ... />}                                      */}
      {/* Or for ID-based: {deletingXxxId !== null && <DeleteConfirmModal ... />}     */}

      {/* CREATE FOLDER — parentId=null for root, parentId=number for subfolder */}
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

      {/* EDIT FOLDER — editingFolder object passed directly (has id + current name) */}
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

      {/* DELETE FOLDER — reuses generic DeleteConfirmModal with folder-specific text */}
      {/* onConfirm: delete from DB (cascade removes child notes/subfolders) + clear ID */}
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

      {/* DELETE NOTE — same DeleteConfirmModal, note-specific message */}
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

      {/* CREATE NOTE — for the currently selected folder (useNotes scoped to it) */}
      {showCreateNote && (
        <CreateNoteModal
          onClose={() => setShowCreateNote(false)}
          onCreate={async (title) => {
            await createNote(title);    // IPC → insert note in selectedFolder
            setShowCreateNote(false);
          }}
        />
      )}

      {/* CREATE STICKY NOTE — content is required, title is optional */}
      {showCreateStickyNote && (
        <CreateStickyNoteModal
          onClose={() => setShowCreateStickyNote(false)}
          onCreate={async (content, title) => {
            await createStickyNote(content, title);
            setShowCreateStickyNote(false);
          }}
        />
      )}

      {/* DELETE STICKY NOTE — same generic confirm modal */}
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

      {/* VIEW STICKY NOTE — IIFE pattern to look up the sticky object from its ID */}
      {/* We store only the ID (not the object) to avoid stale data.               */}
      {/* The IIFE (() => { ... })() lets us write local variables inside JSX.      */}
      {/* If stickyNotes no longer contains the ID (race condition), returns null.  */}
      {viewingStickyNoteId !== null && (() => {
        const sticky = stickyNotes.find(s => s.id === viewingStickyNoteId);
        return sticky ? (
          <ViewStickyNoteModal
            stickyNote={sticky}
            onClose={() => setViewingStickyNoteId(null)}
          />
        ) : null;
      })()}

      {/* SETTINGS PANEL — passes the full settings record + updateSetting callback */}
      {/* SettingsPanel calls onUpdate on every input change → immediate persistence */}
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
