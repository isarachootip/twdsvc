import { relativeRedirect } from '@/lib/http/relative-redirect'

function logout() {
  const res = relativeRedirect('/login', 303)
  res.cookies.delete('access_token')
  res.cookies.delete('refresh_token')
  return res
}

export async function POST() {
  return logout()
}

export async function GET() {
  return logout()
}
