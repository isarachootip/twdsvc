'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  title: string;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  render?: (item: T, index: number) => React.ReactNode;
}

export interface SortableTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor?: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
  className?: string;
  emptyMessage?: string;
  initialSortKey?: string;
  initialSortDir?: 'asc' | 'desc';
}

export function SortableTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor = (item, index) => item.id || String(index),
  onRowClick,
  className,
  emptyMessage = 'ไม่พบข้อมูลในระบบ',
  initialSortKey,
  initialSortDir = 'asc',
}: SortableTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | undefined>(initialSortKey);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(initialSortDir);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDir === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA);
      const strB = String(valB);
      return sortDir === 'asc'
        ? strA.localeCompare(strB, 'th')
        : strB.localeCompare(strA, 'th');
    });
  }, [data, sortKey, sortDir]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E4DED2] p-8">
        <EmptyState title={emptyMessage} />
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto bg-white rounded-xl border border-[#E4DED2] shadow-sm', className)}>
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#E4DED2] bg-[#FAF7F2]/80 text-[#6B6459] font-medium text-xs">
            {columns.map((col) => {
              const isSorted = sortKey === col.key;
              return (
                <th
                  key={col.key}
                  className={cn(
                    'py-3.5 px-4',
                    col.sortable && 'cursor-pointer select-none hover:text-[#2B2723]',
                    col.headerClassName
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.title}</span>
                    {col.sortable && (
                      <span className="text-[#9A9384] shrink-0">
                        {isSorted ? (
                          sortDir === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-[#C8102E]" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-[#C8102E]" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody className="divide-y divide-[#E4DED2]/60">
          {sortedData.map((item, idx) => (
            <tr
              key={keyExtractor(item, idx)}
              onClick={() => onRowClick && onRowClick(item)}
              className={cn(
                'transition-colors',
                onRowClick && 'cursor-pointer hover:bg-[#FAF7F2]/60',
                idx % 2 === 1 ? 'bg-[#FAF7F2]/20' : 'bg-white'
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('py-3 px-4 text-[#2B2723]', col.className)}>
                  {col.render ? col.render(item, idx) : item[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
