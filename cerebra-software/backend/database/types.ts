export interface Folder {
    id: number;
    name: string;
    parent_id: number | null;
    created_at: string;
    modified_at: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  folder_id: number;
  created_at: string;
  modified_at: string;
}

export interface StickyNote {
  id: number;
  title: string;
  content: string;
  created_at: string;
  modified_at: string;
}

export interface Setting {
  key: string;
  value: string;
}

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
  title?: string;
  content: string;
}
