import React from 'react';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle } from 'lucide-react';

export interface SlaTagProps {
  hoursInStep: number;
  slaHours: number;
  isOverdue?: boolean;
  overdueOwner?: string | null;
  className?: string;
  showIcon?: boolean;
}

export const SlaTag: React.FC<SlaTagProps> = ({
  hoursInStep,
  slaHours,
  isOverdue = false,
  overdueOwner,
  className,
  showIcon = true,
}) => {
  const isNearBreach = !isOverdue && slaHours > 0 && hoursInStep >= slaHours * 0.8;

  let badgeBg = 'bg-emerald-50 border-emerald-200 text-emerald-800';
  let dotColor = 'bg-emerald-500';
  let iconColor = 'text-emerald-600';

  if (isOverdue) {
    badgeBg = 'bg-rose-50 border-rose-200 text-rose-800';
    dotColor = 'bg-rose-600';
    iconColor = 'text-rose-600';
  } else if (isNearBreach) {
    badgeBg = 'bg-amber-50 border-amber-200 text-amber-800';
    dotColor = 'bg-amber-500';
    iconColor = 'text-amber-600';
  }

  return (
    <div
      className={cn(
        'inline-flex flex-col text-left px-2.5 py-1 rounded-lg border text-xs',
        badgeBg,
        className
      )}
    >
      <div className="flex items-center gap-1.5 font-semibold">
        {showIcon && (
          isOverdue ? (
            <AlertTriangle className={cn('w-3.5 h-3.5 shrink-0', iconColor)} />
          ) : (
            <Clock className={cn('w-3.5 h-3.5 shrink-0', iconColor)} />
          )
        )}
        <span>{hoursInStep} ชม.</span>
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />
      </div>

      <div className="text-[11px] opacity-80 mt-0.5">
        {isOverdue ? (
          <span className="font-medium text-rose-700">
            SLA {slaHours} ชม. (เกิน{overdueOwner ? ` โดย ${overdueOwner}` : ''})
          </span>
        ) : (
          <span>SLA {slaHours} ชม.</span>
        )}
      </div>
    </div>
  );
};
