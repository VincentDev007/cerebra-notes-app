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
    if (!editing) {
      setEditTitle(note.title);
      setEditContent(note.content);
    }
  }, [note.title, note.content, editing]);

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
    <div>
      <div
        className="flex justify-between items-start p-8 rounded-xl mb-5 transition-colors duration-300"
        style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--card-shadow-sm)' }}
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button
              className="w-8 h-8 rounded-lg border flex items-center justify-center transition-colors hover:bg-gray-100"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              onClick={onBack}
              title="Back to folder"
            >
              <ArrowLeft size={16} />
            </button>
            {editing ? (
              <input
                className="text-3xl font-bold outline-none border-b-2 px-1 bg-transparent transition-colors focus:border-blue-400"
                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            ) : (
              <h1
                className="text-3xl font-bold flex items-center gap-2"
                style={{ color: 'var(--text-primary)' }}
              >
                <FileText size={28} style={{ color: 'var(--accent-blue)' }} /> {note.title}
              </h1>
            )}
          </div>

          <p
            className="text-sm ml-11 flex items-center gap-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Folder size={12} /> {folderName} &middot; Created {formatDate(note.created_at)}{' '}
            &middot; Modified {formatDate(note.modified_at)}
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
                <Save size={14} /> Save
              </button>
              <button
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:-translate-y-px hover:bg-gray-100"
                style={{ color: 'var(--text-secondary)' }}
                onClick={handleCancel}
              >
                <X size={14} /> Cancel
              </button>
            </>
          ) : (
            <>
              <button
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px"
                style={{ background: 'var(--accent-blue)' }}
                onClick={enterEditMode}
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px"
                style={{ background: 'var(--accent-red)' }}
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 size={14} /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div
        className="rounded-xl p-8 transition-colors duration-300"
        style={{
          background: 'var(--bg-secondary)',
          minHeight: '400px',
          boxShadow: 'var(--card-shadow-sm)',
        }}
      >
        {editing ? (
          <textarea
            ref={textareaRef}
            className="w-full outline-none resize-y text-base leading-relaxed bg-transparent"
            style={{
              color: 'var(--text-primary)',
              minHeight: '400px',
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
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
              size={48}
              className="mb-4 opacity-50"
              style={{ color: 'var(--text-secondary)' }}
            />
            <h4 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
              This note is empty
            </h4>
            <p className="text-sm" style={{ color: 'var(--text-light)' }}>
              Click Edit to add content
            </p>
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
