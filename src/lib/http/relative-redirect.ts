import { NextResponse } from 'next/server'

/**
 * Redirect using a RELATIVE Location header.
 *
 * Why: in Route Handlers behind a reverse proxy (Coolify/Traefik) with
 * `next start -H 0.0.0.0`, `request.url` resolves to the bind address
 * (e.g. https://0.0.0.0:3000), not the public domain. A relative Location
 * lets the browser resolve against the URL it is actually on.
 *
 * Only same-origin paths are accepted ("/..." but not "//...").
 */
export function relativeRedirect(path: string, status: 302 | 303 | 307 = 303): NextResponse {
  const safe = path.startsWith('/') && !path.startsWith('//') ? path : '/'
  return new NextResponse(null, { status, headers: { Location: safe } })
}
