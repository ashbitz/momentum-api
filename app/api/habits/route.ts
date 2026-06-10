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

const habitSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  frequency: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  target: z.number().int().positive().optional(),
  unit: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const authResult = await requireUser(request);

    if ('response' in authResult) {
      return authResult.response;
    }

    const habits = await query<HabitRow>(
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
      WHERE user_id = $1
      ORDER BY created_at DESC`,
      [authResult.userId]
    );

    return NextResponse.json(habits);
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
    const result = habitSchema.safeParse(body);

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
    } = result.data;

    const [habit] = await query<HabitRow>(
      `INSERT INTO habits (
        user_id,
        title,
        description,
        frequency,
        color,
        target,
        unit
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
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
        authResult.userId,
        title,
        description ?? null,
        frequency ?? 'daily',
        color ?? null,
        target ?? 1,
        unit ?? null,
      ]
    );

    return NextResponse.json(habit, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}
