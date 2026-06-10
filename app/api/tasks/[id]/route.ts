import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireUser } from '@/lib/auth';
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

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const updateTaskSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  is_completed: z.boolean().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
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

    const [task] = await query<TaskRow>(
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
      WHERE id = $1 AND user_id = $2`,
      [id, authResult.userId]
    );

    if (!task) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
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
    const result = updateTaskSchema.safeParse(body);

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
      `UPDATE tasks
      SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        priority = COALESCE($4, priority),
        due_date = COALESCE($5, due_date),
        is_completed = COALESCE($6, is_completed),
        color = COALESCE($7, color),
        updated_at = NOW()
      WHERE id = $8 AND user_id = $9
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
        title ?? null,
        description ?? null,
        category ?? null,
        priority ?? null,
        due_date ?? null,
        is_completed ?? null,
        color ?? null,
        id,
        authResult.userId,
      ]
    );

    if (!task) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
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

    const [task] = await query<{ id: string }>(
      `DELETE FROM tasks
      WHERE id = $1 AND user_id = $2
      RETURNING id`,
      [id, authResult.userId]
    );

    if (!task) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
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
