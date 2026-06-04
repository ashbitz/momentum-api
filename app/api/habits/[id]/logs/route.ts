import { NextResponse } from 'next/server';
import { z } from 'zod';
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
    id: string;
  }>;
};

const habitLogSchema = z.object({
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  value: z.number().int().positive().optional(),
  is_completed: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const logs = await query<HabitLogRow>(
      `SELECT
        id,
        habit_id,
        log_date::text AS log_date,
        value,
        is_completed,
        created_at,
        updated_at
      FROM habit_logs
      WHERE habit_id = $1
      ORDER BY log_date ASC`,
      [id]
    );

    return NextResponse.json(logs);
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
    const result = habitLogSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { errors: result.error.issues },
        { status: 400 }
      );
    }

    const {
      log_date,
      value,
      is_completed,
    } = result.data;

    const incrementValue = value ?? 1;

    const [log] = await query<HabitLogRow>(
      `INSERT INTO habit_logs (
        habit_id,
        log_date,
        value,
        is_completed
      )
      VALUES (
        $1,
        $2,
        $3,
        COALESCE(
          $4,
          $3 >= (
            SELECT target
            FROM habits
            WHERE id = $1
          )
        )
      )
      ON CONFLICT (habit_id, log_date)
      DO UPDATE SET
        value = habit_logs.value + EXCLUDED.value,
        is_completed = COALESCE(
          $4,
          habit_logs.value + EXCLUDED.value >= (
            SELECT target
            FROM habits
            WHERE id = $1
          )
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
        is_completed ?? null,
      ]
    );

    if (!log) {
      return NextResponse.json(
        { error: 'Hábito no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(log, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}
