import React, { useState } from 'react';
import { Download, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DateRange {
  from: string;
  to: string;
}

export interface DateRangeExportProps {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  onExport?: (range: DateRange) => void;
  exportLabel?: string;
  isExporting?: boolean;
  className?: string;
}

export const DateRangeExport: React.FC<DateRangeExportProps> = ({
  value,
  onChange,
  onExport,
  exportLabel = 'ส่งออก Excel',
  isExporting = false,
  className,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const [range, setRange] = useState<DateRange>(
    value || {
      from: today,
      to: today,
    }
  );

  const updateRange = (newRange: DateRange) => {
    setRange(newRange);
    onChange?.(newRange);
  };

  const handlePreset = (preset: 'today' | '7days' | '30days' | 'thisMonth') => {
    const now = new Date();
    let fromDate = new Date();

    if (preset === 'today') {
      fromDate = now;
    } else if (preset === '7days') {
      fromDate.setDate(now.getDate() - 7);
    } else if (preset === '30days') {
      fromDate.setDate(now.getDate() - 30);
    } else if (preset === 'thisMonth') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const newRange = {
      from: fromDate.toISOString().split('T')[0],
      to: now.toISOString().split('T')[0],
    };
    updateRange(newRange);
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 p-2 rounded-card bg-surface border border-border',
        className
      )}
    >
      {/* Date Pickers */}
      <div className="flex items-center gap-1.5 text-xs text-text-2">
        <Calendar className="w-4 h-4 text-text-mute shrink-0 ml-1" />
        <input
          type="date"
          value={range.from}
          onChange={(e) =>
            updateRange({
              ...range,
              from: e.target.value,
            })
          }
          className="px-2 py-1 text-xs rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red"
        />
        <span>ถึง</span>
        <input
          type="date"
          value={range.to}
          onChange={(e) =>
            updateRange({
              ...range,
              to: e.target.value,
            })
          }
          className="px-2 py-1 text-xs rounded-input border border-border-strong bg-surface focus:outline-none focus:border-red"
        />
      </div>

      {/* Quick Presets */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => handlePreset('today')}
          className="px-2 py-1 text-[11px] rounded-input bg-surface-2 hover:bg-border text-text transition-colors"
        >
          วันนี้
        </button>
        <button
          type="button"
          onClick={() => handlePreset('7days')}
          className="px-2 py-1 text-[11px] rounded-input bg-surface-2 hover:bg-border text-text transition-colors"
        >
          7 วัน
        </button>
        <button
          type="button"
          onClick={() => handlePreset('30days')}
          className="px-2 py-1 text-[11px] rounded-input bg-surface-2 hover:bg-border text-text transition-colors"
        >
          30 วัน
        </button>
        <button
          type="button"
          onClick={() => handlePreset('thisMonth')}
          className="px-2 py-1 text-[11px] rounded-input bg-surface-2 hover:bg-border text-text transition-colors"
        >
          เดือนนี้
        </button>
      </div>

      {/* Export Button */}
      {onExport && (
        <button
          type="button"
          onClick={() => onExport(range)}
          disabled={isExporting}
          className="ml-auto flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-input border border-border-strong bg-surface hover:bg-surface-2 text-text transition-colors disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5 text-text-2" />
          <span>{isExporting ? 'กำลังส่งออก...' : exportLabel}</span>
        </button>
      )}
    </div>
  );
};
