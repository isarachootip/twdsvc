import { queueHandler } from '@/lib/queues'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  return queueHandler('VD', req)
}
