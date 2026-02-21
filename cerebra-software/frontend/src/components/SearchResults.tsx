/**
 * SearchResults COMPONENT — frontend/src/components/SearchResults.tsx
 *
 * PURPOSE:
 * Displays search results when the user types in the search bar.
 * Shows two sections: matching FOLDERS (client-side) and matching NOTES (DB query).
 * Replaces the main content area when a search query is active.
 *
 * HOW SEARCH WORKS (from app.tsx):
 * TWO DIFFERENT SEARCH STRATEGIES:
 * 1. Notes search: IPC call → DB LIKE query across all notes → server-side
 *    Handled by: searchNotes() service → notes:search IPC → backend/notes.ts
 *
 * 2. Folders search: client-side filter on the already-loaded folders array
 *    Handled by: app.tsx filter: folders.filter(f => f.name.toLowerCase().includes(query))
 *    Why client-side? All folders are already loaded in memory — no DB round-trip needed.
 *
 * BOTH results are passed as props to this component — it's purely presentational.
 *
 * CONDITIONAL SECTIONS:
 * {folders.length > 0 && (...)} — only render the folders section if there are matches.
 * {notes.length > 0 && (...)}  — only render the notes section if there are matches.
 * This prevents empty section headers when one type has no results.
 *
 * SEARCH RESULT INTERACTION:
 * Clicking a folder: navigates into the folder + clears the search query (app.tsx)
 * Clicking a note: navigates to the note's folder, then selects the note + clears search
 *
 * DEBOUNCE (in app.tsx):
 * The search effect uses setTimeout(300ms) — waits 300ms after the last keystroke
 * before actually running the search. This prevents IPC calls on every character.
 *
 * EMPTY STATE:
 * When totalResults === 0, shows an empty state illustration.
 *
 * RESULT COUNTS:
 * totalResults = folders.length + notes.length
 * "{totalResults} result{totalResults !== 1 ? 's' : ''}" → handles singular/plural
 */

import type { Folder, Note } from '../types/electron';

interface Props {
    query: string;                           // The active search query (for display)
    folders: Folder[];                       // Client-side filtered folders
    notes: Note[];                           // Server-side searched notes
    onFolderClick: (folder: Folder) => void; // Navigate to folder + clear search
    onNoteClick: (note: Note) => void;       // Navigate to note's folder + clear search
}

/** Formats ISO 8601 string to "Jan 15, 2024" */
function formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

/** Truncates content to maxLength characters for note previews in search results */
function getPreview(content: string, maxLength = 100): string {
    if (!content || content.trim() === '') return 'No content';
    const trimmed = content.trim();
    return trimmed.length <= maxLength ? trimmed : trimmed.substring(0, maxLength) + '...';
}

export default function SearchResults({ query, folders, notes, onFolderClick, onNoteClick }: Props) {
    // Total results for the summary line ("5 results for "hello"")
    const totalResults = folders.length + notes.length;

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    Search Results
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {totalResults} result{totalResults !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
                </p>
            </div>

            {totalResults === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="text-6xl mb-5 opacity-50">🔍</div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>No results found</h3>
                    <p className="text-sm" style={{ color: 'var(--text-light)' }}>Try a different search term</p>
                </div>
            ) : (
                <>
                    {/* Matching folders */}
                    {folders.length > 0 && (
                        <div
                            className="rounded-xl p-6 mb-5 transition-colors duration-300"
                            style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--card-shadow-sm)' }}
                        >
                            <h3 className="text-lg font-semibold mb-4 pb-2 border-b-2" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
                                Folders ({folders.length})
                            </h3>
                            <div className="flex flex-col gap-1">
                                {folders.map(folder => (
                                    <div
                                        key={folder.id}
                                        className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                                        onClick={() => onFolderClick(folder)}
                                    >
                                        <span className="text-2xl">📁</span>
                                        <div>
                                            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{folder.name}</div>
                                            <div className="text-xs" style={{ color: 'var(--text-light)' }}>Created {formatDate(folder.created_at)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Matching notes */}
                    {notes.length > 0 && (
                        <div
                            className="rounded-xl p-6 mb-5 transition-colors duration-300"
                            style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--card-shadow-sm)' }}
                        >
                            <h3 className="text-lg font-semibold mb-4 pb-2 border-b-2" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
                                Notes ({notes.length})
                            </h3>
                            <div className="flex flex-col gap-1">
                                {notes.map(note => (
                                    <div
                                        key={note.id}
                                        className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                                        style={{ borderLeft: '3px solid var(--accent-blue)' }}
                                        onClick={() => onNoteClick(note)}
                                    >
                                        <span className="text-2xl">📝</span>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{note.title}</div>
                                            <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{getPreview(note.content)}</div>
                                            <div className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>Modified {formatDate(note.modified_at)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
