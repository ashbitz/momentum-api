import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireUser } from '@/lib/auth';
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

const noteSchema = z.object({
  title: z.string().min(3),
  content: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  is_pinned: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const authResult = await requireUser(request);

    if ('response' in authResult) {
      return authResult.response;
    }

    const notes = await query<NoteRow>(
      `SELECT
        id,
        title,
        content,
        color,
        is_pinned,
        created_at,
        updated_at
      FROM notes
      WHERE user_id = $1
      ORDER BY created_at DESC`,
      [authResult.userId]
    );

    return NextResponse.json(notes);
  } catch {
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireUser(request);

    if ('response' in authResult) {
      return authResult.response;
    }

    const body = await request.json();
    const result = noteSchema.safeParse(body);

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
      `INSERT INTO notes (
        user_id,
        title,
        content,
        color,
        is_pinned
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        title,
        content,
        color,
        is_pinned,
        created_at,
        updated_at`,
      [
        authResult.userId,
        title,
        content ?? null,
        color ?? null,
        is_pinned ?? false,
      ]
    );

    return NextResponse.json(note, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}
