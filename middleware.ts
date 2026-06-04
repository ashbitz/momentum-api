import { NextResponse, type NextRequest } from 'next/server';

const allowedOrigins = new Set([
  'http://localhost:8081',
  'http://localhost:19006',
  'http://localhost:3000',
  'https://momentum-appbeta.vercel.app',
]);

const allowedMethods = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
const allowedHeaders = 'Content-Type, Authorization';

function isAllowedOrigin(origin: string | null) {
  if (!origin) {
    return false;
  }

  if (allowedOrigins.has(origin)) {
    return true;
  }

  return /^https:\/\/momentum-[a-z0-9-]+\.vercel\.app$/.test(origin);
}

function applyCorsHeaders(response: NextResponse, origin: string | null) {
  if (isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin as string);
    response.headers.set('Vary', 'Origin');
  }

  response.headers.set('Access-Control-Allow-Methods', allowedMethods);
  response.headers.set('Access-Control-Allow-Headers', allowedHeaders);

  return response;
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');

  if (request.method === 'OPTIONS') {
    return applyCorsHeaders(new NextResponse(null, { status: 204 }), origin);
  }

  return applyCorsHeaders(NextResponse.next(), origin);
}

export const config = {
  matcher: '/api/:path*',
};
