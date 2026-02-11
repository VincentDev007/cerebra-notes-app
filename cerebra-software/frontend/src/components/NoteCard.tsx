import React, { useState } from 'react';
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
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        borderLeft: '4px solid #3498db',
        boxShadow: hovered
          ? '0 8px 20px rgba(52,152,219,0.2)'
          : '0 2px 8px rgba(0,0,0,0.08)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Delete button */}
      <button
        className="absolute top-2 right-2 w-7 h-7 rounded-md flex items-center justify-center text-white text-sm transition-all duration-200"
        style={{ background: 'rgba(231,76,60,0.9)', opacity: hovered ? 1 : 0 }}
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="Delete note"
      >
        🗑️
      </button>

      {/* Icon */}
      <div className="text-5xl text-center">📝</div>

      {/* Title */}
      <div className="text-base font-semibold text-center break-words w-full" style={{ color: '#2c3e50' }}>
        {note.title}
      </div>

      {/* Content preview */}
      <div
        className="text-sm"
        style={{
          color: '#7f8c8d',
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
      <div className="text-xs uppercase tracking-wide font-semibold" style={{ color: '#95a5a6' }}>
        Created {formatDate(note.created_at)}
      </div>
    </div>
  );
}
