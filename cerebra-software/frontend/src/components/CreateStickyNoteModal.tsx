/**
 * CreateStickyNoteModal COMPONENT — frontend/src/components/CreateStickyNoteModal.tsx
 *
 * PURPOSE:
 * Modal for creating a new sticky note. Has TWO fields:
 *   - Title (optional): text input, defaults to 'Quick Note'
 *   - Content (required): textarea, the main body of the sticky note
 *
 * DIFFERENCES FROM OTHER CREATE MODALS:
 * 1. Two fields: title + content (other create modals have one field)
 * 2. Auto-focus targets the TEXTAREA (content), not the title input.
 *    Content is the required field — user will start typing there first.
 * 3. Create button is disabled when content is empty (NOT when title is empty — title is optional)
 * 4. The onCreate callback order is (content, title?) — content first.
 *    This matches useStickyNotes.create(content, title) argument order.
 *
 * TITLE OPTIONAL PATTERN:
 *   title.trim() || undefined
 *   → If title is empty string after trimming, pass undefined (not empty string)
 *   → The service layer then passes undefined to the DB which uses 'Quick Note' default
 *   → This ensures the DB stores 'Quick Note' (not blank) when no title given
 *
 * CONTENT REQUIRED:
 * Sticky notes require content (unlike regular notes which can be content-less).
 * The Create button uses content.trim() as the enabled condition.
 *
 * SAME MODAL PATTERNS AS ALL OTHER MODALS:
 * - Auto-focus on mount (but targeting textarea, not input)
 * - Escape → close
 * - Overlay click → close
 * - e.stopPropagation() on dialog
 */

import { useState, useEffect, useRef } from 'react';

interface Props {
    onClose: () => void;
    onCreate: (content: string, title?: string) => void;  // content first, title optional
}

export default function CreateStickyNoteModal({ onClose, onCreate }: Props) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const contentRef = useRef<HTMLTextAreaElement>(null);  // Auto-focus on the textarea

    // Auto-focus the content textarea (content is required and the main input)
    useEffect(() => {
        contentRef.current?.focus();
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
     * handleSubmit — validates content and calls onCreate.
     *
     * title.trim() || undefined:
     *   - If title is blank → pass undefined (service uses 'Quick Note' default)
     *   - If title has text → pass the trimmed string
     * This ensures we never pass an empty string as the title to the DB.
     */
    const handleSubmit = () => {
        const trimmedContent = content.trim();
        if (!trimmedContent) return;  // Content is required — don't submit if empty
        onCreate(trimmedContent, title.trim() || undefined);  // Title is optional
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
                        Create Sticky Note
                    </h2>
                    <button
                        className="w-8 h-8 rounded-md flex items-center justify-center text-lg transition-colors hover:bg-gray-100"
                        style={{ color: 'var(--text-secondary)' }}
                        onClick={onClose}
                    >
                        &times;
                    </button>
                </div>

                <div className="px-6 py-5 flex flex-col gap-4">
                    <div>
                        <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            Title <span className="font-normal" style={{ color: 'var(--text-light)' }}>(optional)</span>
                        </label>
                        <input
                            className="w-full px-4 py-2 rounded-lg border text-sm outline-none transition-colors focus:border-blue-400"
                            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', background: 'var(--input-bg)' }}
                            placeholder="Quick Note"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            Content
                        </label>
                        <textarea
                            ref={contentRef}
                            className="w-full px-4 py-2 rounded-lg border text-sm outline-none transition-colors focus:border-blue-400 resize-y"
                            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', minHeight: '120px', background: 'var(--input-bg)' }}
                            placeholder="Write your sticky note..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>
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
                        style={{ background: content.trim() ? 'var(--accent-blue)' : 'var(--disabled-bg)' }}
                        onClick={handleSubmit}
                        disabled={!content.trim()}
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
}
