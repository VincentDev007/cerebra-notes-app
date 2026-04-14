import { useState, memo } from 'react';
import { FileText, Trash2 } from 'lucide-react';
import type { Note } from '../types/electron';

interface Props {
  note: Note;
  onClick: () => void;
  onDelete: () => void;
}

export default memo(function NoteCard({ note, onClick, onDelete }: Props) {
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
        className="relative w-full h-24 rounded-lg flex items-center justify-center mb-2"
        style={{ background: 'var(--border-color)' }}
      >
        <FileText size={40} style={{ color: 'var(--text-secondary)' }} />
        <button
          className="absolute top-1 right-1 w-6 h-6 rounded flex items-center justify-center text-white transition-opacity duration-150"
          style={{ background: 'var(--btn-delete-bg)', opacity: hovered ? 1 : 0 }}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete note"
        >
          <Trash2 size={11} />
        </button>
      </div>
      <span
        className="text-sm font-medium text-center w-full truncate"
        style={{ color: 'var(--text-primary)' }}
      >
        {note.title}
      </span>
    </div>
  );
});
