/**
 * NoteEditor COMPONENT — frontend/src/components/NoteEditor.tsx
 *
 * PURPOSE:
 * The full-page note editing view — shown when a note card is clicked.
 * Toggles between VIEW mode (read-only) and EDIT mode (editable title + textarea).
 *
 * TWO MODES:
 *   VIEW mode: shows title as <h1>, content as <p>, Edit/Delete buttons
 *   EDIT mode: shows title as <input>, content as <textarea>, Save/Cancel buttons
 *
 * STATE:
 *   editing        → boolean: true = edit mode, false = view mode
 *   editTitle      → local copy of the title being edited
 *   editContent    → local copy of the content being edited
 *   showDeleteConfirm → controls the inline delete confirm modal (inside NoteEditor)
 *
 * WHY LOCAL EDIT STATE?
 * The user can type into editTitle/editContent freely without saving yet.
 * The "real" note data stays unchanged in the parent until Save is clicked.
 * Cancel reverts editTitle/editContent back to note.title/note.content.
 * This is the "controlled input" pattern — React state drives the input value.
 *
 * FOUR useEffect HOOKS (each with a specific purpose):
 *
 * 1. [note.id] — Reset to view mode when the active note changes.
 *    Prevents stale edit state if the user navigates to a different note.
 *
 * 2. [note.title, note.content, editing] — Sync local edit state when the
 *    underlying note changes (e.g., after a save via the parent) but ONLY
 *    when NOT in edit mode. We don't overwrite in-progress edits.
 *
 * 3. [editing] — Auto-focus the textarea and move cursor to the end when
 *    entering edit mode. textareaRef.current.setSelectionRange(len, len)
 *    places the cursor at the end (not selecting all text).
 *
 * 4. [editing, editTitle, editContent, note.id, onSave] — Cmd+S / Ctrl+S keyboard shortcut.
 *    Only active when editing. Uses addEventListener/removeEventListener cleanup
 *    (the returned function in useEffect is the cleanup that runs on unmount/re-render).
 *    e.preventDefault() prevents the browser's save-page dialog from opening.
 *
 * useRef FOR TEXTAREA:
 * useRef<HTMLTextAreaElement>(null) gives us a stable reference to the textarea DOM node.
 * Unlike useState, changing a ref does NOT trigger a re-render.
 * Used to: focus the textarea, move cursor to end.
 *
 * KEYBOARD SHORTCUT (Cmd+S / Ctrl+S):
 * e.metaKey  = Cmd key on Mac
 * e.ctrlKey  = Ctrl key on Windows/Linux
 * Both trigger save — cross-platform keyboard shortcut handling.
 */

import { useState, useEffect, useRef } from 'react';
import type { Note } from '../types/electron';
import DeleteConfirmModal from './DeleteConfirmModal';

interface Props {
    note: Note;
    folderName: string;   // Shown in the breadcrumb below the title
    onBack: () => void;   // Navigate back to NoteList
    onSave: (id: number, input: { title?: string; content?: string }) => void;
    onDelete: (id: number) => void;
}

