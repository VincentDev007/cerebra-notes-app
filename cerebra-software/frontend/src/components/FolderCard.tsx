import React, { useState } from 'react';
import type { Folder } from '../types/electron';

interface Props {
  folder: Folder;
  onClick: () => void;
  onDelete: () => void;
}

export default function FolderCard({ folder, onClick, onDelete }: Props) {
  const [hovered, setHovered] = useState(false);

  const itemCount: number = 0;

  return (
    <div
      className="relative bg-white rounded-xl p-5 shadow-sm cursor-pointer flex flex-col items-center gap-2 transition-all duration-200"
      style={{ transform: hovered ? 'translateY(-3px)' : 'translateY(0)', boxShadow: hovered ? '0 6px 16px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.08)' }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Delete button - hidden until hover */}
      <button
        className="absolute top-2 right-2 w-7 h-7 rounded-md flex items-center justify-center text-white text-sm transition-all duration-200"
        style={{ background: 'rgba(231,76,60,0.9)', opacity: hovered ? 1 : 0 }}
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="Delete folder"
      >
        🗑️
      </button>

      {/* Icon */}
      <div className="text-5xl">📁</div>

      {/* Name */}
      <div className="text-base font-semibold text-center break-words w-full" style={{ color: '#2c3e50' }}>
        {folder.name}
      </div>

      {/* Meta */}
      <div className="text-xs uppercase tracking-wide font-semibold" style={{ color: '#95a5a6' }}>
        FOLDER — {itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'}
      </div>
    </div>
  );
}
