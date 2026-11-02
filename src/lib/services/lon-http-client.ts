import http from 'http'
import https from 'https'

export interface LonHttpRequestOptions {
  url: string
  method?: 'GET' | 'POST'
  token?: string
  body?: string
  timeoutMs?: number
}

export interface LonHttpResponse {
  ok: boolean
  status: number
  statusText: string
  bodyText: string
}

export function buildLonAuthHeaders(token?: string): Record<string, string> {
  const trimmed = token?.trim() ?? ''
  if (!trimmed) return {}
  return {
    'api-key': trimmed,
    Token: trimmed,
    Authorization: `Bearer ${trimmed}`,
    'X-API-Key': trimmed,
  }
}

export function formatLonHttpError(status: number, statusText: string, bodyText: string): string {
  const lower = bodyText.toLowerCase()
  if (
    status === 403 &&
    (lower.includes('just a moment') || lower.includes('cloudflare') || lower.includes('attention required'))
  ) {
    return 'LON HTTP 403: ติดระบบป้องกัน Cloudflare WAF / Bot Challenge ของ lon.thaiwatsadu.com (กรุณา Whitelist IP เซิร์ฟเวอร์ฝั่ง Cloudflare)'
  }
  const cleanSnippet = bodyText.replace(/\s+/g, ' ').trim().slice(0, 200)
  return `LON HTTP ${status}: ${cleanSnippet || statusText}`
}

/**
 * Performs an HTTP/HTTPS request to the LON server.
 * Note: lon.thaiwatsadu.com omits the intermediate CA certificate in its TLS handshake,
 * which causes Node's default undici fetch to fail with UNABLE_TO_VERIFY_LEAF_SIGNATURE.
 */
export function lonHttpRequest(options: LonHttpRequestOptions): Promise<LonHttpResponse> {
  const { url, method = 'GET', token, body, timeoutMs = 10_000 } = options
  const parsed = new URL(url)
  const isHttps = parsed.protocol === 'https:'
  const client = isHttps ? https : http

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    ...buildLonAuthHeaders(token),
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    headers['Content-Length'] = String(Buffer.byteLength(body, 'utf8'))
  }

  return new Promise<LonHttpResponse>((resolve, reject) => {
    const req = client.request(
      parsed,
      {
        method,
        headers,
        timeout: timeoutMs,
        ...(isHttps ? { rejectUnauthorized: false } : {}),
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () => {
          const status = res.statusCode ?? 500
          const statusText = res.statusMessage ?? ''
          const bodyText = Buffer.concat(chunks).toString('utf8')
          resolve({
            ok: status >= 200 && status < 300,
            status,
            statusText,
            bodyText,
          })
        })
      }
    )

    req.on('timeout', () => {
      req.destroy(new Error(`LON request timed out after ${timeoutMs}ms`))
    })
    req.on('error', (err) => reject(err))

    if (body !== undefined) {
      req.write(body)
    }
    req.end()
  })
}
