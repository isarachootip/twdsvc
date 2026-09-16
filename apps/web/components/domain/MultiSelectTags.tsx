import React, { useState } from 'react';
import { X, Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TagOption {
  value: string;
  label: string;
  count?: number;
}

export interface MultiSelectTagsProps {
  options: TagOption[];
  value?: string[];
  onChange?: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const MultiSelectTags: React.FC<MultiSelectTagsProps> = ({
  options,
  value = [],
  onChange,
  placeholder = 'เลือกรายการ...',
  label,
  disabled = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const toggleOption = (val: string) => {
    if (disabled) return;
    if (value.includes(val)) {
      onChange?.(value.filter((v) => v !== val));
    } else {
      onChange?.([...value, val]);
    }
  };

  const removeTag = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange?.(value.filter((v) => v !== val));
  };

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  return (
    <div className={cn('space-y-1.5 relative', className)}>
      {label && (
        <label className="block text-xs font-medium text-text-2">{label}</label>
      )}

      {/* Trigger & Selected Tags Box */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'min-h-[38px] p-1.5 rounded-input border border-border-strong bg-surface cursor-pointer flex flex-wrap items-center gap-1.5 transition-colors',
          isOpen && 'border-red ring-1 ring-red/20',
          disabled && 'bg-surface-2 opacity-60 cursor-not-allowed'
        )}
      >
        {selectedOptions.length === 0 && (
          <span className="text-xs text-text-mute px-1.5 py-0.5 select-none">
            {placeholder}
          </span>
        )}

        {selectedOptions.map((opt) => (
          <span
            key={opt.value}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-surface-2 text-text border border-border"
          >
            <span>{opt.label}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => removeTag(opt.value, e)}
                className="hover:text-red transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}

        <ChevronsUpDown className="w-4 h-4 text-text-mute ml-auto mr-1 shrink-0" />
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-surface rounded-card border border-border shadow-lg overflow-hidden max-h-60 flex flex-col">
            <div className="p-2 border-b border-border bg-surface-2/40 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-text-mute shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหา..."
                className="w-full text-xs bg-transparent border-none p-0 focus:outline-none text-text placeholder:text-text-mute"
                autoFocus
              />
            </div>

            <div className="overflow-y-auto p-1 divide-y divide-border/40">
              {filtered.length === 0 ? (
                <div className="p-3 text-xs text-text-mute text-center">
                  ไม่พบรายการ
                </div>
              ) : (
                filtered.map((opt) => {
                  const isChecked = value.includes(opt.value);
                  return (
                    <div
                      key={opt.value}
                      onClick={() => toggleOption(opt.value)}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 text-xs rounded-input cursor-pointer transition-colors',
                        isChecked
                          ? 'bg-red-tint/30 text-red-dark font-medium'
                          : 'hover:bg-surface-2 text-text'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                            isChecked
                              ? 'border-red bg-red text-white'
                              : 'border-border-strong bg-surface'
                          )}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span>{opt.label}</span>
                      </div>
                      {opt.count !== undefined && (
                        <span className="text-[11px] text-text-mute">
                          ({opt.count})
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
