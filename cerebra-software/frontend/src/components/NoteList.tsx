import type { Folder, Note } from '../types/electron';
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

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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
