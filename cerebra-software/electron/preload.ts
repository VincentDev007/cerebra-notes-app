import { contextBridge } from 'electron';

// Security bridge - exposes safe APIs to the frontend
// For now, this is empty. We'll add database functions later.

contextBridge.exposeInMainWorld('electronAPI', {
  // Database functions will go here in Day 2-3
  // Example: createNote, updateNote, deleteNote, etc.
});