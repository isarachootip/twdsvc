'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/client'

export interface Me { user: { id: string; role: string; fullName: string; siteId: string | null; siteName?: string | null; vendorCenterId: string | null; vendorLabel?: string | null }; menus: string[]; canViewCost: boolean; demoMode: boolean }

let cache: Promise<Me> | null = null

export function useMe() {
  const [me, setMe] = useState<Me | null>(null)
  useEffect(() => {
    if (!cache) cache = api<Me>('/api/me').catch(e => { cache = null; throw e })
    cache.then(setMe).catch(() => {})
  }, [])
  return me
}
