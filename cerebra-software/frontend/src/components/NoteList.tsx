/**
 * NoteList COMPONENT — frontend/src/components/NoteList.tsx
 *
 * PURPOSE:
 * The main view inside a folder — shows that folder's notes and direct subfolders.
 * This is what you see when you open a folder tab (before clicking into a specific note).
 *
 * LAYOUT STRUCTURE:
 * 1. Folder Header  → folder name, created date, "Add Note" + "Add Subfolder" buttons
 * 2. Notes section  → grid of NoteCard components (or empty state)
 * 3. Subfolders section → grid of FolderCard components (or empty state)
 *
 * DATA FLOW:
 * NoteList is a pure presentational component — it receives all data and callbacks as props.
 * It does NOT fetch data or manage state. The parent (app.tsx) handles all that.
 * This makes NoteList easy to understand: it just renders what it's given.
 *
 * SUBFOLDERS vs ROOT FOLDERS:
 * The parent (app.tsx) passes only direct subfolders:
 *   subfolders = folders.filter(f => f.parent_id === selectedFolder.id)
 * NoteList doesn't need to filter — it receives exactly what to display.
 *
 * SAME GRID PATTERN AS FolderList:
 * Both sections use repeat(auto-fill, minmax(200px, 1fr)) for responsive card layouts.
 *
 * EMPTY STATES:
 * Notes: centered empty state with illustration (no notes yet → "Add your first note")
 * Subfolders: smaller inline message (less emphasis, subfolders are optional)
 *
 * PROPS OVERVIEW:
 * folder           → the current folder being viewed
 * notes            → notes IN this folder (filtered by folder_id)
 * subfolders       → direct subfolders (parent_id === folder.id)
 * itemCounts       → { folderId: count } for subfolder badges
 * onNoteClick      → open NoteEditor for a note
 * onNoteDelete     → delete a note (may trigger confirm modal in app.tsx)
 * onAddNote        → open CreateNoteModal
 * onAddFolder      → open CreateFolderModal with this folder as parent
 * onSubfolderSelect → navigate into a subfolder (open as new tab)
 * onSubfolderEdit   → rename a subfolder
 * onSubfolderDelete → delete a subfolder
 */

import type { Folder, Note } from '../types/electron';
import { formatDate } from '../utils/dateFormat';
import NoteCard from './NoteCard';
import FolderCard from './FolderCard';

interface Props {
  folder: Folder;
  notes: Note[];
  subfolders: Folder[];
  itemCounts?: Record<number, number>;
  onNoteClick: (note: Note) => void;
  onNoteDelete: (id: number) => void;
  onAddNote: () => void;
  onAddFolder: () => void;
  onSubfolderSelect: (folder: Folder) => void;
  onSubfolderEdit: (folder: Folder) => void;
  onSubfolderDelete: (id: number) => void;
}


export default function NoteList({ folder, notes, subfolders, itemCounts = {}, onNoteClick, onNoteDelete, onAddNote, onAddFolder, onSubfolderSelect, onSubfolderEdit, onSubfolderDelete }: Props) {
  return (
    <div>
      {/* Folder header */}
      <div
        className="flex justify-between items-start p-8 rounded-xl mb-5 transition-colors duration-300"
        style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--card-shadow-sm)' }}
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2" style={{ color: 'var(--text-primary)' }}>
            📁 {folder.name}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Created {formatDate(folder.created_at)}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px"
            style={{ background: 'var(--accent-blue)' }}
            onClick={onAddNote}
          >
            📝 Add Note
          </button>
          <button
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px"
            style={{ background: 'var(--accent-blue)' }}
            onClick={onAddFolder}
          >
            📁 Add Subfolder
          </button>
        </div>
      </div>

      {/* Notes area */}
      <div
        className="rounded-xl p-6 mb-5 transition-colors duration-300"
        style={{ background: 'var(--bg-secondary)', minHeight: '300px', boxShadow: 'var(--card-shadow-sm)' }}
      >
        <h3 className="text-lg font-semibold mb-5 pb-2 border-b-2" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
          Notes
        </h3>

        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-6xl mb-5 opacity-50">📝</div>
            <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>No notes yet</h4>
            <p className="text-sm" style={{ color: 'var(--text-light)' }}>Add your first note to this folder</p>
          </div>
        ) : (
          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
          >
            {notes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => onNoteClick(note)}
                onDelete={() => onNoteDelete(note.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Subfolders area */}
      <div
        className="rounded-xl p-6 mb-5 transition-colors duration-300"
        style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--card-shadow-sm)' }}
      >
        <h3 className="text-lg font-semibold mb-5 pb-2 border-b-2" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
          Subfolders
        </h3>

        {subfolders.length === 0 ? (
          <div className="flex items-center gap-2 py-4 px-3" style={{ color: 'var(--text-secondary)' }}>
            <span>📁</span>
            <span className="text-sm">No subfolders yet</span>
          </div>
        ) : (
          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
          >
            {subfolders.map(subfolder => (
              <FolderCard
                key={subfolder.id}
                folder={subfolder}
                itemCount={itemCounts[subfolder.id] ?? 0}
                onClick={() => onSubfolderSelect(subfolder)}
                onEdit={() => onSubfolderEdit(subfolder)}
                onDelete={() => onSubfolderDelete(subfolder.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
