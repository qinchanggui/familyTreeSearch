import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimit = new Map<string, number[]>();
const RATE_LIMIT = 100;
const WINDOW_MS = 60 * 1000;
const CLEANUP_INTERVAL = 500; // 每500次请求清理一次

let requestCount = 0;

function cleanupExpired() {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  for (const [ip, times] of rateLimit.entries()) {
    const valid = times.filter(t => t > windowStart);
    if (valid.length === 0) {
      rateLimit.delete(ip);
    } else {
      rateLimit.set(ip, valid);
    }
  }
}

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  requestCount++;
  if (requestCount % CLEANUP_INTERVAL === 0) {
    cleanupExpired();
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
