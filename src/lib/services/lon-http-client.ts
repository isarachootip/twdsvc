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
