import { useState } from 'react';
import { Folder, FileText, ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import type { Folder as FolderType, Note } from '../types/electron';
import { formatDate } from '../utils/dateFormat';
import NoteCard from './NoteCard';

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

function SubfolderItem({
  folder,
  itemCount,
  onClick,
  onEdit,
  onDelete,
}: {
  folder: FolderType;
  itemCount: number;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex flex-col items-center cursor-pointer transition-opacity duration-200"
      style={{ opacity: hovered ? 0.7 : 1 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="relative w-44 h-32 rounded-lg flex items-center justify-center mb-1"
        style={{ background: 'var(--border-color)' }}
      >
        <Folder size={52} style={{ color: 'var(--text-secondary)' }} />
        <div
          className="absolute top-1 right-1 flex gap-0.5 transition-opacity duration-150"
          style={{ opacity: hovered ? 1 : 0 }}
        >
          <button
            className="w-5 h-5 rounded flex items-center justify-center text-white"
            style={{ background: 'var(--btn-edit-bg)' }}
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            title="Rename"
          >
            <Pencil size={10} />
          </button>
          <button
            className="w-5 h-5 rounded flex items-center justify-center text-white"
            style={{ background: 'var(--btn-delete-bg)' }}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete"
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>
      <span className="text-xs font-medium text-center w-44 truncate" style={{ color: 'var(--text-primary)' }}>
        {folder.name}
      </span>
      <span className="text-xs" style={{ color: 'var(--text-light)' }}>
        {itemCount} {itemCount === 1 ? 'item' : 'items'}
      </span>
    </div>
  );
}

export default function NoteList({
  folder,
  notes,
  subfolders,
  itemCounts = {},
  onBack,
  onNoteClick,
  onNoteDelete,
  onAddNote,
  onAddFolder,
  onSubfolderSelect,
  onSubfolderEdit,
  onSubfolderDelete,
}: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            className="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors hover:bg-gray-100"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            onClick={onBack}
            title="Back to home"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-2xl font-bold uppercase" style={{ color: 'var(--text-primary)' }}>
              {folder.name}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-light)' }}>
              Created {formatDate(folder.created_at)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            className="px-4 py-1.5 rounded-md text-sm transition-colors hover:bg-gray-100"
            style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)', background: 'transparent' }}
            onClick={onAddFolder}
          >
            ADD FOLDER
          </button>
          <button
            className="px-4 py-1.5 rounded-md text-sm transition-colors hover:bg-gray-100"
            style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)', background: 'transparent' }}
            onClick={onAddNote}
          >
            ADD NOTES
          </button>
        </div>
      </div>

      {/* Notes grid */}
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <FileText size={40} className="mb-3 opacity-30" style={{ color: 'var(--text-secondary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-light)' }}>
              No notes yet — click ADD NOTES to get started
            </p>
          </div>
        ) : (
          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))' }}>
            {notes.map((note) => (
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

      {/* Subfolders — footer, fixed height, horizontal scroll */}
      <div className="flex-shrink-0 pt-6 overflow-x-auto overflow-y-hidden" style={{ borderTop: '1px solid var(--border-color)', height: '190px' }}>
        <div className="flex gap-4 pb-2">
          {subfolders.map((subfolder) => (
            <SubfolderItem
              key={subfolder.id}
              folder={subfolder}
              itemCount={itemCounts[subfolder.id] ?? 0}
              onClick={() => onSubfolderSelect(subfolder)}
              onEdit={() => onSubfolderEdit(subfolder)}
              onDelete={() => onSubfolderDelete(subfolder.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
