-- Habits with their daily logs.
-- LEFT JOIN is used because a habit can exist even if it has no logs yet.

SELECT
  h.id,
  h.title,
  h.description,
  h.frequency,
  h.color,
  h.target,
  h.unit,
  h.is_active,
  h.created_at,
  h.updated_at,
  COALESCE(
    json_agg(
      json_build_object(
        'id', hl.id,
        'log_date', hl.log_date,
        'value', hl.value,
        'is_completed', hl.is_completed,
        'created_at', hl.created_at,
        'updated_at', hl.updated_at
      )
      ORDER BY hl.log_date
    ) FILTER (WHERE hl.id IS NOT NULL),
    '[]'
  ) AS logs
FROM habits h
LEFT JOIN habit_logs hl ON h.id = hl.habit_id
GROUP BY h.id
ORDER BY h.created_at DESC;


-- Notes with their tags.
-- LEFT JOIN is used because a note can exist without tags.

SELECT
  n.id,
  n.title,
  n.content,
  n.color,
  n.is_pinned,
  n.created_at,
  n.updated_at,
  COALESCE(
    json_agg(nt.tag ORDER BY nt.tag) FILTER (WHERE nt.id IS NOT NULL),
    '[]'
  ) AS tags
FROM notes n
LEFT JOIN note_tags nt ON n.id = nt.note_id
GROUP BY n.id
ORDER BY n.created_at DESC;


-- Pending tasks ordered by due date.
-- This query is useful for a mobile view grouped by upcoming work.

SELECT
  id,
  title,
  description,
  category,
  priority,
  due_date,
  is_completed,
  created_at,
  updated_at
FROM tasks
WHERE is_completed = FALSE
ORDER BY due_date ASC NULLS LAST, created_at DESC;