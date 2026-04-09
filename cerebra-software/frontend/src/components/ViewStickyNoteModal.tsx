import { useEffect } from 'react';
import { Pin, X } from 'lucide-react';
import type { StickyNote } from '../types/electron';
import { formatDateTime } from '../utils/dateFormat';

interface Props {
    stickyNote: StickyNote;
    onClose: () => void;
}

export default function ViewStickyNoteModal({ stickyNote, onClose }: Props) {
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

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
                    <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Pin size={18} style={{ color: 'var(--accent-blue)' }} /> {stickyNote.title || 'Quick Note'}
                    </h2>
                    <button
                        className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-gray-100"
                        style={{ color: 'var(--text-secondary)' }}
                        onClick={onClose}
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="px-6 py-5">
                    <p
                        className="text-sm whitespace-pre-wrap"
                        style={{ color: 'var(--text-primary)', lineHeight: '1.8' }}
                    >
                        {stickyNote.content}
                    </p>
                </div>

                <div
                    className="flex items-center justify-between px-6 py-4 border-t"
                    style={{ borderColor: 'var(--border-color)' }}
                >
                    <span className="text-xs" style={{ color: 'var(--text-light)' }}>
                        Created {formatDateTime(stickyNote.created_at)}
                    </span>
                    <button
                        className="px-5 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
                        style={{ color: 'var(--text-secondary)' }}
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
