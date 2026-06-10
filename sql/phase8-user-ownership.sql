ALTER TABLE habits
ADD COLUMN IF NOT EXISTS user_id TEXT;

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS user_id TEXT;

ALTER TABLE notes
ADD COLUMN IF NOT EXISTS user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
