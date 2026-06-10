import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireUser } from '@/lib/auth';
import { query } from '@/lib/db';

type HabitLogRow = {
  id: string;
  habit_id: string;
  log_date: string;
  value: number;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

type RouteContext = {
  params: Promise<{
    logId: string;
  }>;
};

const updateHabitLogSchema = z.object({
  value: z.number().int().nonnegative().optional(),
  is_completed: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const authResult = await requireUser(request);

    if ('response' in authResult) {
      return authResult.response;
    }

    const { logId } = await context.params;
    const body = await request.json();
    const result = updateHabitLogSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { errors: result.error.issues },
        { status: 400 }
      );
    }

    const { value, is_completed } = result.data;

    const [log] = await query<HabitLogRow>(
      `UPDATE habit_logs
      SET
        value = COALESCE($1, value),
        is_completed = COALESCE($2, is_completed),
        updated_at = NOW()
      WHERE id = $3
        AND habit_id IN (
          SELECT id
          FROM habits
          WHERE user_id = $4
        )
      RETURNING
        id,
        habit_id,
        log_date::text AS log_date,
        value,
        is_completed,
        created_at,
        updated_at`,
      [
        value ?? null,
        is_completed ?? null,
        logId,
        authResult.userId,
      ]
    );

    if (!log) {
      return NextResponse.json(
        { error: 'Registro de hábito no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(log);
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

    const { logId } = await context.params;

    const [log] = await query<{ id: string }>(
      `DELETE FROM habit_logs
      WHERE id = $1
        AND habit_id IN (
          SELECT id
          FROM habits
          WHERE user_id = $2
        )
      RETURNING id`,
      [logId, authResult.userId]
    );

    if (!log) {
      return NextResponse.json(
        { error: 'Registro de hábito no encontrado' },
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
