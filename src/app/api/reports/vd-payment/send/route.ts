import { NextRequest } from 'next/server'
import { POST as batchPost } from '../batch/route'

export async function POST(req: NextRequest) {
  return batchPost(req)
}
