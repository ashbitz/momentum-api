import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { query } from '@/lib/db';

type RouteContext = {
  params: Promise<{
    tagId: string;
  }>;
};

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const authResult = await requireUser(request);

    if ('response' in authResult) {
      return authResult.response;
    }

    const { tagId } = await context.params;

    const [tag] = await query<{ id: string }>(
      `DELETE FROM note_tags
      WHERE id = $1
        AND note_id IN (
          SELECT id
          FROM notes
          WHERE user_id = $2
        )
      RETURNING id`,
      [tagId, authResult.userId]
    );

    if (!tag) {
      return NextResponse.json(
        { error: 'Etiqueta no encontrada' },
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
