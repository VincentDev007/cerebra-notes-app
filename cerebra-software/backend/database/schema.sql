CREATE TABLE IF NOT EXISTS folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  modified_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  folder_id INTEGER NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  modified_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sticky_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT DEFAULT 'Quick Note',
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  modified_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);


CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);

CREATE INDEX IF NOT EXISTS idx_notes_folder_id ON notes(folder_id);

CREATE INDEX IF NOT EXISTS idx_notes_modified_at ON notes(modified_at DESC);

CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title);

CREATE INDEX IF NOT EXISTS idx_notes_folder_modified ON notes(folder_id, modified_at DESC);


CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
  title,
  content,
  content='notes',
  content_rowid='id'
);

CREATE VIRTUAL TABLE IF NOT EXISTS sticky_notes_fts USING fts5(
  title,
  content,
  content='sticky_notes',
  content_rowid='id'
);


CREATE TRIGGER IF NOT EXISTS notes_fts_insert AFTER INSERT ON notes BEGIN
  INSERT INTO notes_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
END;

CREATE TRIGGER IF NOT EXISTS notes_fts_update AFTER UPDATE ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid, title, content) VALUES('delete', old.id, old.title, old.content);
  INSERT INTO notes_fts(rowid, title, content) VALUES(new.id, new.title, new.content);
END;

CREATE TRIGGER IF NOT EXISTS notes_fts_delete AFTER DELETE ON notes BEGIN
  DELETE FROM notes_fts WHERE rowid = old.id;
END;


CREATE TRIGGER IF NOT EXISTS sticky_notes_fts_insert AFTER INSERT ON sticky_notes BEGIN
  INSERT INTO sticky_notes_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
END;

CREATE TRIGGER IF NOT EXISTS sticky_notes_fts_update AFTER UPDATE ON sticky_notes BEGIN
  INSERT INTO sticky_notes_fts(sticky_notes_fts, rowid, title, content) VALUES('delete', old.id, old.title, old.content);
  INSERT INTO sticky_notes_fts(rowid, title, content) VALUES(new.id, new.title, new.content);
END;

CREATE TRIGGER IF NOT EXISTS sticky_notes_fts_delete AFTER DELETE ON sticky_notes BEGIN
  DELETE FROM sticky_notes_fts WHERE rowid = old.id;
END;
