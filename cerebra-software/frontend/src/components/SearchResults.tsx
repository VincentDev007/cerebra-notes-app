import type { Folder, Note } from '../types/electron';

interface Props {
    query: string;
    folders: Folder[];
    notes: Note[];
    onFolderClick: (folder: Folder) => void;
    onNoteClick: (note: Note) => void;
}

function formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function getPreview(content: string, maxLength = 100): string {
    if (!content || content.trim() === '') return 'No content';
    const trimmed = content.trim();
    return trimmed.length <= maxLength ? trimmed : trimmed.substring(0, maxLength) + '...';
}

export default function SearchResults({ query, folders, notes, onFolderClick, onNoteClick }: Props) {
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
