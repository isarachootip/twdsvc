import React from 'react';
import { cn } from '@/lib/utils';
import { Inbox, LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'ไม่พบข้อมูลในระบบ',
  description,
  icon: Icon = Inbox,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 space-y-3 font-sans',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#E4DED2] flex items-center justify-center text-[#9A9384]">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>

      <div className="space-y-1 max-w-sm">
        <h3 className="font-semibold text-sm text-[#2B2723]">{title}</h3>
        {description && (
          <p className="text-xs text-[#6B6459] leading-relaxed">{description}</p>
        )}
      </div>

      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
