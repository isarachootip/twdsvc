import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, ArrowRight, X } from 'lucide-react';

export interface OverdueBreakdown {
  grCount?: number;
  vdCount?: number;
  logisticsCount?: number;
  csCount?: number;
}

export interface OverdueSummaryBannerProps {
  totalOverdue: number;
  breakdown?: OverdueBreakdown;
  onFilterOverdue?: () => void;
  onClearFilter?: () => void;
  isFilterActive?: boolean;
  className?: string;
}

export const OverdueSummaryBanner: React.FC<OverdueSummaryBannerProps> = ({
  totalOverdue,
  breakdown,
  onFilterOverdue,
  onClearFilter,
  isFilterActive = false,
  className,
}) => {
  if (totalOverdue <= 0 && !isFilterActive) return null;

  return (
    <div
      className={cn(
        'rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm transition-all',
        isFilterActive
          ? 'bg-amber-50 border-amber-300 text-amber-900'
          : 'bg-[#FBE7E9] border-[#E4DED2] text-[#9C0C22]',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[#C8102E] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-semibold text-sm">
            {isFilterActive
              ? `กำลังแสดงเฉพาะงานเร่งด่วนที่เกิน SLA (${totalOverdue} รายการ)`
              : `มีงานที่เกินกำหนดเวลา SLA จำนวน ${totalOverdue} รายการ`}
          </div>

          {breakdown && (
            <div className="text-xs opacity-90 flex flex-wrap gap-2 text-[#6B6459]">
              {breakdown.grCount ? <span>• GR: {breakdown.grCount}</span> : null}
              {breakdown.vdCount ? <span>• VD: {breakdown.vdCount}</span> : null}
              {breakdown.logisticsCount ? <span>• ขนส่ง/DC: {breakdown.logisticsCount}</span> : null}
              {breakdown.csCount ? <span>• CS/ลูกค้า: {breakdown.csCount}</span> : null}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {isFilterActive ? (
          <button
            onClick={onClearFilter}
            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 shadow-sm"
          >
            <X className="w-3.5 h-3.5" /> ล้างตัวกรองรายการเร่งด่วน
          </button>
        ) : (
          <button
            onClick={onFilterOverdue}
            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#C8102E] text-white hover:bg-[#9C0C22] shadow-sm"
          >
            ดูกลุ่มงานเร่งด่วน <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
