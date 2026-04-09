export interface Folder {
  id: number;
  name: string;
  parent_id: number | null; // null = root folder
  created_at: string;
  modified_at: string;
}

export interface Note {
  id: number;
  title: string;
  content: string; // defaults to '' if not provided
  folder_id: number; // FK → folders.id (cascade delete)
  created_at: string;
  modified_at: string;
}

export interface StickyNote {
  id: number;
  title: string; // defaults to 'Quick Note'
  content: string;
  created_at: string;
  modified_at: string;
}

export interface Setting {
  key: string;
  value: string;
}

// Input types for create/update operations

export interface CreateFolderInput {
  name: string;
  parent_id?: number | null;
}

export interface UpdateFolderInput {
  name?: string;
  parent_id?: number | null;
}

export interface CreateNoteInput {
  title: string;
  content?: string;
  folder_id: number;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
}

export interface CreateStickyNoteInput {
  title?: string; // defaults to 'Quick Note'
  content: string;
}

export interface UpdateStickyNoteInput {
  title?: string;
  content?: string;
}
