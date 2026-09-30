import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'svc-new-secret-2026-dev-only')

// Public routes that bypass auth
const PUBLIC_PREFIXES = [
  '/login',
  '/q/',
  '/t/',
  '/pay/',
  '/d/',
  '/s/',
  '/api/auth/',
  '/api/public/',
  '/api/webhooks/',
  '/api/files/',
  '/_next/',
  '/favicon',
  '/logo.png',
]

const ROLE_HOME: Record<string, string> = {
  CS: '/cs',
  GR: '/gr',
  DC: '/dc',
  VD: '/vd',
  S2: '/s2',
  ADMIN: '/jobs',
  EXECUTIVE: '/exec',
}

// S6: Route-level RBAC page authorization matrix
const PAGE_ROLES: Array<{ prefix: string; roles: string[] }> = [
  { prefix: '/admin', roles: ['ADMIN'] },
  { prefix: '/exec', roles: ['ADMIN', 'EXECUTIVE'] },
  { prefix: '/analytics', roles: ['ADMIN', 'EXECUTIVE'] },
  { prefix: '/reports/vd-payment', roles: ['ADMIN', 'EXECUTIVE'] },
  { prefix: '/cs', roles: ['ADMIN', 'CS'] },
  { prefix: '/gr', roles: ['ADMIN', 'GR'] },
  { prefix: '/dc', roles: ['ADMIN', 'DC'] },
  { prefix: '/vd', roles: ['ADMIN', 'VD'] },
  { prefix: '/tradein', roles: ['ADMIN', 'CS'] },
  { prefix: '/s2', roles: ['ADMIN', 'S2'] },
  { prefix: '/jobs', roles: ['ADMIN', 'EXECUTIVE', 'CS', 'GR', 'DC', 'VD', 'S2'] },
]

async function verifyToken(token?: string) {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as { sub: string; role: string; siteId?: string; vendorCenterId?: string }
  } catch {
    return null
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) return NextResponse.next()

  const payload = await verifyToken(req.cookies.get('access_token')?.value)

  // Token missing or expired
  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const next = pathname + search
    if (req.cookies.get('refresh_token')?.value) {
      const url = new URL('/api/auth/refresh', req.url)
      url.searchParams.set('next', next)
      return NextResponse.redirect(url)
    }

    const url = new URL('/login', req.url)
    if (pathname !== '/') url.searchParams.set('next', next)
    return NextResponse.redirect(url)
  }

  // Root redirect to role home
  if (pathname === '/') {
    const home = ROLE_HOME[payload.role] ?? '/jobs'
    return NextResponse.redirect(new URL(home, req.url))
  }

  // S6: Route-level RBAC Page Authorization Guard
  const pageRule = PAGE_ROLES.find(r => pathname === r.prefix || pathname.startsWith(r.prefix + '/'))
  if (pageRule && payload.role !== 'ADMIN' && !pageRule.roles.includes(payload.role)) {
    const fallbackHome = ROLE_HOME[payload.role] ?? '/jobs'
    return NextResponse.redirect(new URL(fallbackHome, req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)'],
}
