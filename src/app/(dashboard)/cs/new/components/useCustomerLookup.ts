'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/client'
import type { CustomerLookupResult } from './CustomerSection'

interface UseCustomerLookupProps {
  initialPhone?: string
  onApplyCustomer: (cust: CustomerLookupResult) => void
}

export function useCustomerLookup({ initialPhone = '', onApplyCustomer }: UseCustomerLookupProps) {
  const [phone, setPhoneState] = useState(initialPhone)
  const [candidates, setCandidates] = useState<CustomerLookupResult[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [found, setFound] = useState<CustomerLookupResult | null>(null)
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const lastAppliedPhoneRef = useRef<string>('')
  const applyRef = useRef(onApplyCustomer)
  applyRef.current = onApplyCustomer

  const setPhone = useCallback((val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10)
    setPhoneState(digits)
    setDropdownOpen(true)
    if (digits !== lastAppliedPhoneRef.current) {
      setFound(null)
      setIsNewCustomer(false)
    }
  }, [])

  const pickCustomer = useCallback((cust: CustomerLookupResult) => {
    const cleanPhone = cust.customerPhone.replace(/\D/g, '')
    lastAppliedPhoneRef.current = cleanPhone
    setPhoneState(cleanPhone)
    setFound(cust)
    setIsNewCustomer(false)
    setDropdownOpen(false)
    setCandidates([])
    applyRef.current(cust)
  }, [])

  const closeDropdown = useCallback(() => {
    setDropdownOpen(false)
  }, [])

  useEffect(() => {
    const d = phone.replace(/\D/g, '')
    if (d.length < 3) {
      setCandidates([])
      setSearching(false)
      setIsNewCustomer(false)
      return
    }

    let cancelled = false
    setSearching(true)

    const timer = setTimeout(async () => {
      try {
        const res = await api<{ candidates: CustomerLookupResult[] }>(
          `/api/customers/lookup?q=${encodeURIComponent(d)}&limit=6`
        )
        if (cancelled) return
        const list = res?.candidates ?? []
        setCandidates(list)

        if (/^0\d{8,9}$/.test(d)) {
          const exactFromList = list.find(c => c.customerPhone.replace(/\D/g, '') === d)
          const exact =
            exactFromList ??
            (await api<CustomerLookupResult | null>(`/api/customers/lookup?phone=${d}`))
          if (cancelled) return

          if (exact && exact.customerName) {
            setFound(exact)
            setIsNewCustomer(false)
            if (lastAppliedPhoneRef.current !== d) {
              lastAppliedPhoneRef.current = d
              setDropdownOpen(false)
              applyRef.current(exact)
            }
          } else {
            setFound(null)
            setIsNewCustomer(true)
          }
        }
      } catch {
        if (!cancelled) {
          setCandidates([])
        }
      } finally {
        if (!cancelled) {
          setSearching(false)
        }
      }
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [phone])

  return {
    phone,
    setPhone,
    candidates: dropdownOpen ? candidates : [],
    searching,
    found,
    setFound,
    isNewCustomer,
    pickCustomer,
    closeDropdown,
  }
}
