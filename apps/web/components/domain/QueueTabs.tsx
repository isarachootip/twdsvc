import React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  key: string;
  label: string;
  count?: number;
  badgeVariant?: 'default' | 'red' | 'amber';
}

export interface QueueTabsProps {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export const QueueTabs: React.FC<QueueTabsProps> = ({
  tabs,
  activeKey,
  onChange,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-[#E4DED2] pb-px',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeKey === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              'group relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap border-b-2',
              isActive
                ? 'border-[#C8102E] text-[#9C0C22] font-semibold bg-[#FBE7E9]/40 rounded-t-lg'
                : 'border-transparent text-[#6B6459] hover:text-[#2B2723] hover:bg-[#FAF7F2] rounded-t-lg'
            )}
          >
            <span>{tab.label}</span>

            {tab.count !== undefined && (
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-bold transition-colors',
                  isActive
                    ? 'bg-[#C8102E] text-white'
                    : tab.badgeVariant === 'red' && tab.count > 0
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-[#F3EEE6] text-[#6B6459] group-hover:bg-[#E4DED2]'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
