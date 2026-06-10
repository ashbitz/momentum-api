import { NextResponse } from 'next/server';

import { getFirebaseAdminAuth } from '@/lib/firebaseAdmin';

type AuthSuccess = {
  userId: string;
};

type AuthFailure = {
  response: NextResponse;
};

export type AuthResult = AuthSuccess | AuthFailure;

export async function requireUser(request: Request): Promise<AuthResult> {
  const authorization = request.headers.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return {
      response: NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 },
      ),
    };
  }

  const token = authorization.replace('Bearer ', '').trim();

  if (!token) {
    return {
      response: NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 },
      ),
    };
  }

  try {
    const decodedToken = await getFirebaseAdminAuth().verifyIdToken(token);

    return {
      userId: decodedToken.uid,
    };
  } catch {
    return {
      response: NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 },
      ),
    };
  }
}
