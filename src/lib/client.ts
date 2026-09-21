'use client'
// Client-side fetch helper: refresh token อัตโนมัติเมื่อได้ 401 (access token 15 นาที)

let refreshing: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  if (!refreshing) {
    refreshing = fetch('/api/auth/refresh', { method: 'POST' })
      .then(r => r.ok)
      .catch(() => false)
      .finally(() => { setTimeout(() => { refreshing = null }, 1000) })
  }
  return refreshing
}

export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  let res = await fetch(url, init)
  if (res.status === 401 && !url.startsWith('/api/auth/')) {
    if (await tryRefresh()) res = await fetch(url, init)
    if (res.status === 401 && typeof window !== 'undefined') {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`
    }
  }
  return res
}

export async function api<T = unknown>(url: string, opts?: { method?: string; body?: unknown }): Promise<T> {
  const res = await apiFetch(url, {
    method: opts?.method ?? (opts?.body !== undefined ? 'POST' : 'GET'),
    headers: opts?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
  })
  const text = await res.text()
  let data: unknown = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!res.ok) {
    const msg = (data && typeof data === 'object' && 'error' in data ? String((data as { error: unknown }).error) : '') || `เกิดข้อผิดพลาด (${res.status})`
    throw new Error(msg)
  }
  return data as T
}

export async function uploadFile(file: File): Promise<{ fileUrl: string; fileName: string; mimeType: string; fileSize: number }> {
  const fd = new FormData()
  fd.append('file', await compressImage(file))
  const res = await apiFetch('/api/uploads', { method: 'POST', body: fd })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? 'อัปโหลดไม่สำเร็จ')
  return data
}

/** ย่อรูปก่อนอัปโหลด (ด้านยาวสุด 1600px, jpeg 0.82) */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/heic' || file.type === 'image/heif' || file.size < 400_000) return file
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * scale)
    canvas.height = Math.round(bmp.height * scale)
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    const blob: Blob | null = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.82))
    if (!blob) return file
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}

export function todayBkk(offsetDays = 0): string {
  return new Date(Date.now() + 7 * 3600000 + offsetDays * 86400000).toISOString().slice(0, 10)
}

export function monthStartBkk(): string {
  return todayBkk().slice(0, 8) + '01'
}

export async function exportXlsx(sheets: Array<{ name: string; rows: Record<string, unknown>[] }>, fileName: string) {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()
  for (const s of sheets) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s.rows.length ? s.rows : [{}]), s.name.slice(0, 31))
  }
  XLSX.writeFile(wb, fileName)
}

export function absUrl(path: string): string {
  if (typeof window === 'undefined') return path
  return path.startsWith('http') ? path : `${window.location.origin}${path}`
}
