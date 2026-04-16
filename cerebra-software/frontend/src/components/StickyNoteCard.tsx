import { useState, memo } from 'react';
import { Pin, Trash2 } from 'lucide-react';
import type { StickyNote } from '../types/electron';
import { formatDate } from '../utils/dateFormat';

interface Props {
  stickyNote: StickyNote;
  onClick: () => void;
  onDelete: () => void;
}

function getPreview(content: string, maxLength = 100): string {
  if (!content || content.trim() === '') return 'No content';
  const trimmed = content.trim();
  return trimmed.length <= maxLength ? trimmed : trimmed.substring(0, maxLength) + '...';
}

export default memo(function StickyNoteCard({ stickyNote, onClick, onDelete }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative rounded-xl p-5 cursor-pointer flex flex-col gap-2 transition-all duration-200"
      style={{
        background: 'linear-gradient(135deg, var(--sticky-bg-from) 0%, var(--sticky-bg-to) 100%)',
        boxShadow: hovered ? 'var(--card-shadow-hover)' : 'var(--card-shadow)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        className="absolute top-2 right-2 w-7 h-7 rounded-md flex items-center justify-center text-white text-sm transition-all duration-200"
        style={{ background: 'var(--btn-delete-bg)', opacity: hovered ? 1 : 0 }}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete sticky note"
      >
        <Trash2 size={14} />
      </button>

      <div className="flex justify-center">
        <Pin size={48} style={{ color: 'var(--accent-blue)' }} />
      </div>

      <div
        className="text-base font-semibold text-center break-words w-full"
        style={{ color: 'var(--text-primary)' }}
      >
        {stickyNote.title || 'Quick Note'}
      </div>

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
        {getPreview(stickyNote.content)}
      </div>

      <div
        className="text-xs uppercase tracking-wide font-semibold"
        style={{ color: 'var(--text-light)' }}
      >
        Created {formatDate(stickyNote.created_at)}
      </div>
    </div>
  );
});
