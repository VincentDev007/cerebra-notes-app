/**
 * CreateFolderModal COMPONENT — frontend/src/components/CreateFolderModal.tsx
 *
 * PURPOSE:
 * Modal dialog for creating a new folder (root or subfolder).
 * Nearly identical to CreateNoteModal — same modal pattern, just folder-specific.
 *
 * KEY DIFFERENCE FROM CreateNoteModal:
 * Receives a `parentId` prop that determines if we're creating a root or subfolder.
 *   parentId = null   → "Create New Folder" (root level)
 *   parentId = number → "Create Subfolder" (child of that parent)
 * The title dynamically reflects this: parentId !== null ? 'Create Subfolder' : 'Create New Folder'
 *
 * In app.tsx, createFolderParentId state controls this:
 *   Sidebar "+" button:      setCreateFolderParentId(null) → root folder
 *   NoteList "Add Subfolder": setCreateFolderParentId(selectedFolder.id) → subfolder
 *
 * SAME MODAL PATTERNS AS ALL OTHER MODALS:
 * - Auto-focus input on mount
 * - Escape key closes modal
 * - Overlay click closes modal
 * - e.stopPropagation() on the dialog prevents overlay click from firing
 * - Enter key submits the form
 * - Disabled Create button when input is empty
 *
 * handleSubmit passes both (name, parentId) to onCreate — the parent (app.tsx)
 * then calls useFolders.create(name, parentId) → folderService → IPC → DB.
 */

import { useState, useEffect, useRef } from 'react';

interface Props {
  parentId: number | null;  // null = root folder, number = subfolder of that parent
  onClose: () => void;
  onCreate: (name: string, parentId: number | null) => void;
}

export default function CreateFolderModal({ parentId, onClose, onCreate }: Props) {
    const [name, setName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus the name input when modal opens
    useEffect(() => {
        inputRef.current?.focus();
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
     * handleSubmit — validates name and calls onCreate with both name and parentId.
     * parentId is passed through from props — the modal itself doesn't need to know
     * whether it's creating a root or subfolder; it just passes parentId along.
     */
    const handleSubmit = () => {
        const trimmed = name.trim();
        if (trimmed === '') return;  // Don't create folder with empty name
        onCreate(trimmed, parentId);  // Pass parentId through to the parent handler
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
                        {parentId !== null ? 'Create Subfolder' : 'Create New Folder'}
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
                        Folder Name
                    </label>
                    <input
                        ref={inputRef}
                        className="w-full px-4 py-2 rounded-lg border text-sm outline-none transition-colors focus:border-blue-400"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', background: 'var(--input-bg)' }}
                        placeholder="Enter folder name..."
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
                        style={{ background: name.trim() ? 'var(--accent-blue)' : 'var(--disabled-bg)' }}
                        onClick={handleSubmit}
                        disabled={!name.trim()}
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
}
