/**
 * StickyNoteCard COMPONENT — frontend/src/components/StickyNoteCard.tsx
 *
 * PURPOSE:
 * Displays a single sticky note in the homepage grid.
 * Structurally identical to NoteCard but with different colors and data.
 * Clicking opens the ViewStickyNoteModal (read-only view).
 * Delete button appears on hover.
 *
 * VISUAL DIFFERENCE FROM NoteCard:
 * Background uses a gradient with sticky-specific CSS vars:
 *   linear-gradient(135deg, var(--sticky-bg-from) 0%, var(--sticky-bg-to) 100%)
 * In light mode: yellow/warm tones.
 * In dark mode: different warm tones (defined in index.css).
 *
 * TITLE FALLBACK:
 * stickyNote.title || 'Quick Note' → shows 'Quick Note' if title is empty string or null.
 * The DB stores 'Quick Note' as default, but this is a safety fallback.
 *
 * CONTENT PREVIEW:
 * maxLength = 100 (slightly longer than NoteCard's 80).
 * Uses the same -webkit-line-clamp: 2 CSS trick for 2-line truncation.
 *
 * SAME PATTERN AS NoteCard/FolderCard:
 * hover state → useState(false)
 * e.stopPropagation() → prevents delete click from bubbling to card click
 */

import { useState } from 'react';
import type { StickyNote } from '../types/electron';

interface Props {
    stickyNote: StickyNote;
    onClick: () => void;    // Opens ViewStickyNoteModal
    onDelete: () => void;   // Triggers delete (with or without confirm modal)
}

/** Formats ISO 8601 string to "Jan 15, 2024" */
function formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

/**
 * getPreview() — truncates content to maxLength characters for the card preview.
 * Returns 'No content' if content is empty.
 */
function getPreview(content: string, maxLength = 100): string {
    if (!content || content.trim() === '') return 'No content';
    const trimmed = content.trim();
    return trimmed.length <= maxLength ? trimmed : trimmed.substring(0, maxLength) + '...';
}

export default function StickyNoteCard({ stickyNote, onClick, onDelete }: Props) {
    // hover drives the lift animation and delete button visibility
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className="relative rounded-xl p-5 cursor-pointer flex flex-col gap-2 transition-all duration-200"
            style={{
                background: 'linear-gradient(135deg, var(--sticky-bg-from) 0%, var(--sticky-bg-to) 100%)',
                boxShadow: hovered
                    ? 'var(--card-shadow-hover)'
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
                title="Delete sticky note"
            >
                🗑️
            </button>

            {/* Icon */}
            <div className="text-5xl text-center">📌</div>

            {/* Title */}
            <div className="text-base font-semibold text-center break-words w-full" style={{ color: 'var(--text-primary)' }}>
                {stickyNote.title || 'Quick Note'}
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
                {getPreview(stickyNote.content)}
            </div>

            {/* Date */}
            <div className="text-xs uppercase tracking-wide font-semibold" style={{ color: 'var(--text-light)' }}>
                Created {formatDate(stickyNote.created_at)}
            </div>
        </div>
    );
}
