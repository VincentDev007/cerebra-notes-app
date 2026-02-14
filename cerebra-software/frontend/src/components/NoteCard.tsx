import { useState } from 'react';
import type { Note } from '../types/electron';

interface Props {
  note: Note;
  onClick: () => void;
  onDelete: () => void;
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getPreview(content: string, maxLength = 80): string {
  if (!content || content.trim() === '') return 'No content yet...';
  const trimmed = content.trim();
  return trimmed.length <= maxLength ? trimmed : trimmed.substring(0, maxLength) + '...';
}

export default function NoteCard({ note, onClick, onDelete }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative rounded-xl p-5 cursor-pointer flex flex-col gap-2 transition-all duration-200"
      style={{
        background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)',
        borderLeft: '4px solid var(--note-border)',
        boxShadow: hovered
          ? 'var(--note-shadow-hover)'
          : 'var(--card-shadow)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Delete button */}
      <button
        className="absolute top-2 right-2 w-7 h-7 rounded-md flex items-center justify-center text-white text-sm transition-all duration-200"
        style={{ background: 'var(--btn-delete-bg)', opacity: hovered ? 1 : 0 }}
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="Delete note"
      >
        🗑️
      </button>

      {/* Icon */}
      <div className="text-5xl text-center">📝</div>

      {/* Title */}
      <div className="text-base font-semibold text-center break-words w-full" style={{ color: 'var(--text-primary)' }}>
        {note.title}
      </div>

      {/* Content preview */}
      <div
        className="text-sm"
        style={{
          color: 'var(--text-secondary)',
          lineHeight: '1.5',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: '40px',
        }}
      >
        {getPreview(note.content)}
      </div>

      {/* Date */}
      <div className="text-xs uppercase tracking-wide font-semibold" style={{ color: 'var(--text-light)' }}>
        Created {formatDate(note.created_at)}
      </div>
    </div>
  );
}
