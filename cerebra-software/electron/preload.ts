// Secure IPC bridge — exposes whitelisted channels to the renderer via contextBridge.

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  folders: {
    getAll: () => ipcRenderer.invoke('folders:getAll'),
    create: (input: { name: string; parent_id?: number | null }) =>
      ipcRenderer.invoke('folders:create', input),
    update: (id: number, input: { name?: string; parent_id?: number | null }) =>
      ipcRenderer.invoke('folders:update', id, input),
    // Cascade deletes all child notes and subfolders via FK ON DELETE CASCADE
    delete: (id: number) => ipcRenderer.invoke('folders:delete', id),
    getItemCounts: () => ipcRenderer.invoke('folders:getItemCounts'),
  },

  notes: {
    getByFolder: (folderId: number) => ipcRenderer.invoke('notes:getByFolder', folderId),
    create: (input: { title: string; content?: string; folder_id: number }) =>
      ipcRenderer.invoke('notes:create', input),
    update: (id: number, input: { title?: string; content?: string }) =>
      ipcRenderer.invoke('notes:update', id, input),
    delete: (id: number) => ipcRenderer.invoke('notes:delete', id),
    // Full-text search across title and content using FTS5
    search: (query: string) => ipcRenderer.invoke('notes:search', query),
  },

  // Sticky notes are global — not scoped to any folder
  stickyNotes: {
    getAll: () => ipcRenderer.invoke('sticky-notes:getAll'),
    create: (input: { title?: string; content: string }) =>
      ipcRenderer.invoke('sticky-notes:create', input),
    update: (id: number, input: { title?: string; content?: string }) =>
      ipcRenderer.invoke('sticky-notes:update', id, input),
    delete: (id: number) => ipcRenderer.invoke('sticky-notes:delete', id),
    search: (query: string) => ipcRenderer.invoke('sticky-notes:search', query),
  },

  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
  },
});
