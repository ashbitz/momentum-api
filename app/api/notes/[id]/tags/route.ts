import { NextResponse } from 'next/server';
import { z } from 'zod';
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
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const tags = await query<NoteTagRow>(
      `SELECT
        id,
        note_id,
        tag
      FROM note_tags
      WHERE note_id = $1
      ORDER BY tag ASC`,
      [id]
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
    const { id } = await context.params;
    const body = await request.json();
    const result = noteTagSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { errors: result.error.issues },
        { status: 400 }
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