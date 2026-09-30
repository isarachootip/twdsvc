'use client'

import type { PhotoSlotId } from './types'

interface IllustrationProps {
  id: PhotoSlotId
  className?: string
  width?: number | string
  height?: number | string
}

export function SampleIllustration({ id, width = '100%', height = '100%' }: IllustrationProps) {
  switch (id) {
    case 'front':
      return (
        <svg viewBox="0 0 100 100" width={width} height={height} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Chuck / Collet */}
          <circle cx="50" cy="35" r="16" fill="var(--surface-2, #f3f4f6)" />
          <circle cx="50" cy="35" r="9" strokeDasharray="3 3" />
          <circle cx="50" cy="35" r="3" fill="currentColor" />
          {/* Tool Body Outline Front */}
          <path d="M30 35 C30 20, 70 20, 70 35 L68 55 C68 62, 58 64, 58 72 L58 84 C58 88, 66 88, 66 92 L34 92 C34 88, 42 88, 42 72 L42 55 C42 64, 32 62, 32 55 Z" />
          {/* Vents / Details */}
          <line x1="42" y1="23" x2="58" y2="23" />
          <line x1="40" y1="28" x2="60" y2="28" />
          {/* Battery Base */}
          <rect x="30" y="88" width="40" height="8" rx="2" fill="var(--surface-3, #e5e7eb)" />
        </svg>
      )
    case 'side':
      return (
        <svg viewBox="0 0 100 100" width={width} height={height} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Chuck on right */}
          <rect x="76" y="24" width="12" height="12" rx="1" fill="var(--surface-3, #e5e7eb)" />
          <rect x="88" y="27" width="5" height="6" rx="1" fill="currentColor" />
          {/* Main Body */}
          <path d="M22 20 L76 20 L76 40 L54 44 L48 76 L62 78 L62 88 L26 88 L26 78 L40 76 L42 44 L22 42 C16 42, 16 20, 22 20 Z" fill="var(--surface-2, #f3f4f6)" />
          {/* Trigger */}
          <path d="M52 48 C56 50, 56 56, 52 58" strokeWidth="3" />
          {/* Side Cooling Vents */}
          <line x1="28" y1="28" x2="40" y2="28" />
          <line x1="28" y1="33" x2="40" y2="33" />
          <line x1="28" y1="38" x2="38" y2="38" />
        </svg>
      )
    case 'top':
      return (
        <svg viewBox="0 0 100 100" width={width} height={height} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Tool from top view */}
          <rect x="80" y="44" width="12" height="12" rx="1" fill="var(--surface-3, #e5e7eb)" />
          {/* Body barrel */}
          <path d="M18 36 L80 38 L80 62 L18 64 C12 64, 12 36, 18 36 Z" fill="var(--surface-2, #f3f4f6)" />
          {/* Top Gear selector switch */}
          <rect x="42" y="42" width="16" height="16" rx="3" strokeWidth="2" fill="var(--surface-3, #e5e7eb)" />
          <circle cx="50" cy="50" r="3" fill="currentColor" />
          {/* Top vents */}
          <line x1="26" y1="42" x2="26" y2="58" />
          <line x1="32" y1="42" x2="32" y2="58" />
        </svg>
      )
    case 'bottom':
      return (
        <svg viewBox="0 0 100 100" width={width} height={height} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Battery base underside view */}
          <rect x="22" y="24" width="56" height="52" rx="8" fill="var(--surface-2, #f3f4f6)" />
          {/* Terminal dock contacts */}
          <rect x="36" y="32" width="28" height="16" rx="2" strokeDasharray="3 2" />
          <line x1="42" y1="36" x2="42" y2="44" strokeWidth="2" />
          <line x1="50" y1="36" x2="50" y2="44" strokeWidth="2" />
          <line x1="58" y1="36" x2="58" y2="44" strokeWidth="2" />
          {/* Feet pads & screw points */}
          <circle cx="30" cy="66" r="3" fill="currentColor" />
          <circle cx="70" cy="66" r="3" fill="currentColor" />
          <line x1="34" y1="60" x2="66" y2="60" strokeDasharray="2 3" />
        </svg>
      )
    case 'serial_no':
      return (
        <svg viewBox="0 0 100 100" width={width} height={height} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Plate / Label Frame */}
          <rect x="14" y="20" width="72" height="60" rx="5" fill="var(--surface-2, #f3f4f6)" />
          {/* Screws on plate corners */}
          <circle cx="20" cy="26" r="2" fill="currentColor" />
          <circle cx="80" cy="26" r="2" fill="currentColor" />
          <circle cx="20" cy="74" r="2" fill="currentColor" />
          <circle cx="80" cy="74" r="2" fill="currentColor" />
          {/* Model / Brand text lines */}
          <rect x="28" y="28" width="44" height="6" rx="1" fill="currentColor" opacity="0.8" />
          {/* Barcode lines */}
          <line x1="26" y1="42" x2="26" y2="56" strokeWidth="2.5" />
          <line x1="31" y1="42" x2="31" y2="56" strokeWidth="1.5" />
          <line x1="36" y1="42" x2="36" y2="56" strokeWidth="3" />
          <line x1="42" y1="42" x2="42" y2="56" strokeWidth="2" />
          <line x1="47" y1="42" x2="47" y2="56" strokeWidth="1" />
          <line x1="52" y1="42" x2="52" y2="56" strokeWidth="2.5" />
          <line x1="58" y1="42" x2="58" y2="56" strokeWidth="1.5" />
          {/* S/N number badge */}
          <rect x="26" y="62" width="48" height="8" rx="2" strokeWidth="1.5" fill="var(--surface-3, #e5e7eb)" />
          <text x="50" y="68" fontSize="6" fontFamily="monospace" textAnchor="middle" fill="currentColor" stroke="none" fontWeight="bold">S/N: 2026XX</text>
        </svg>
      )
  }
}
