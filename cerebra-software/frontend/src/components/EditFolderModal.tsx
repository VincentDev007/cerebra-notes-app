/**
 * EditFolderModal COMPONENT — frontend/src/components/EditFolderModal.tsx
 *
 * PURPOSE:
 * Modal dialog for renaming an existing folder.
 * Pre-fills the input with the current folder name and allows the user to change it.
 *
 * KEY DIFFERENCES FROM CreateFolderModal:
 * 1. Initial state: useState(folder.name) — starts with the existing name
 * 2. Auto-select: inputRef.current?.select() selects all text on focus
 *    (so the user can immediately start typing the new name without manually clearing the old one)
 * 3. Submit guard: also checks trimmed === folder.name — don't save if name didn't change
 * 4. Save button: disabled if name is empty OR unchanged from original
 *    This prevents unnecessary IPC calls when nothing changed.
 *
 * DOUBLE GUARD IN handleSubmit:
 *   if (trimmed === '' || trimmed === folder.name) return;
 * - Empty check: can't save a blank folder name
 * - Unchanged check: no need to write to DB if the user didn't change anything
 *
 * DOUBLE GUARD ON SAVE BUTTON:
 *   disabled={!name.trim() || name.trim() === folder.name}
 * Same logic expressed as a disabled prop — visual feedback matches behavior.
 *
 * SAME MODAL PATTERNS AS OTHER MODALS:
 * - focus + select on mount
 * - Escape → close
 * - Overlay click → close
 * - Enter → submit
 * - e.stopPropagation() on dialog
 */

import { useState, useEffect, useRef } from 'react';
import type { Folder } from '../types/electron';

interface Props {
  folder: Folder;                         // The folder being renamed
  onClose: () => void;                    // Cancel without saving
  onSave: (id: number, newName: string) => void;  // Save with new name
}

export default function EditFolderModal({ folder, onClose, onSave }: Props) {
    // Initialize with the current folder name (not empty string like in create modals)
    const [name, setName] = useState(folder.name);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus AND select all text on mount — user can immediately type a replacement
    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();  // Select all = user can type to replace immediately
    }, []);

    // Escape key → close modal
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    /**
     * handleSubmit — validates that the name changed and is not empty, then saves.
     * Two guard conditions:
     *   trimmed === ''           → don't create a nameless folder
     *   trimmed === folder.name  → no-op if name is unchanged
     */
    const handleSubmit = () => {
        const trimmed = name.trim();
        if (trimmed === '' || trimmed === folder.name) return;  // Both checks needed
        onSave(folder.id, trimmed);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'var(--modal-overlay)' }}
            onClick={onClose}
        >
            <div
                className="rounded-xl shadow-2xl w-full max-w-md transition-colors duration-300"
                style={{ background: 'var(--bg-secondary)' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="flex items-center justify-between px-6 py-4 border-b"
                    style={{ borderColor: 'var(--border-color)' }}
                >
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                        Rename Folder
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
                    <label
                        className="block text-sm font-medium mb-2"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        New Name
                    </label>
                    <input
                        ref={inputRef}
                        className="w-full px-4 py-2 rounded-lg border text-sm outline-none transition-colors focus:border-blue-400"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', background: 'var(--input-bg)' }}
                        placeholder="Enter new folder name..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSubmit();
                        }}
                    />
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
                        style={{ background: name.trim() && name.trim() !== folder.name ? 'var(--accent-blue)' : 'var(--disabled-bg)' }}
                        onClick={handleSubmit}
                        disabled={!name.trim() || name.trim() === folder.name}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
