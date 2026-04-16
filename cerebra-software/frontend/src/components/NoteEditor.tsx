import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, FileText, Folder, Pencil, Trash2, Save, X } from 'lucide-react';
import type { Note } from '../types/electron';
import { formatDate } from '../utils/dateFormat';
import DeleteConfirmModal from './DeleteConfirmModal';

interface Props {
  note: Note;
  folderName: string;
  onBack: () => void;
  onSave: (id: number, input: { title?: string; content?: string }) => void;
  onDelete: (id: number) => void;
}

export default function NoteEditor({ note, folderName, onBack, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);
  const [editContent, setEditContent] = useState(note.content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditing(false);
    setEditTitle(note.title);
    setEditContent(note.content);
    setShowDeleteConfirm(false);
  }, [note.id]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) return;
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave(note.id, { title: editTitle, content: editContent });
        setEditing(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
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
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-3 mb-6 rounded-xl transition-colors duration-300"
        style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--card-shadow-sm)' }}
      >
        <div className="flex items-center gap-3">
          <button
            className="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors hover:bg-gray-100"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            onClick={onBack}
            title="Back to folder"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <Folder size={13} />
            <span>{folderName}</span>
            <span className="mx-1" style={{ color: 'var(--border-color)' }}>/</span>
            <FileText size={13} />
            <span>{note.title}</span>
          </div>
        </div>

        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px"
                style={{ background: 'var(--accent-green)' }}
                onClick={handleSave}
              >
                <Save size={13} /> Save
              </button>
              <button
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:-translate-y-px hover:bg-gray-100"
                style={{ color: 'var(--text-secondary)' }}
                onClick={handleCancel}
              >
                <X size={13} /> Cancel
              </button>
            </>
          ) : (
            <>
              <button
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px"
                style={{ background: 'var(--accent-blue)' }}
                onClick={enterEditMode}
              >
                <Pencil size={13} /> Edit
              </button>
              <button
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px"
                style={{ background: 'var(--accent-red)' }}
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={13} /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Document area */}
      <div
        className="flex-1 rounded-xl px-12 py-10 transition-colors duration-300"
        style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--card-shadow-sm)' }}
      >
        <div className="max-w-3xl mx-auto">
          {/* Title */}
          {editing ? (
            <input
              className="w-full text-3xl font-bold outline-none bg-transparent border-b-2 pb-2 mb-3 transition-colors focus:border-blue-400"
              style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          ) : (
            <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              {note.title}
            </h1>
          )}

          {/* Metadata */}
          <p className="text-xs mb-8" style={{ color: 'var(--text-light)' }}>
            Created {formatDate(note.created_at)} &middot; Modified {formatDate(note.modified_at)}
          </p>

          <div className="h-px mb-8" style={{ background: 'var(--border-color)' }} />

          {/* Content */}
          {editing ? (
            <textarea
              ref={textareaRef}
              className="w-full outline-none resize-none bg-transparent text-base leading-relaxed"
              style={{
                color: 'var(--text-primary)',
                minHeight: '320px',
                fontFamily: 'inherit',
              }}
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
              <FileText
                size={40}
                className="mb-3 opacity-30"
                style={{ color: 'var(--text-secondary)' }}
              />
              <p className="text-sm" style={{ color: 'var(--text-light)' }}>
                This note is empty — click Edit to add content
              </p>
            </div>
          )}
        </div>
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
