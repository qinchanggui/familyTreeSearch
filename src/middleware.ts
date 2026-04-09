import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimit = new Map<string, number[]>();
const RATE_LIMIT = 100;
const WINDOW_MS = 60 * 1000;

export function middleware(request: NextRequest) {
  // 仅对 API 路由限流
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const ip = (request as unknown as { ip?: string }).ip ?? request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const requestTimes = rateLimit.get(ip) ?? [];
  const validRequests = requestTimes.filter((time: number) => time > windowStart);

  if (validRequests.length >= RATE_LIMIT) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  validRequests.push(now);
  rateLimit.set(ip, validRequests);

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
