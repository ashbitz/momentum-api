import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireUser } from '@/lib/auth';
import { query } from '@/lib/db';

type NoteTagRow = {
  id: string;
  note_id: string;
  tag: string;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const noteTagSchema = z.object({
  tag: z.string().min(2).max(100),
});

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const authResult = await requireUser(request);

    if ('response' in authResult) {
      return authResult.response;
    }

    const { id } = await context.params;

    const tags = await query<NoteTagRow>(
      `SELECT
        note_tags.id,
        note_tags.note_id,
        note_tags.tag
      FROM note_tags
      INNER JOIN notes ON notes.id = note_tags.note_id
      WHERE note_tags.note_id = $1 AND notes.user_id = $2
      ORDER BY note_tags.tag ASC`,
      [id, authResult.userId]
    );

    return NextResponse.json(tags);
  } catch {
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const authResult = await requireUser(request);

    if ('response' in authResult) {
      return authResult.response;
    }

    const { id } = await context.params;
    const body = await request.json();
    const result = noteTagSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { errors: result.error.issues },
        { status: 400 }
      );
    }

    const [note] = await query<{ id: string }>(
      `SELECT id
      FROM notes
      WHERE id = $1 AND user_id = $2`,
      [id, authResult.userId]
    );

    if (!note) {
      return NextResponse.json(
        { error: 'Nota no encontrada' },
        { status: 404 }
      );
    }

    const { tag } = result.data;

    const [noteTag] = await query<NoteTagRow>(
      `INSERT INTO note_tags (
        note_id,
        tag
      )
      VALUES ($1, $2)
      RETURNING
        id,
        note_id,
        tag`,
      [id, tag]
    );

    return NextResponse.json(noteTag, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}
