import React from 'react';
import { cn } from '@/lib/utils';

export type JobStageType =
  | 'PENDING_VENDOR_ASSIGNMENT'
  | 'CS_OPENED'
  | 'GR_RECEIVED'
  | 'GR_PACKED'
  | 'OUTBOUND_TO_DC'
  | 'AT_DC_OUTBOUND'
  | 'OUTBOUND_TO_VD'
  | 'VD_INSPECTING'
  | 'WAITING_APPROVAL'
  | 'REPAIRING'
  | 'RETURN_PACKING'
  | 'INBOUND_TO_DC'
  | 'AT_DC_INBOUND'
  | 'INBOUND_TO_BRANCH'
  | 'GR_RETURN_RECEIVED'
  | 'READY_FOR_PICKUP'
  | 'CLOSED_REPAIRED'
  | 'CLOSED_NOT_REPAIRED'
  | 'CANCELLED'
  | string;

export interface StatusBadgeProps {
  stage: JobStageType;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const STAGE_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  PENDING_VENDOR_ASSIGNMENT: {
    label: 'รอ Admin กำหนดศูนย์',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  CS_OPENED: {
    label: 'CS เปิดงาน (รอส่ง GR)',
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
  },
  GR_RECEIVED: {
    label: 'GR ตรวจรับแล้ว (รอ Pack)',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  GR_PACKED: {
    label: 'GR Pack แล้ว (รอขนส่ง)',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
  },
  OUTBOUND_TO_DC: {
    label: 'ระหว่างส่งไป DC',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  AT_DC_OUTBOUND: {
    label: 'อยู่ DC (รอ VD มารับ)',
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    border: 'border-cyan-200',
    dot: 'bg-cyan-500',
  },
  OUTBOUND_TO_VD: {
    label: 'ระหว่างส่งไป VD',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  VD_INSPECTING: {
    label: 'VD กำลังตรวจเช็ค',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  WAITING_APPROVAL: {
    label: 'รอลูกค้าอนุมัติ',
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    dot: 'bg-yellow-500',
  },
  REPAIRING: {
    label: 'กำลังซ่อม',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  RETURN_PACKING: {
    label: 'ซ่อมเสร็จ (รอส่งคืน)',
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200',
    dot: 'bg-teal-500',
  },
  INBOUND_TO_DC: {
    label: 'ระหว่างส่งคืนไป DC',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  AT_DC_INBOUND: {
    label: 'อยู่ DC (รอส่งคืนสาขา)',
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    border: 'border-cyan-200',
    dot: 'bg-cyan-500',
  },
  INBOUND_TO_BRANCH: {
    label: 'ระหว่างขนส่งคืนสาขา',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  GR_RETURN_RECEIVED: {
    label: 'GR รับคืนแล้ว (รอส่ง CS)',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  READY_FOR_PICKUP: {
    label: 'พร้อมส่งมอบลูกค้า',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  CLOSED_REPAIRED: {
    label: 'ปิดงาน (ซ่อมสำเร็จ)',
    bg: 'bg-emerald-100',
    text: 'text-emerald-900',
    border: 'border-emerald-300',
    dot: 'bg-emerald-600',
  },
  CLOSED_NOT_REPAIRED: {
    label: 'ปิดงาน (ไม่ซ่อม/คืนสินค้า)',
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-300',
    dot: 'bg-slate-500',
  },
  CANCELLED: {
    label: 'ยกเลิก',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  stage,
  label,
  className,
  size = 'md',
}) => {
  const config = STAGE_CONFIG[stage] || {
    label: stage,
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    dot: 'bg-gray-400',
  };

  const displayLabel = label || config.label;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border shrink-0',
        config.bg,
        config.text,
        config.border,
        sizeClasses,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />
      <span>{displayLabel}</span>
    </span>
  );
};
