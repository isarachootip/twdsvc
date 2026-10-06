import { useEffect, useRef, useState, useCallback } from 'react'
import type { VendorSetupFormData } from './types'
import { DRAFT_KEY, parseDraft, serializeDraft, type VendorDraft } from './draft-codec'

const SAVE_DELAY_MS = 500

interface Options {
  form: VendorSetupFormData
  step: number
  enabled: boolean
  onRestore: (draft: VendorDraft) => void
}

/** Restores a saved draft once after mount, then debounce-saves changes to localStorage. */
export function useDraftStorage({ form, step, enabled, onRestore }: Options) {
  const [draftRestored, setDraftRestored] = useState(false)
  const [ready, setReady] = useState(false)
  const restoreRef = useRef(onRestore)
  restoreRef.current = onRestore

  useEffect(() => {
    try {
      const draft = parseDraft(localStorage.getItem(DRAFT_KEY))
      if (draft) {
        restoreRef.current(draft)
        setDraftRestored(true)
      } else {
        localStorage.removeItem(DRAFT_KEY)
      }
    } catch {
      // storage unavailable (private mode / blocked) — continue without drafts
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready || !enabled) return
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, serializeDraft(form, step))
      } catch {
        // quota exceeded or blocked — ignore, drafting is best-effort
      }
    }, SAVE_DELAY_MS)
    return () => clearTimeout(t)
  }, [form, step, ready, enabled])

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      // ignore
    }
  }, [])

  return { draftRestored, clearDraft }
}
