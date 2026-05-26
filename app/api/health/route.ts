import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query<{ status: string }>(
      "SELECT 'ok' AS status"
    );

    return NextResponse.json({
      status: result[0]?.status ?? 'unknown',
    });
  } catch {
    return NextResponse.json(
      { error: 'Error interno' },
      { status: 500 }
    );
  }
}