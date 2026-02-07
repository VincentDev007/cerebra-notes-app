import { contextBridge, ipcRenderer } from 'electron';

// Security bridge - exposes safe APIs to the frontend
// For now, this is empty. We'll add database functions later.

contextBridge.exposeInMainWorld('electronAPI', {
  folders: {
    getAll: () => ipcRenderer.invoke('folders:getAll'),
    create: (input: { name: string; parent_id?: number | null }) =>
      ipcRenderer.invoke('folders:create', input),
    update: (id: number, input: { name?: string; parent_id?: number | null }) =>
      ipcRenderer.invoke('folders:update', id, input),
    delete: (id: number) => ipcRenderer.invoke('folders:delete', id),
  },

  notes: {
    getByFolder: (folderId: number) => ipcRenderer.invoke('notes:getByFolder', folderId),
    create: (input: { title: string; content?: string; folder_id: number }) =>
      ipcRenderer.invoke('notes:create', input),
    update: (id: number, input: { title?: string; content?: string }) =>
      ipcRenderer.invoke('notes:update', id, input),
    delete: (id: number) => ipcRenderer.invoke('notes:delete', id),
    search: (query: string) => ipcRenderer.invoke('notes:search', query),
  },

  stickyNotes: {
    getAll: () => ipcRenderer.invoke('sticky-notes:getAll'),
    create: (input: { title?: string; content: string }) =>
      ipcRenderer.invoke('sticky-notes:create', input),
    update: (id: number, input: { title?: string; content?: string }) =>
      ipcRenderer.invoke('sticky-notes:update', id, input),
    delete: (id: number) => ipcRenderer.invoke('sticky-notes:delete', id),
  },

  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
  },
});
