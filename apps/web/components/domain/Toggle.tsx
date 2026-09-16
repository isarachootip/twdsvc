import React from 'react';
import { cn } from '@/lib/utils';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className,
}) => {
  const isSm = size === 'sm';

  return (
    <label
      className={cn(
        'inline-flex items-start gap-3 cursor-pointer select-none',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
    >
      <div className="relative inline-flex items-center shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={cn(
            'rounded-full transition-colors duration-200 ease-in-out',
            isSm ? 'w-8 h-4.5' : 'w-10 h-5.5',
            checked ? 'bg-red' : 'bg-border-strong'
          )}
        />
        <div
          className={cn(
            'absolute bg-white rounded-full transition-transform duration-200 ease-in-out shadow-sm',
            isSm ? 'w-3.5 h-3.5 top-0.5' : 'w-4.5 h-4.5 top-0.5',
            checked
              ? isSm
                ? 'translate-x-4 left-0.5'
                : 'translate-x-5 left-0.5'
              : 'translate-x-0.5 left-0'
          )}
        />
      </div>

      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span
              className={cn(
                'font-medium text-text',
                isSm ? 'text-xs' : 'text-sm'
              )}
            >
              {label}
            </span>
          )}
          {description && (
            <span
              className={cn(
                'text-text-mute leading-tight',
                isSm ? 'text-[11px]' : 'text-xs'
              )}
            >
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
};
