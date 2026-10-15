'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Eraser } from 'lucide-react'

export interface SignatureCanvasProps {
  value: string
  onChange: (dataUrl: string) => void
  disabled?: boolean
  height?: number
  placeholder?: string
}

export default function SignatureCanvas({
  value,
  onChange,
  disabled = false,
  height = 140,
  placeholder = 'จรดนิ้วหรือลากเมาส์เพื่อลงลายมือชื่อที่นี่',
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawing = useRef(false)
  const [hasDrawn, setHasDrawn] = useState(Boolean(value))

  const renderInitial = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0) return

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2.5
    ctx.strokeStyle = '#1e293b'

    if (value && value.startsWith('data:image/')) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height)
        setHasDrawn(true)
      }
      img.src = value
    }
  }, [value])

  useEffect(() => {
    renderInitial()
  }, [renderInitial])

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return
    isDrawing.current = true
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || disabled) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasDrawn(true)
  }

  const stopDraw = () => {
    if (!isDrawing.current || disabled) return
    isDrawing.current = false
    const canvas = canvasRef.current
    if (canvas) {
      onChange(canvas.toDataURL('image/png'))
    }
  }

  const clear = () => {
    if (disabled) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return
    const rect = canvas.getBoundingClientRect()
    ctx.clearRect(0, 0, rect.width, rect.height)
    setHasDrawn(false)
    onChange('')
  }

  return (
    <div className="space-y-1.5">
      <div
        className="relative rounded-xl border border-slate-300 bg-white overflow-hidden"
        style={{ height }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none cursor-crosshair block"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {!hasDrawn && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-slate-400 select-none">
            {placeholder}
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={clear}
          disabled={disabled || !hasDrawn}
          className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-rose-600 disabled:opacity-30 px-2 py-1 transition-colors"
        >
          <Eraser size={14} />
          <span>ล้างลายเซ็น</span>
        </button>
      </div>
    </div>
  )
}
