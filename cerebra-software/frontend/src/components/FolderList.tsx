import type { Folder } from '../types/electron';
import FolderCard from './FolderCard';

interface Props {
  folders: Folder[];
  itemCounts?: Record<number, number>;
  onSelect: (folder: Folder) => void;
  onEdit: (folder: Folder) => void;
  onDelete: (id: number) => void;
}

export default function FolderList({ folders, itemCounts = {}, onSelect, onEdit, onDelete }: Props) {
  if (folders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-5 opacity-50">📁</div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>No folders yet</h3>
        <p className="text-sm" style={{ color: 'var(--text-light)' }}>Create your first folder to organize your notes</p>
      </div>
    );
  }

  return (
    <div
      className="grid gap-5"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
    >
      {folders.map(folder => (
        <FolderCard
          key={folder.id}
          folder={folder}
          itemCount={itemCounts[folder.id] ?? 0}
          onClick={() => onSelect(folder)}
          onEdit={() => onEdit(folder)}
          onDelete={() => onDelete(folder.id)}
        />
      ))}
    </div>
  );
}
