import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireUser } from '@/lib/auth';
import { query } from '@/lib/db';

type HabitRow = {
  id: string;
  title: string;
  description: string | null;
  frequency: string;
  color: string | null;
  target: number;
  unit: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const updateHabitSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().nullable().optional(),
  frequency: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  target: z.number().int().positive().optional(),
  unit: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
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

    const [habit] = await query<HabitRow>(
      `SELECT
        id,
        title,
        description,
        frequency,
        color,
        target,
        unit,
        is_active,
        created_at,
        updated_at
      FROM habits
      WHERE id = $1 AND user_id = $2`,
      [id, authResult.userId]
    );

    if (!habit) {
      return NextResponse.json(
        { error: 'Hábito no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(habit);
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
    const authResult = await requireUser(request);

    if ('response' in authResult) {
      return authResult.response;
    }

    const { id } = await context.params;
    const body = await request.json();
    const result = updateHabitSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { errors: result.error.issues },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      frequency,
      color,
      target,
      unit,
      is_active,
    } = result.data;

    const [habit] = await query<HabitRow>(
      `UPDATE habits
      SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        frequency = COALESCE($3, frequency),
        color = COALESCE($4, color),
        target = COALESCE($5, target),
        unit = COALESCE($6, unit),
        is_active = COALESCE($7, is_active),
        updated_at = NOW()
      WHERE id = $8 AND user_id = $9
      RETURNING
        id,
        title,
        description,
        frequency,
        color,
        target,
        unit,
        is_active,
        created_at,
        updated_at`,
      [
        title ?? null,
        description ?? null,
        frequency ?? null,
        color ?? null,
        target ?? null,
        unit ?? null,
        is_active ?? null,
        id,
        authResult.userId,
      ]
    );

    if (!habit) {
      return NextResponse.json(
        { error: 'Hábito no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(habit);
  } catch {
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const authResult = await requireUser(request);

    if ('response' in authResult) {
      return authResult.response;
    }

    const { id } = await context.params;

    const [habit] = await query<{ id: string }>(
      `DELETE FROM habits
      WHERE id = $1 AND user_id = $2
      RETURNING id`,
      [id, authResult.userId]
    );

    if (!habit) {
      return NextResponse.json(
        { error: 'Hábito no encontrado' },
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
