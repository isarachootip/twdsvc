'use client'

import { useCallback, useEffect, useState, type RefObject } from 'react'

export interface DropdownCoords {
  left: number
  width: number
  top?: number
  bottom?: number
}

export function useDropdownCoords(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  menuRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  minWidth = 270,
): DropdownCoords | null {
  const [coords, setCoords] = useState<DropdownCoords | null>(null)

  const updatePosition = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const width = Math.max(rect.width, minWidth)
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 12))
    const flipUp = window.innerHeight - rect.bottom < 270 && rect.top > 270
    setCoords(
      flipUp
        ? { left, width, bottom: window.innerHeight - rect.top + 4 }
        : { left, width, top: rect.bottom + 4 },
    )
  }, [minWidth, triggerRef])

  useEffect(() => {
    if (!open) return
    updatePosition()
    const onDocDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return
      onClose()
    }
    const onScrollOrResize = (e: Event) => {
      if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) return
      updatePosition()
    }
    document.addEventListener('mousedown', onDocDown)
    window.addEventListener('resize', onScrollOrResize)
    window.addEventListener('scroll', onScrollOrResize, true)
    return () => {
      document.removeEventListener('mousedown', onDocDown)
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('scroll', onScrollOrResize, true)
    }
  }, [menuRef, onClose, open, triggerRef, updatePosition])

  return coords
}
