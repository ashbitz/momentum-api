import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

type RouteContext = {
  params: Promise<{
    tagId: string;
  }>;
};

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const { tagId } = await context.params;

    const [tag] = await query<{ id: string }>(
      `DELETE FROM note_tags
      WHERE id = $1
      RETURNING id`,
      [tagId]
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