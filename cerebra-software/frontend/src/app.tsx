import React, { useState } from 'react';
import type { Folder, Note } from './types/electron';
import { useFolders } from './hooks/useFolders';
import { useNotes } from './hooks/useNotes';
import FolderList from './components/FolderList';
import NoteList from './components/NoteList';

export default function App() {
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  const { folders, remove: removeFolder } = useFolders();
  const { notes, remove: removeNote } = useNotes(selectedFolder?.id ?? null);

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>

      {/* SIDEBAR */}
      <aside className="flex flex-col flex-shrink-0 w-64" style={{ background: '#2c3e50', color: '#ecf0f1' }}>

        {/* Sidebar header */}
        <div className="flex items-center justify-center h-[72px] border-b" style={{ background: '#1a252f', borderColor: '#34495e' }}>
          <h1 className="text-2xl font-bold tracking-[3px] text-white">CEREBRA</h1>
        </div>

        {/* Folders section */}
        <div className="px-4 py-5">
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#95a5a6' }}>FOLDERS</h3>
            <button className="w-5 h-5 rounded border text-xs font-bold flex items-center justify-center transition-all hover:scale-110" style={{ borderColor: '#95a5a6', color: '#95a5a6' }}>+</button>
          </div>
          <div className="flex flex-col gap-1">
            {folders.length === 0 ? (
              <p className="text-xs italic px-3 py-2" style={{ color: '#7f8c8d' }}>No folders yet</p>
            ) : (
              folders.map(folder => (
                <div
                  key={folder.id}
                  className="px-3 py-2 rounded-md text-sm cursor-pointer transition-all hover:translate-x-1"
                  style={{
                    color: '#ecf0f1',
                    background: selectedFolder?.id === folder.id ? '#34495e' : 'transparent'
                  }}
                  onClick={() => setSelectedFolder(folder)}
                >
                  📁 {folder.name}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px" style={{ background: '#34495e' }} />

        {/* Sticky notes section */}
        <div className="px-4 py-5">
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#95a5a6' }}>STICKY NOTES</h3>
            <button className="w-5 h-5 rounded border text-xs font-bold flex items-center justify-center transition-all hover:scale-110" style={{ borderColor: '#95a5a6', color: '#95a5a6' }}>+</button>
          </div>
          <p className="text-xs italic px-3 py-2" style={{ color: '#7f8c8d' }}>No sticky notes yet</p>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Divider */}
        <div className="mx-4 h-px" style={{ background: '#34495e' }} />

        {/* Bottom buttons */}
        <div className="flex justify-center gap-2 p-4" style={{ background: '#1a252f' }}>
          <button className="w-10 h-10 rounded-lg border flex items-center justify-center text-xl transition-all hover:scale-105" style={{ borderColor: '#34495e', color: '#ecf0f1' }}>⚙</button>
          <button className="w-10 h-10 rounded-lg border flex items-center justify-center text-xl transition-all hover:scale-105" style={{ borderColor: '#34495e', color: '#ecf0f1' }}>🌙</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex flex-col flex-1 overflow-hidden">

        {/* Toolbar */}
        <div className="flex items-center px-6 h-[72px] border-b flex-shrink-0" style={{ background: '#ffffff', borderColor: '#e0e0e0' }}>
          <div className="flex flex-1 items-center rounded-xl px-4 py-2 border gap-2" style={{ background: '#f5f5f5', borderColor: '#e0e0e0' }}>
            <span style={{ color: '#7f8c8d' }}>🔍</span>
            <input className="flex-1 bg-transparent outline-none text-sm" placeholder="Search notes, folders, and content..." style={{ color: '#2c3e50' }} />
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center px-4 h-[50px] border-b gap-2 flex-shrink-0" style={{ background: '#ffffff', borderColor: '#e0e0e0' }}>
          <button className="w-9 h-9 rounded border flex items-center justify-center text-lg opacity-30 cursor-not-allowed" style={{ borderColor: '#e0e0e0' }}>←</button>
          <button className="w-9 h-9 rounded border flex items-center justify-center text-lg opacity-30 cursor-not-allowed" style={{ borderColor: '#e0e0e0' }}>→</button>

          {/* Home tab */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm cursor-pointer transition-all"
            style={{
              background: selectedFolder === null ? '#f5f5f5' : '#e0e0e0',
              fontWeight: selectedFolder === null ? 600 : 400,
              color: '#2c3e50',
              minWidth: '120px'
            }}
            onClick={() => setSelectedFolder(null)}
          >
            🏠 <span>Homepage</span>
          </div>

          {/* Folder tab */}
          {selectedFolder && (
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-semibold"
              style={{ background: '#f5f5f5', color: '#2c3e50', minWidth: '120px' }}
            >
              📁 <span className="truncate max-w-[120px]">{selectedFolder.name}</span>
              <button
                className="ml-auto text-base leading-none hover:text-red-500 transition-colors"
                style={{ color: '#7f8c8d' }}
                onClick={() => setSelectedFolder(null)}
              >×</button>
            </div>
          )}

          <button className="w-8 h-8 rounded border flex items-center justify-center text-lg font-bold ml-1 transition-all hover:bg-blue-500 hover:text-white hover:border-blue-500" style={{ borderColor: '#e0e0e0', color: '#2c3e50' }}>+</button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-8" style={{ background: '#f5f5f5' }}>
          {selectedFolder === null ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: '#2c3e50' }}>Folders</h2>
                <p className="text-sm" style={{ color: '#7f8c8d' }}>{folders.length} folder{folders.length !== 1 ? 's' : ''}</p>
              </div>
              <FolderList
                folders={folders}
                onSelect={setSelectedFolder}
                onDelete={removeFolder}
              />

              <hr className="my-10 border-0 h-px" style={{ background: 'linear-gradient(to right, transparent, #e0e0e0, transparent)' }} />

              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: '#2c3e50' }}>Sticky Notes</h2>
                <p className="text-sm" style={{ color: '#7f8c8d' }}>0 sticky notes</p>
              </div>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-6xl mb-5 opacity-50">📌</div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#7f8c8d' }}>No sticky notes yet</h3>
                <p className="text-sm" style={{ color: '#95a5a6' }}>Create a quick sticky note for reminders</p>
              </div>
            </>
          ) : (
            <NoteList
              folder={selectedFolder}
              notes={notes}
              onNoteClick={(note: Note) => console.log('open note', note.id)}
              onNoteDelete={removeNote}
              onAddNote={() => console.log('add note')}
              onAddFolder={() => console.log('add subfolder')}
            />
          )}
        </div>
      </main>
    </div>
  );
}
