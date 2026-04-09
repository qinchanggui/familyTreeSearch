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
  // 阻止伪造的内部请求头（CVE-2025-29927 纵深防御）
  if (request.headers.has('x-middleware-subrequest')) {
    return new NextResponse(null, { status: 400 });
  }

  const response = NextResponse.next();

  // 安全头（所有页面生效）
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // API 路由额外处理
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // 来源校验：只允许本站前端请求
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const allowedHost = 'qinshizupu.com';

    const isAllowedOrigin = origin && new URL(origin).hostname.endsWith(allowedHost);
    const isAllowedReferer = referer && new URL(referer).hostname.endsWith(allowedHost);

    // SSR 请求无 origin/referer，放行；Vercel 内部请求也放行
    if (!origin && !referer) {
      return response;
    }

    if (!isAllowedOrigin && !isAllowedReferer) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // 限流
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
  }

  return response;
}

export const config = {
  matcher: '/:path((?!_next/static|_next/image|favicon\.ico|robots\.txt|sitemap\.xml).*)',
};