/** Formats ISO 8601 date string to "Jan 15, 2024" */
function formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export default function NoteEditor({ note, folderName, onBack, onSave, onDelete }: Props) {
    const [editing, setEditing] = useState(false);           // View vs edit mode
    const [editTitle, setEditTitle] = useState(note.title);   // Local edit draft
    const [editContent, setEditContent] = useState(note.content);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Ref to the textarea DOM element for focus + cursor positioning
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    /**
     * useEffect 1: Reset state when the active note changes.
     * [note.id] dependency: runs whenever a different note is selected.
     * Prevents carrying over edit state (e.g., unsaved edits) from one note to the next.
     */
    useEffect(() => {
        setEditing(false);
        setEditTitle(note.title);
        setEditContent(note.content);
        setShowDeleteConfirm(false);
    }, [note.id]);

    /**
     * useEffect 2: Sync local edit state when the underlying note data updates.
     * Only syncs when NOT editing — we don't overwrite the user's in-progress draft.
     * Runs when: note title/content changes from parent (after a save) AND we're not editing.
     */
    useEffect(() => {
        if (!editing) {
            setEditTitle(note.title);
            setEditContent(note.content);
        }
    }, [note.title, note.content, editing]);

    /**
     * useEffect 3: Auto-focus textarea and move cursor to end when entering edit mode.
     * textareaRef.current.setSelectionRange(len, len):
     *   - Sets selection start and end to the same position (no selection, just cursor)
     *   - len = content length → cursor at the very end of the text
     */
    useEffect(() => {
        if (editing && textareaRef.current) {
            textareaRef.current.focus();
            const len = textareaRef.current.value.length;
            textareaRef.current.setSelectionRange(len, len);  // Cursor at end
        }
    }, [editing]);

    /**
     * useEffect 4: Keyboard shortcut Cmd/Ctrl+S to save.
     * Only registers the listener when in edit mode (guard: if (!editing) return).
     * CLEANUP: returns () => removeEventListener — React runs this on:
     *   - Component unmount
     *   - Before re-running the effect (when deps change)
     * This prevents duplicate listeners stacking up.
     */
    useEffect(() => {
        if (!editing) return;  // Only active in edit mode
        const handleKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();  // Prevent browser's "Save Page" dialog
                onSave(note.id, { title: editTitle, content: editContent });
                setEditing(false);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);  // Cleanup on exit
    }, [editing, editTitle, editContent, note.id, onSave]);

    const enterEditMode = () => {
        setEditTitle(note.title);
        setEditContent(note.content);
        setEditing(true);
    };

    const handleSave = () => {
        onSave(note.id, { title: editTitle, content: editContent });
        setEditing(false);
    };

    const handleCancel = () => {
        setEditTitle(note.title);
        setEditContent(note.content);
        setEditing(false);
    };

    return (
        <div>
            {/* Note header */}
            <div
                className="flex justify-between items-start p-8 rounded-xl mb-5 transition-colors duration-300"
                style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--card-shadow-sm)' }}
            >
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <button
                            className="w-8 h-8 rounded-lg border flex items-center justify-center text-lg transition-colors hover:bg-gray-100"
                            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                            onClick={onBack}
                            title="Back to folder"
                        >
                            ←
                        </button>
                        {editing ? (
                            <input
                                className="text-3xl font-bold outline-none border-b-2 px-1 bg-transparent transition-colors focus:border-blue-400"
                                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                            />
                        ) : (
                            <h1 className="text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                📝 {note.title}
                            </h1>
                        )}
                    </div>

                    <p className="text-sm ml-11" style={{ color: 'var(--text-secondary)' }}>
                        📁 {folderName} &middot; Created {formatDate(note.created_at)} &middot; Modified {formatDate(note.modified_at)}
                    </p>
                </div>

                <div className="flex gap-2">
                    {editing ? (
                        <>
                            <button
                                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px"
                                style={{ background: 'var(--accent-green)' }}
                                onClick={handleSave}
                            >
                                💾 Save
                            </button>
                            <button
                                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:-translate-y-px hover:bg-gray-100"
                                style={{ color: 'var(--text-secondary)' }}
                                onClick={handleCancel}
                            >
                                ✖ Cancel
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px"
                                style={{ background: 'var(--accent-blue)' }}
                                onClick={enterEditMode}
                            >
                                ✏️ Edit
                            </button>
                            <button
                                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px"
                                style={{ background: 'var(--accent-red)' }}
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                🗑️ Delete
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Note content */}
            <div
                className="rounded-xl p-8 transition-colors duration-300"
                style={{ background: 'var(--bg-secondary)', minHeight: '400px', boxShadow: 'var(--card-shadow-sm)' }}
            >
                {editing ? (
                    <textarea
                        ref={textareaRef}
                        className="w-full outline-none resize-y text-base leading-relaxed bg-transparent"
                        style={{ color: 'var(--text-primary)', minHeight: '400px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}
                        placeholder="Write your note content here..."
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                    />
                ) : note.content ? (
                    <p
                        className="text-base leading-relaxed"
                        style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                    >
                        {note.content}
                    </p>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="text-5xl mb-4 opacity-50">📝</div>
                        <h4 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>This note is empty</h4>
                        <p className="text-sm" style={{ color: 'var(--text-light)' }}>Click Edit to add content</p>
                    </div>
                )}
            </div>

            {showDeleteConfirm && (
                <DeleteConfirmModal
                    title="Delete Note"
                    message={`Are you sure you want to delete "${note.title}"? This action cannot be undone.`}
                    onClose={() => setShowDeleteConfirm(false)}
                    onConfirm={() => {
                        onDelete(note.id);
                        setShowDeleteConfirm(false);
                    }}
                />
            )}
        </div>
    );
}
