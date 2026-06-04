import { NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: string;
  due_date: string | null;
  is_completed: boolean;
  color: string | null;
  created_at: string;
  updated_at: string;
};

const taskSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  is_completed: z.boolean().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
});

export async function GET() {
  try {
    const tasks = await query<TaskRow>(
      `SELECT
        id,
        title,
        description,
        category,
        priority,
        due_date::text AS due_date,
        is_completed,
        color,
        created_at,
        updated_at
      FROM tasks
      ORDER BY created_at DESC`
    );

    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = taskSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { errors: result.error.issues },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      category,
      priority,
      due_date,
      is_completed,
      color,
    } = result.data;

    const [task] = await query<TaskRow>(
      `INSERT INTO tasks (
        title,
        description,
        category,
        priority,
        due_date,
        is_completed,
        color
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        title,
        description,
        category,
        priority,
        due_date::text AS due_date,
        is_completed,
        color,
        created_at,
        updated_at`,
      [
        title,
        description ?? null,
        category ?? null,
        priority ?? 'medium',
        due_date ?? null,
        is_completed ?? false,
        color ?? null,
      ]
    );

    return NextResponse.json(task, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}
