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

type HabitTargetRow = {
  id: string;
  target: number;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const habitLogSchema = z.object({
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  value: z.number().int().positive().optional(),
  is_completed: z.boolean().optional(),
});

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Error desconocido';
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const authResult = await requireUser(request);

    if ('response' in authResult) {
      return authResult.response;
    }

    const { id } = await context.params;

    const logs = await query<HabitLogRow>(
      `SELECT
        habit_logs.id,
        habit_logs.habit_id,
        habit_logs.log_date::text AS log_date,
        habit_logs.value,
        habit_logs.is_completed,
        habit_logs.created_at,
        habit_logs.updated_at
      FROM habit_logs
      INNER JOIN habits ON habits.id = habit_logs.habit_id
      WHERE habit_logs.habit_id = $1 AND habits.user_id = $2
      ORDER BY habit_logs.log_date ASC`,
      [id, authResult.userId],
    );

    return NextResponse.json(logs);
  } catch (error) {
    console.error('[Momentum API] Error al obtener logs del hábito:', getErrorMessage(error));

    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const authResult = await requireUser(request);

    if ('response' in authResult) {
      return authResult.response;
    }

    const { id } = await context.params;
    const body = await request.json();
    const result = habitLogSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { errors: result.error.issues },
        { status: 400 },
      );
    }

    const [habit] = await query<HabitTargetRow>(
      `SELECT id, target
      FROM habits
      WHERE id = $1 AND user_id = $2`,
      [id, authResult.userId],
    );

    if (!habit) {
      return NextResponse.json(
        { error: 'Hábito no encontrado' },
        { status: 404 },
      );
    }

    const { log_date, value, is_completed } = result.data;
    const incrementValue = value ?? 1;
    const completedValue = is_completed ?? null;

    const [log] = await query<HabitLogRow>(
      `INSERT INTO habit_logs (
        habit_id,
        log_date,
        value,
        is_completed
      )
      VALUES (
        $1,
        $2::date,
        $3::integer,
        COALESCE($4::boolean, $3::integer >= $5::integer)
      )
      ON CONFLICT (habit_id, log_date)
      DO UPDATE SET
        value = habit_logs.value + EXCLUDED.value,
        is_completed = COALESCE(
          $4::boolean,
          habit_logs.value + EXCLUDED.value >= $5::integer
        ),
        updated_at = NOW()
      RETURNING
        id,
        habit_id,
        log_date::text AS log_date,
        value,
        is_completed,
        created_at,
        updated_at`,
      [
        id,
        log_date,
        incrementValue,
        completedValue,
        habit.target,
      ],
    );

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('[Momentum API] Error al crear log del hábito:', getErrorMessage(error));

    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 },
    );
  }
}