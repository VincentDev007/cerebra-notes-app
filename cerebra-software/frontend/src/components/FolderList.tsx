/**
 * FolderList COMPONENT — frontend/src/components/FolderList.tsx
 *
 * PURPOSE:
 * Renders a responsive grid of FolderCard components.
 * Used on the homepage to display root-level folders.
 * Handles the empty state (no folders yet).
 *
 * CONTAINER vs PRESENTATIONAL PATTERN:
 * FolderList is a "container" component — it delegates rendering of each item
 * to FolderCard. It handles layout and empty state, while FolderCard handles
 * the visual details and hover interactions of each item.
 *
 * RESPONSIVE GRID:
 * gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))'
 *   - auto-fill: create as many columns as will fit in the available width
 *   - minmax(200px, 1fr): each column is at least 200px, at most 1 fraction of available space
 * Result: cards auto-wrap to fill the width, with no fixed column count.
 * Scales from 1 column on narrow windows to many columns on wide screens.
 *
 * EMPTY STATE:
 * Early return pattern: if folders.length === 0, return the empty state UI directly.
 * This keeps the main render path clean (no nested conditionals).
 *
 * itemCounts ?? 0:
 * `itemCounts[folder.id] ?? 0` → if the folder has no count (undefined), show 0.
 * The ?? operator only triggers on null/undefined, not on 0 (which would be a valid count).
 *
 * CALLBACK ADAPTERS:
 * FolderList receives callbacks with (folder: Folder) signature.
 * FolderCard expects () => void callbacks.
 * The arrow functions bridge them: () => onSelect(folder), () => onDelete(folder.id).
 * This pattern keeps FolderCard generic (doesn't need to know about Folder type directly).
 */

import type { Folder } from '../types/electron';
import FolderCard from './FolderCard';

interface Props {
  folders: Folder[];                       // The list of folders to display
  itemCounts?: Record<number, number>;     // { folderId: count } — optional, defaults to {}
  onSelect: (folder: Folder) => void;      // Navigate into folder (open as tab)
  onEdit: (folder: Folder) => void;        // Open rename modal
  onDelete: (id: number) => void;          // Trigger delete (may show confirm modal)
}

export default function FolderList({ folders, itemCounts = {}, onSelect, onEdit, onDelete }: Props) {
  // EMPTY STATE: early return if there are no folders
  if (folders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-5 opacity-50">📁</div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>No folders yet</h3>
        <p className="text-sm" style={{ color: 'var(--text-light)' }}>Create your first folder to organize your notes</p>
      </div>
    );
  }

  // GRID LAYOUT: responsive auto-fill grid of folder cards
  return (
    <div
      className="grid gap-5"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
    >
      {folders.map(folder => (
        <FolderCard
          key={folder.id}           // React key for reconciliation — must be unique and stable
          folder={folder}
          itemCount={itemCounts[folder.id] ?? 0}  // Default to 0 if no count available
          onClick={() => onSelect(folder)}          // Wrap callback to pass the folder
          onEdit={() => onEdit(folder)}
          onDelete={() => onDelete(folder.id)}      // Pass only the id for delete
        />
      ))}
    </div>
  );
}
