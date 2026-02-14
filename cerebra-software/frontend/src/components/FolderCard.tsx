import { useState } from 'react';
import type { Folder } from '../types/electron';

interface Props {
  folder: Folder;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function FolderCard({ folder, onClick, onEdit, onDelete }: Props) {
  const [hovered, setHovered] = useState(false);

  const itemCount: number = 0;

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
      {/* Edit button - hidden until hover */}
      <button
        className="absolute top-2 right-11 w-7 h-7 rounded-md flex items-center justify-center text-white text-sm transition-all duration-200"
        style={{ background: 'var(--btn-edit-bg)', opacity: hovered ? 1 : 0 }}
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        title="Rename folder"
      >
        ✏️
      </button>

      {/* Delete button - hidden until hover */}
      <button
        className="absolute top-2 right-2 w-7 h-7 rounded-md flex items-center justify-center text-white text-sm transition-all duration-200"
        style={{ background: 'var(--btn-delete-bg)', opacity: hovered ? 1 : 0 }}
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="Delete folder"
      >
        🗑️
      </button>

      {/* Icon */}
      <div className="text-5xl">📁</div>

      {/* Name */}
      <div className="text-base font-semibold text-center break-words w-full" style={{ color: 'var(--text-primary)' }}>
        {folder.name}
      </div>

      {/* Meta */}
      <div className="text-xs uppercase tracking-wide font-semibold" style={{ color: 'var(--text-light)' }}>
        FOLDER — {itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'}
      </div>
    </div>
  );
}
