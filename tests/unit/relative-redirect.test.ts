import { describe, it, expect, setTier } from '../framework/core'
import { relativeRedirect } from '../../src/lib/http/relative-redirect'
import { POST as logoutPost, GET as logoutGet } from '../../src/app/api/auth/logout/route'

setTier('Tier 1')

describe('Unit: Proxy-safe relative redirect (logout behind Coolify)', () => {
  it('RR-01: emits a relative Location (never a bind address like 0.0.0.0)', () => {
    const res = relativeRedirect('/login')
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe('/login')
  })

  it('RR-02: rejects protocol-relative / external targets', () => {
    expect(relativeRedirect('//evil.com').headers.get('location')).toBe('/')
    expect(relativeRedirect('https://evil.com').headers.get('location')).toBe('/')
  })

  it('RR-03: logout POST/GET redirect to /login relatively and clear cookies', async () => {
    for (const handler of [logoutPost, logoutGet]) {
      const res = await handler()
      expect(res.status).toBe(303)
      expect(res.headers.get('location')).toBe('/login')
      const setCookie = res.headers.get('set-cookie') ?? ''
      expect(setCookie.includes('access_token=')).toBe(true)
      expect(setCookie.includes('refresh_token=')).toBe(true)
    }
  })
})
