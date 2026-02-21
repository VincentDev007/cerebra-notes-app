/**
 * DeleteConfirmModal COMPONENT — frontend/src/components/DeleteConfirmModal.tsx
 *
 * PURPOSE:
 * A reusable confirmation dialog used before deleting any item (folder, note, sticky note).
 * Shows a red-titled warning with a custom message, Cancel and Delete buttons.
 *
 * REUSABLE VIA PROPS:
 * This is a GENERIC confirmation modal — not tied to any specific entity.
 * The caller sets the title and message:
 *   title:   "Delete Folder", "Delete Note", "Delete Sticky Note"
 *   message: "Are you sure you want to delete this folder? This action cannot be undone."
 *
 * CONTROLLED BY confirmDelete SETTING:
 * This modal is only shown when the confirmDelete setting is 'true' (default).
 * In app.tsx, delete handlers check:
 *   if (confirmDelete) { setDeletingFolderId(id) }  → shows this modal
 *   else { await removeFolder(id) }                 → deletes immediately
 *
 * USED IN TWO CONTEXTS:
 * 1. app.tsx — for deleting folders, notes, sticky notes from the main grid
 * 2. NoteEditor — for deleting a note directly from the editor view (via its own showDeleteConfirm state)
 *
 * MODAL PATTERN (same as other modals):
 * - fixed inset-0 → covers the full viewport
 * - z-50 → renders above all other content
 * - Overlay click → onClose()
 * - Inner div click → e.stopPropagation()
 * - Escape key → onClose()
 *
 * NO STATE NEEDED:
 * This is a purely controlled component — all state lives in the parent.
 * The parent decides when to show it (by conditionally rendering it) and what to do on confirm.
 *
 * DESTRUCTIVE BUTTON STYLING:
 * The Delete button uses var(--accent-red) — distinguishes it clearly from the Cancel button.
 * The title also uses var(--accent-red) to reinforce the destructive nature of the action.
 */

import { useEffect } from 'react';

interface Props {
  title: string;     // e.g. "Delete Folder" — shown in red in the header
  message: string;   // Warning message shown in the body
  onClose: () => void;   // Cancel / Escape / overlay click
  onConfirm: () => void; // Delete button clicked
}

export default function DeleteConfirmModal({ title, message, onClose, onConfirm }: Props) {

    // Escape key → close the modal (same pattern as all other modals)
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);  // Cleanup on unmount
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'var(--modal-overlay)' }}
            onClick={onClose}
        >
            <div
                className="rounded-xl shadow-2xl w-full max-w-sm transition-colors duration-300"
                style={{ background: 'var(--bg-secondary)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="flex items-center justify-between px-6 py-4 border-b"
                    style={{ borderColor: 'var(--border-color)' }}
                >
                    <h2 className="text-lg font-bold" style={{ color: 'var(--accent-red)' }}>
                        {title}
                    </h2>
                    <button
                        className="w-8 h-8 rounded-md flex items-center justify-center text-lg transition-colors hover:bg-gray-100"
                        style={{ color: 'var(--text-secondary)' }}
                        onClick={onClose}
                    >
                        &times;
                    </button>
                </div>

                <div className="px-6 py-5">
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        {message}
                    </p>
                </div>

                <div
                    className="flex justify-end gap-3 px-6 py-4 border-t"
                    style={{ borderColor: 'var(--border-color)' }}
                >
                    <button
                        className="px-5 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
                        style={{ color: 'var(--text-secondary)' }}
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
                        style={{ background: 'var(--accent-red)' }}
                        onClick={onConfirm}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
