/**
 * FolderCard COMPONENT — frontend/src/components/FolderCard.tsx
 *
 * PURPOSE:
 * A single card in the folders grid (homepage or NoteList subfolder section).
 * Displays: folder icon, folder name, item count badge ("3 ITEMS").
 * Shows Edit (✏️) and Delete (🗑️) buttons on hover, hidden otherwise.
 * Clicking the card navigates into that folder (opens it as a tab).
 *
 * PROPS:
 *   folder     → the Folder data to display
 *   itemCount  → total direct notes + direct subfolders (defaults to 0 if not provided)
 *   onClick    → navigate into this folder (opens a tab via navigateTo in app.tsx)
 *   onEdit     → open the EditFolderModal to rename
 *   onDelete   → trigger delete (may show confirmation modal depending on settings)
 *
 * TWO ACTION BUTTONS ON HOVER:
 * Unlike NoteCard (one delete button), FolderCard has two:
 *   - Edit button (✏️) — positioned at top-right-11 (inset 44px from right)
 *   - Delete button (🗑️) — positioned at top-right-2 (inset 8px from right)
 * Both have opacity: 0 → 1 on hover, and both use e.stopPropagation()
 * to prevent the click from bubbling to the card's onClick.
 *
 * ITEM COUNT DISPLAY:
 * itemCount is passed from the parent (from getFolderItemCounts() in the DB).
 * Displays as "3 ITEMS" or "1 ITEM" (singular/plural handled with ternary).
 * itemCount = direct notes + direct subfolders (not recursive).
 *
 * SAME HOVER PATTERN AS NoteCard:
 * useState(false) + onMouseEnter/Leave drives all hover-dependent styles.
 * This is intentional — both card types have the same interaction model.
 */

import { useState, memo } from 'react';
import type { Folder } from '../types/electron';

interface Props {
  folder: Folder;
  itemCount?: number;  // Defaults to 0 via destructuring default
  onClick: () => void;   // Navigate into the folder
  onEdit: () => void;    // Open rename modal
  onDelete: () => void;  // Trigger delete (with or without confirm modal)
}

export default memo(function FolderCard({ folder, itemCount = 0, onClick, onEdit, onDelete }: Props) {
  // Drives hover animations and button visibility
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
});
