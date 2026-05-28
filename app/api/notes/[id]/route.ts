import { NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';

type NoteRow = {
  id: string;
  title: string;
  content: string | null;
  color: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const updateNoteSchema = z.object({
  title: z.string().min(3).optional(),
  content: z.string().nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  is_pinned: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const [note] = await query<NoteRow>(
      `SELECT
        id,
        title,
        content,
        color,
        is_pinned,
        created_at,
        updated_at
      FROM notes
      WHERE id = $1`,
      [id]
    );

    if (!note) {
      return NextResponse.json(
        { error: 'Nota no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(note);
  } catch {
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const result = updateNoteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { errors: result.error.issues },
        { status: 400 }
      );
    }

    const {
      title,
      content,
      color,
      is_pinned,
    } = result.data;

    const [note] = await query<NoteRow>(
      `UPDATE notes
      SET
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        color = COALESCE($3, color),
        is_pinned = COALESCE($4, is_pinned),
        updated_at = NOW()
      WHERE id = $5
      RETURNING
        id,
        title,
        content,
        color,
        is_pinned,
        created_at,
        updated_at`,
      [
        title ?? null,
        content ?? null,
        color ?? null,
        is_pinned ?? null,
        id,
      ]
    );

    if (!note) {
      return NextResponse.json(
        { error: 'Nota no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(note);
  } catch {
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const [note] = await query<{ id: string }>(
      `DELETE FROM notes
      WHERE id = $1
      RETURNING id`,
      [id]
    );

    if (!note) {
      return NextResponse.json(
        { error: 'Nota no encontrada' },
        { status: 404 }
      );
    }

    return new Response(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}