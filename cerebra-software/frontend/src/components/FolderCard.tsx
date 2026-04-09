import { useState, memo } from 'react';
import { Folder, Pencil, Trash2 } from 'lucide-react';
import type { Folder as FolderType } from '../types/electron';

interface Props {
  folder: FolderType;
  itemCount?: number;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default memo(function FolderCard({ folder, itemCount = 0, onClick, onEdit, onDelete }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative rounded-xl p-5 cursor-pointer flex flex-col items-center gap-2 transition-all duration-200"
      style={{
        background: 'var(--bg-secondary)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? 'var(--card-shadow-hover)' : 'var(--card-shadow)',
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        className="absolute top-2 right-11 w-7 h-7 rounded-md flex items-center justify-center text-white text-sm transition-all duration-200"
        style={{ background: 'var(--btn-edit-bg)', opacity: hovered ? 1 : 0 }}
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        title="Rename folder"
      >
        <Pencil size={14} />
      </button>

      <button
        className="absolute top-2 right-2 w-7 h-7 rounded-md flex items-center justify-center text-white text-sm transition-all duration-200"
        style={{ background: 'var(--btn-delete-bg)', opacity: hovered ? 1 : 0 }}
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="Delete folder"
      >
        <Trash2 size={14} />
      </button>

      <Folder size={48} style={{ color: 'var(--accent-blue)' }} />

      <div className="text-base font-semibold text-center break-words w-full" style={{ color: 'var(--text-primary)' }}>
        {folder.name}
      </div>

      <div className="text-xs uppercase tracking-wide font-semibold" style={{ color: 'var(--text-light)' }}>
        FOLDER — {itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'}
      </div>
    </div>
  );
});
