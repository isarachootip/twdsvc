'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

interface RadioCardOption {
  value: string
  label: string
  sublabel?: string
  icon?: React.ReactNode
}

interface RadioCardGroupProps {
  label?: string
  options: RadioCardOption[]
  value: string
  onChange: (value: string) => void
  columns?: 2 | 3
  required?: boolean
}

export default function RadioCardGroup({
  label,
  options,
  value,
  onChange,
  columns = 2,
  required,
}: RadioCardGroupProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className={`grid gap-3 ${columns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {options.map((opt) => {
          const selected = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`radio-card relative ${selected ? 'selected' : ''}`}
            >
              {selected && (
                <span className="absolute top-2 right-2">
                  <CheckCircle2 size={16} style={{ color: 'var(--red)' }} />
                </span>
              )}
              {opt.icon && <span className="mb-1 text-2xl">{opt.icon}</span>}
              <span className="text-sm font-medium" style={{ color: selected ? 'var(--red-dark)' : 'var(--text)' }}>
                {opt.label}
              </span>
              {opt.sublabel && (
                <span className="text-xs mt-0.5" style={{ color: 'var(--text-mute)' }}>
                  {opt.sublabel}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
