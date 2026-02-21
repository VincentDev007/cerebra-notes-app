/**
 * NoteCard COMPONENT — frontend/src/components/NoteCard.tsx
 *
 * PURPOSE:
 * A single card in the notes grid inside a folder view.
 * Displays: note icon, title, content preview, creation date.
 * Shows a delete button on hover (hidden otherwise via opacity: 0 → 1).
 * Clicking the card opens the NoteEditor via the onClick callback.
 *
 * HOVER STATE PATTERN:
 * useState(false) tracks whether the mouse is over this card.
 * onMouseEnter → setHovered(true), onMouseLeave → setHovered(false).
 * The hovered boolean drives:
 *   - Visual lift: transform translateY(-4px) on hover
 *   - Shadow change: var(--note-shadow-hover) vs var(--card-shadow)
 *   - Delete button visibility: opacity 1 vs 0
 * WHY manage hover in JS instead of CSS :hover?
 * Because we need to change multiple properties (shadow, transform, opacity)
 * that are set via inline styles (for theme variable support) — CSS :hover
 * can't easily override inline styles.
 *
 * EVENT PROPAGATION:
 * The delete button uses e.stopPropagation() to prevent the click from
 * bubbling up to the parent div's onClick handler.
 * Without this, clicking Delete would also open the NoteEditor.
 *
 * CONTENT PREVIEW TRUNCATION:
 * Uses CSS -webkit-line-clamp: 2 to truncate to exactly 2 lines.
 * This is a non-standard but widely supported CSS property for multiline truncation.
 * The JS getPreview() function provides a character-count fallback.
 *
 * CSS VARIABLES for theming:
 * All colors reference CSS variables (var(--...)) defined in index.css.
 * This allows instant light/dark mode switching without component changes.
 */

import { useState } from 'react';
import type { Note } from '../types/electron';

interface Props {
  note: Note;
  onClick: () => void;    // Called when the card is clicked (opens NoteEditor)
  onDelete: () => void;   // Called when the delete button is clicked
}

/**
 * formatDate() — formats an ISO 8601 date string to a human-readable short date.
 * Input:  "2024-01-15T10:30:00.000Z"
 * Output: "Jan 15, 2024"
 */
function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * getPreview() — truncates note content for the card preview.
 * Returns 'No content yet...' if content is empty.
 * Returns full content if it fits within maxLength.
 * Returns truncated content + '...' if too long.
 * maxLength defaults to 80 characters.
 */
function getPreview(content: string, maxLength = 80): string {
  if (!content || content.trim() === '') return 'No content yet...';
  const trimmed = content.trim();
  return trimmed.length <= maxLength ? trimmed : trimmed.substring(0, maxLength) + '...';
}

export default function NoteCard({ note, onClick, onDelete }: Props) {
  // hovered drives the lift animation and delete button visibility
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
