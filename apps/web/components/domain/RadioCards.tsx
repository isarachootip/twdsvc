import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';

export interface RadioCardOption<T extends string = string> {
  value: T;
  title: string;
  description?: string;
  badge?: string;
  badgeVariant?: 'default' | 'red' | 'blue' | 'green' | 'amber';
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface RadioCardsProps<T extends string = string> {
  options: RadioCardOption<T>[];
  value?: T;
  onChange?: (value: T) => void;
  name?: string;
  columns?: 1 | 2 | 3 | 4;
  disabled?: boolean;
  className?: string;
}

export function RadioCards<T extends string = string>({
  options,
  value,
  onChange,
  name,
  columns = 2,
  disabled = false,
  className,
}: RadioCardsProps<T>) {
  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <div className={cn('grid gap-3', colClass, className)}>
      {options.map((opt) => {
        const isSelected = value === opt.value;
        const isDisabled = disabled || opt.disabled;

        const badgeStyle = {
          default: 'bg-surface-2 text-text-2 border-border',
          red: 'bg-red-tint text-red-dark border-red/30',
          blue: 'bg-blue-tint text-blue border-blue/30',
          green: 'bg-green-tint text-green border-green/30',
          amber: 'bg-amber-tint text-amber border-amber/30',
        }[opt.badgeVariant || 'default'];

        return (
          <label
            key={opt.value}
            className={cn(
              'relative flex flex-col p-3.5 rounded-card border transition-all cursor-pointer select-none',
              isSelected
                ? 'border-red bg-red-tint/15 shadow-sm ring-1 ring-red/30'
                : 'border-border bg-surface hover:border-border-strong hover:bg-surface-2/40',
              isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none'
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={isSelected}
              onChange={() => onChange?.(opt.value)}
              disabled={isDisabled}
              className="sr-only"
            />
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {opt.icon && (
                  <span
                    className={cn(
                      'text-text-2',
                      isSelected && 'text-red'
                    )}
                  >
                    {opt.icon}
                  </span>
                )}
                <span
                  className={cn(
                    'text-sm font-semibold',
                    isSelected ? 'text-red-dark' : 'text-text'
                  )}
                >
                  {opt.title}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {opt.badge && (
                  <span
                    className={cn(
                      'text-[11px] font-medium px-2 py-0.5 rounded-full border',
                      badgeStyle
                    )}
                  >
                    {opt.badge}
                  </span>
                )}
                {isSelected ? (
                  <CheckCircle2 className="w-4 h-4 text-red shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-border-strong shrink-0" />
                )}
              </div>
            </div>
            {opt.description && (
              <p
                className={cn(
                  'mt-1 text-xs leading-relaxed',
                  isSelected ? 'text-text-2' : 'text-text-mute'
                )}
              >
                {opt.description}
              </p>
            )}
          </label>
        );
      })}
    </div>
  );
}
