'use client'

import { useMemo } from 'react'
import { encodeCode128 } from '@/lib/barcode-128'

interface BarcodeSvgProps {
  value: string
  height?: number
  className?: string
  barColor?: string
}

/**
 * Pure SVG Code 128 Barcode.
 * Vector-rendered, crisp on high-DPI screens and thermal printers (100% vector).
 */
export default function BarcodeSvg({
  value,
  height = 55,
  className = '',
  barColor = '#000000',
}: BarcodeSvgProps) {
  // Strip spaces when encoding barcode bars to keep standard format
  const encodedValue = useMemo(() => value.replace(/\s+/g, ''), [value])
  const { bars, totalWidth } = useMemo(() => encodeCode128(encodedValue), [encodedValue])

  if (!encodedValue || totalWidth === 0) {
    return <div className={`barcode-placeholder ${className}`} style={{ height }} />
  }

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${height}`}
      preserveAspectRatio="none"
      className={className}
      style={{ width: '100%', height, display: 'block' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0" y="0" width={totalWidth} height={height} fill="#ffffff" />
      {bars.map((bar, i) => (
        <rect
          key={i}
          x={bar.x}
          y="0"
          width={bar.width}
          height={height}
          fill={barColor}
        />
      ))}
    </svg>
  )
}
