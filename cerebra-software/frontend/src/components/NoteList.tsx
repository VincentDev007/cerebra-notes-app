import React from 'react';
import type { Folder, Note } from '../types/electron';
import NoteCard from './NoteCard';

interface Props {
  folder: Folder;
  notes: Note[];
  onNoteClick: (note: Note) => void;
  onNoteDelete: (id: number) => void;
  onAddNote: () => void;
  onAddFolder: () => void;
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function NoteList({ folder, notes, onNoteClick, onNoteDelete, onAddNote, onAddFolder }: Props) {
  return (
    <div>
      {/* Folder header */}
      <div
        className="flex justify-between items-start p-8 rounded-xl mb-5"
        style={{ background: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2" style={{ color: '#2c3e50' }}>
            📁 {folder.name}
          </h1>
          <p className="text-sm" style={{ color: '#7f8c8d' }}>
            Created {formatDate(folder.created_at)}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px"
            style={{ background: '#3498db' }}
            onClick={onAddNote}
          >
            📝 Add Note
          </button>
          <button
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px"
            style={{ background: '#3498db' }}
            onClick={onAddFolder}
          >
            📁 Add Subfolder
          </button>
        </div>
      </div>

      {/* Notes area */}
      <div
        className="rounded-xl p-6 mb-5"
        style={{ background: '#ffffff', minHeight: '300px', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}
      >
        <h3 className="text-lg font-semibold mb-5 pb-2 border-b-2" style={{ color: '#2c3e50', borderColor: '#e0e0e0' }}>
          Notes
        </h3>

        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-6xl mb-5 opacity-50">📝</div>
            <h4 className="text-lg font-semibold mb-2" style={{ color: '#7f8c8d' }}>No notes yet</h4>
            <p className="text-sm" style={{ color: '#95a5a6' }}>Add your first note to this folder</p>
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
    </div>
  );
}