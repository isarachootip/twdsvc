import React from 'react';
import { cn } from '@/lib/utils';

export interface JobIdCellProps {
  jobNo: string;
  isOverdue?: boolean;
  type?: 'CUSTOMER' | 'STOCK';
  subText?: string;
  onClick?: () => void;
  className?: string;
}

export const JobIdCell: React.FC<JobIdCellProps> = ({
  jobNo,
  isOverdue = false,
  type = 'CUSTOMER',
  subText,
  onClick,
  className,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex flex-col text-left font-sans',
        onClick && 'cursor-pointer group',
        className
      )}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            'w-2 h-2 rounded-full shrink-0',
            isOverdue
              ? 'bg-rose-500 animate-pulse'
              : type === 'STOCK'
              ? 'bg-indigo-500'
              : 'bg-emerald-500'
          )}
        />
        <span
          className={cn(
            'font-mono font-semibold text-sm',
            isOverdue ? 'text-rose-600' : 'text-[#2B2723]',
            onClick && 'group-hover:text-[#C8102E] group-hover:underline'
          )}
        >
          {jobNo}
        </span>
        {type === 'STOCK' && (
          <span className="text-[10px] uppercase font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded">
            S2
          </span>
        )}
      </div>

      {subText && (
        <span className="text-xs text-[#6B6459] truncate max-w-[200px] mt-0.5">
          {subText}
        </span>
      )}
    </div>
  );
};
