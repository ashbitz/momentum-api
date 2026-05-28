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
  value: z.number().int().nonnegative().optional(),
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

    const [log] = await query<HabitLogRow>(
      `INSERT INTO habit_logs (
        habit_id,
        log_date,
        value,
        is_completed
      )
      VALUES ($1, $2, $3, $4)
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
        value ?? 1,
        is_completed ?? false,
      ]
    );

    return NextResponse.json(log, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}