import { Folder, FileText, Plus, ArrowLeft } from 'lucide-react';
import type { Folder as FolderType, Note } from '../types/electron';
import { formatDate } from '../utils/dateFormat';
import NoteCard from './NoteCard';
import FolderCard from './FolderCard';

interface Props {
  folder: FolderType;
  notes: Note[];
  subfolders: FolderType[];
  itemCounts?: Record<number, number>;
  onBack: () => void;
  onNoteClick: (note: Note) => void;
  onNoteDelete: (id: number) => void;
  onAddNote: () => void;
  onAddFolder: () => void;
  onSubfolderSelect: (folder: FolderType) => void;
  onSubfolderEdit: (folder: FolderType) => void;
  onSubfolderDelete: (id: number) => void;
}

export default function NoteList({ folder, notes, subfolders, itemCounts = {}, onBack, onNoteClick, onNoteDelete, onAddNote, onAddFolder, onSubfolderSelect, onSubfolderEdit, onSubfolderDelete }: Props) {
  return (
    <div>
      <div
        className="flex justify-between items-start p-8 rounded-xl mb-5 transition-colors duration-300"
        style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--card-shadow-sm)' }}
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button
              className="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors hover:bg-gray-100"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              onClick={onBack}
              title="Back to home"
            >
              <ArrowLeft size={16} />
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Folder size={28} style={{ color: 'var(--accent-blue)' }} /> {folder.name}
            </h1>
          </div>
          <p className="text-sm ml-11" style={{ color: 'var(--text-secondary)' }}>
            Created {formatDate(folder.created_at)}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px"
            style={{ background: 'var(--accent-blue)' }}
            onClick={onAddNote}
          >
            <FileText size={14} /> Add Note
          </button>
          <button
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px"
            style={{ background: 'var(--accent-blue)' }}
            onClick={onAddFolder}
          >
            <Plus size={14} /> Add Subfolder
          </button>
        </div>
      </div>

      <div
        className="rounded-xl p-6 mb-5 transition-colors duration-300"
        style={{ background: 'var(--bg-secondary)', minHeight: '300px', boxShadow: 'var(--card-shadow-sm)' }}
      >
        <h3 className="text-lg font-semibold mb-5 pb-2 border-b-2" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
          Notes
        </h3>

        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText size={56} className="mb-5 opacity-50" style={{ color: 'var(--text-secondary)' }} />
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

      <div
        className="rounded-xl p-6 mb-5 transition-colors duration-300"
        style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--card-shadow-sm)' }}
      >
        <h3 className="text-lg font-semibold mb-5 pb-2 border-b-2" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
          Subfolders
        </h3>

        {subfolders.length === 0 ? (
          <div className="flex items-center gap-2 py-4 px-3" style={{ color: 'var(--text-secondary)' }}>
            <Folder size={16} />
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
