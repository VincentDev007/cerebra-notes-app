interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
  created_at: string;
  modified_at: string;
}

interface Note {
  id: number;
  title: string;
  content: string;
  folder_id: number;
  created_at: string;
  modified_at: string;
}

interface StickyNote {
  id: number;
  title: string;
  content: string;
  created_at: string;
  modified_at: string;
}

interface ElectronAPI {
  folders: {
    getAll: () => Promise<Folder[]>;
    create: (input: { name: string; parent_id?: number | null }) => Promise<Folder>;
    update: (id: number, input: { name?: string; parent_id?: number | null }) => Promise<Folder | undefined>;
    delete: (id: number) => Promise<boolean>;
  };
  notes: {
    getByFolder: (folderId: number) => Promise<Note[]>;
    create: (input: { title: string; content?: string; folder_id: number }) => Promise<Note>;
    update: (id: number, input: { title?: string; content?: string }) => Promise<Note | undefined>;
    delete: (id: number) => Promise<boolean>;
    search: (query: string) => Promise<Note[]>;
  };
  stickyNotes: {
    getAll: () => Promise<StickyNote[]>;
    create: (input: { title?: string; content: string }) => Promise<StickyNote>;
    update: (id: number, input: { title?: string; content?: string }) => Promise<StickyNote | undefined>;
    delete: (id: number) => Promise<boolean>;
  };
  settings: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<void>;
    getAll: () => Promise<Record<string, string>>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
