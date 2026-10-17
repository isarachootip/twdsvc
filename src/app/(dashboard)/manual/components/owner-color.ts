export interface OwnerStyle {
  text: string
  dot: string
}

const OWNER_STYLES: Record<string, OwnerStyle> = {
  CS:       { text: 'text-amber-700',   dot: 'bg-amber-500' },
  GR:       { text: 'text-blue-700',    dot: 'bg-blue-500' },
  DC:       { text: 'text-emerald-700', dot: 'bg-emerald-500' },
  VD:       { text: 'text-purple-700',  dot: 'bg-purple-500' },
  TPL:      { text: 'text-sky-700',     dot: 'bg-sky-500' },
  CARRIER:  { text: 'text-sky-700',     dot: 'bg-sky-500' },
  CUSTOMER: { text: 'text-rose-700',    dot: 'bg-rose-500' },
  ADMIN:    { text: 'text-slate-700',   dot: 'bg-slate-500' },
}

export function getOwnerStyle(ownerDept: string): OwnerStyle {
  return OWNER_STYLES[ownerDept] ?? { text: 'text-slate-600', dot: 'bg-slate-400' }
}
