import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  cookieStore.delete('access_token')
  cookieStore.delete('refresh_token')
  return NextResponse.redirect(new URL('/login', request.url), 303)
}

export async function GET(request: Request) {
  const cookieStore = await cookies()
  cookieStore.delete('access_token')
  cookieStore.delete('refresh_token')
  return NextResponse.redirect(new URL('/login', request.url), 303)
}
