import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  active?: boolean;
  colorVariant?: 'default' | 'red' | 'amber' | 'blue' | 'purple' | 'emerald';
  onClick?: () => void;
  className?: string;
  badge?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  active = false,
  colorVariant = 'default',
  onClick,
  className,
  badge,
}) => {
  const isClickable = Boolean(onClick);

  const variantStyles = {
    default: {
      border: active ? 'border-[#C8102E] ring-2 ring-[#C8102E]/20' : 'border-[#E4DED2]',
      iconBg: 'bg-[#FAF7F2] text-[#6B6459]',
      valueColor: 'text-[#2B2723]',
    },
    red: {
      border: active ? 'border-[#C8102E] ring-2 ring-[#C8102E]/20' : 'border-rose-200',
      iconBg: 'bg-rose-50 text-rose-600',
      valueColor: 'text-rose-600',
    },
    amber: {
      border: active ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-amber-200',
      iconBg: 'bg-amber-50 text-amber-600',
      valueColor: 'text-amber-700',
    },
    blue: {
      border: active ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-blue-200',
      iconBg: 'bg-blue-50 text-blue-600',
      valueColor: 'text-blue-700',
    },
    purple: {
      border: active ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-purple-200',
      iconBg: 'bg-purple-50 text-purple-600',
      valueColor: 'text-purple-700',
    },
    emerald: {
      border: active ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-emerald-200',
      iconBg: 'bg-emerald-50 text-emerald-600',
      valueColor: 'text-emerald-700',
    },
  }[colorVariant];

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative bg-white rounded-xl border p-4.5 transition-all shadow-sm',
        variantStyles.border,
        isClickable && 'cursor-pointer hover:shadow-md hover:border-gray-300',
        active && 'bg-[#FFF9F9]',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#6B6459]">{title}</span>
            {badge && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                {badge}
              </span>
            )}
          </div>
          <div className={cn('text-2xl font-bold tracking-tight', variantStyles.valueColor)}>
            {value}
          </div>
        </div>

        {Icon && (
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', variantStyles.iconBg)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {subtitle && (
        <div className="text-xs text-[#9A9384] mt-2 flex items-center gap-1 border-t border-[#FAF7F2] pt-2">
          {subtitle}
        </div>
      )}
    </div>
  );
};
