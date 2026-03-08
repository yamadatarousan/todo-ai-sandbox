CREATE TABLE todos (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  is_completed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CONSTRAINT todo_title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT todo_title_within_max_length CHECK (length(title) <= 200),
  CONSTRAINT todo_is_completed_boolean CHECK (is_completed IN (0, 1))
);
