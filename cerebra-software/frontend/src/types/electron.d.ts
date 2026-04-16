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

export interface IpcResponse<T> {
  data: T;
  error: string | null;
}

export interface ElectronAPI {
  folders: {
    getAll: () => Promise<IpcResponse<Folder[]>>;
    create: (input: { name: string; parent_id?: number | null }) => Promise<IpcResponse<Folder>>;
    update: (
      id: number,
      input: { name?: string; parent_id?: number | null }
    ) => Promise<IpcResponse<Folder | undefined>>;
    delete: (id: number) => Promise<IpcResponse<boolean>>;
    getItemCounts: () => Promise<IpcResponse<Record<number, number>>>;
  };

  notes: {
    getByFolder: (folderId: number) => Promise<IpcResponse<Note[]>>;
    create: (input: {
      title: string;
      content?: string;
      folder_id: number;
    }) => Promise<IpcResponse<Note>>;
    update: (
      id: number,
      input: { title?: string; content?: string }
    ) => Promise<IpcResponse<Note | undefined>>;
    delete: (id: number) => Promise<IpcResponse<boolean>>;
    search: (query: string) => Promise<IpcResponse<Note[]>>;
  };

  stickyNotes: {
    getAll: () => Promise<IpcResponse<StickyNote[]>>;
    create: (input: { title?: string; content: string }) => Promise<IpcResponse<StickyNote>>;
    update: (
      id: number,
      input: { title?: string; content?: string }
    ) => Promise<IpcResponse<StickyNote | undefined>>;
    delete: (id: number) => Promise<IpcResponse<boolean>>;
  };

  settings: {
    get: (key: string) => Promise<IpcResponse<string | null>>;
    set: (key: string, value: string) => Promise<IpcResponse<void>>;
    getAll: () => Promise<IpcResponse<Record<string, string>>>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
