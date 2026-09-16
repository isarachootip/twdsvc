/**
 * SLA calculation, lifecycle planner, and view projection.
 * Reference: docs/05_business_rules.md §4
 */

export type OwnerDeptType =
  | 'CS'
  | 'GR'
  | 'DC'
  | 'VD'
  | 'TPL'
  | 'CUSTOMER'
  | 'CARRIER';

export interface SlaStepDefinition {
  id: string;
  code: string;
  seq: number;
  name: string;
  startEvent: string;
  stopEvent: string;
  condition?: string | null;
  hours: number;
  ownerDept: OwnerDeptType;
  pausable?: boolean;
  appliesTo?: Array<'CUSTOMER' | 'STOCK'>;
  active?: boolean;
}

export interface SlaClockState {
  id?: string;
  slaStepId: string;
  stepCode: string;
  hours: number;
  ownerDept: string;
  status: 'RUNNING' | 'PAUSED' | 'STOPPED';
  startedAt: Date;
  dueAt: Date;
  pausedAt?: Date | null;
  pausedMinutes?: number;
  stoppedAt?: Date | null;
  breached?: boolean;
  breachedAt?: Date | null;
}

export interface SlaJobContext {
  id: string;
  type: 'CUSTOMER' | 'STOCK';
  channel?: 'DSD' | 'DC' | 'TPL' | null;
  repairSlaDays?: number; // Override or vendor default days
}

export interface SlaEventInput {
  type: string;
  createdAt: Date;
}

export type ClockOp =
  | { op: 'START'; stepId: string; stepCode: string; startedAt: Date; dueAt: Date; hours: number; ownerDept: string }
  | { op: 'STOP'; stepId: string; stepCode: string; stoppedAt: Date; breached: boolean }
  | { op: 'PAUSE'; stepId: string; stepCode: string; pausedAt: Date }
  | { op: 'RESUME'; stepId: string; stepCode: string; pausedMinutes: number; dueAt: Date }
  | { op: 'RESTART'; stepId: string; stepCode: string; startedAt: Date; dueAt: Date; hours: number; ownerDept: string };

/**
 * Parses user input for SLA duration into hours.
 * Examples: "24 ชม.", "24", 24 -> 24
 *           "2 วัน", "2 days" -> 48
 */
export function parseSlaInput(input: string | number): number {
  if (typeof input === 'number') return Math.max(1, Math.round(input));

  const trimmed = input.trim().toLowerCase();
  const dayMatch = trimmed.match(/^([\d.]+)\s*(วัน|day|days|d)$/);
  if (dayMatch) {
    const days = parseFloat(dayMatch[1]);
    return Math.max(1, Math.round(days * 24));
  }

  const hourMatch = trimmed.match(/^([\d.]+)\s*(ชม\.|ชม|ชั่วโมง|hour|hours|h)?$/);
  if (hourMatch) {
    const hours = parseFloat(hourMatch[1]);
    return Math.max(1, Math.round(hours));
  }

  const parsed = parseFloat(trimmed);
  return isNaN(parsed) ? 24 : Math.max(1, Math.round(parsed));
}

/**
 * Resolves effective owner dept from CARRIER according to channel.
 */
export function resolveOwner(
  ownerDept: OwnerDeptType,
  channel?: 'DSD' | 'DC' | 'TPL' | null,
  stepCode?: string
): string {
  if (ownerDept !== 'CARRIER') return ownerDept;

  if (channel === 'DC') {
    // Step 7 (VD_RECEIVE) on channel DC is handled by VD fleet picking up at DC
    if (stepCode === 'VD_RECEIVE') return 'VD';
    return 'DC';
  }

  if (channel === 'DSD') return 'VD';
  if (channel === 'TPL') return 'TPL';

  return 'CARRIER';
}

/**
 * Computes dueAt date from startedAt + hours.
 */
export function computeDueAt(startedAt: Date, hours: number): Date {
  return new Date(startedAt.getTime() + hours * 3600 * 1000);
}

/**
 * Evaluates whether a condition matches the current job context.
 */
export function matchesCondition(condition: string | null | undefined, job: SlaJobContext): boolean {
  if (!condition) return true;

  const parts = condition.split('&').map((p) => p.trim());
  for (const part of parts) {
    if (part.startsWith('channel=')) {
      const expected = part.replace('channel=', '').trim();
      if (job.channel !== expected) return false;
    } else if (part.startsWith('channel!=')) {
      const notExpected = part.replace('channel!=', '').trim();
      if (job.channel === notExpected) return false;
    } else if (part.startsWith('type=')) {
      const expected = part.replace('type=', '').trim();
      if (job.type !== expected) return false;
    }
  }

  return true;
}

/**
 * Plans clock operations (start, stop, pause, resume, restart) based on lifecycle event.
 */
export function planClockOps(
  steps: SlaStepDefinition[],
  job: SlaJobContext,
  event: SlaEventInput,
  clocks: SlaClockState[]
): ClockOp[] {
  const ops: ClockOp[] = [];
  const clockMap = new Map<string, SlaClockState>();
  for (const c of clocks) {
    clockMap.set(c.stepCode, c);
  }

  const activeSteps = steps.filter(
    (s) => (s.active !== false) && (!s.appliesTo || s.appliesTo.includes(job.type))
  );

  // Check for PAUSE / RESUME on repair step
  if (event.type === 'REPAIR_PAUSED') {
    const repairClock = clockMap.get('VD_REPAIR');
    if (repairClock && repairClock.status === 'RUNNING') {
      ops.push({
        op: 'PAUSE',
        stepId: repairClock.slaStepId,
        stepCode: 'VD_REPAIR',
        pausedAt: event.createdAt,
      });
    }
    return ops;
  }

  if (event.type === 'REPAIR_RESUMED') {
    const repairClock = clockMap.get('VD_REPAIR');
    if (repairClock && repairClock.status === 'PAUSED' && repairClock.pausedAt) {
      const pausedMs = event.createdAt.getTime() - new Date(repairClock.pausedAt).getTime();
      const pausedMins = Math.max(0, Math.floor(pausedMs / 60000));
      const totalPausedMins = (repairClock.pausedMinutes || 0) + pausedMins;
      const newDueAt = new Date(new Date(repairClock.dueAt).getTime() + pausedMs);

      ops.push({
        op: 'RESUME',
        stepId: repairClock.slaStepId,
        stepCode: 'VD_REPAIR',
        pausedMinutes: totalPausedMins,
        dueAt: newDueAt,
      });
    }
    return ops;
  }

  for (const step of activeSteps) {
    const existingClock = clockMap.get(step.code);
    const stopEvents = step.stopEvent.split('|').map((e) => e.trim());
    const startEvents = step.startEvent.split('|').map((e) => e.trim());

    // 1) Stop condition
    if (
      stopEvents.includes(event.type) &&
      existingClock &&
      (existingClock.status === 'RUNNING' || existingClock.status === 'PAUSED')
    ) {
      const isBreached = event.createdAt.getTime() > new Date(existingClock.dueAt).getTime();
      ops.push({
        op: 'STOP',
        stepId: step.id,
        stepCode: step.code,
        stoppedAt: event.createdAt,
        breached: isBreached,
      });
    }

    // 2) Restart condition (e.g. QUOTE_REVISED on CUSTOMER_APPROVAL)
    if (event.type === 'QUOTE_REVISED' && step.code === 'CUSTOMER_APPROVAL') {
      const resolvedOwnerDept = resolveOwner(step.ownerDept, job.channel, step.code);
      const dueAt = computeDueAt(event.createdAt, step.hours);
      ops.push({
        op: 'RESTART',
        stepId: step.id,
        stepCode: step.code,
        startedAt: event.createdAt,
        dueAt,
        hours: step.hours,
        ownerDept: resolvedOwnerDept,
      });
      continue;
    }

    // 3) Start condition
    if (
      startEvents.includes(event.type) &&
      matchesCondition(step.condition, job) &&
      (!existingClock || existingClock.status === 'STOPPED')
    ) {
      let hours = step.hours;
      if (step.code === 'VD_REPAIR' && job.repairSlaDays) {
        hours = job.repairSlaDays * 24;
      }

      const resolvedOwnerDept = resolveOwner(step.ownerDept, job.channel, step.code);
      const dueAt = computeDueAt(event.createdAt, hours);

      ops.push({
        op: 'START',
        stepId: step.id,
        stepCode: step.code,
        startedAt: event.createdAt,
        dueAt,
        hours,
        ownerDept: resolvedOwnerDept,
      });
    }
  }

  return ops;
}

export interface JobSlaViewResult {
  hoursInStep: number;
  slaHours: number;
  isOverdue: boolean;
  overdueOwner: string | null;
  overageHours: number;
}

/**
 * Computes job-level SLA metrics for dashboards and queue tags.
 */
export function jobSlaView(clocks: SlaClockState[], now: Date = new Date()): JobSlaViewResult {
  const runningClocks = clocks.filter((c) => c.status === 'RUNNING' || c.status === 'PAUSED');

  if (runningClocks.length === 0) {
    return {
      hoursInStep: 0,
      slaHours: 0,
      isOverdue: false,
      overdueOwner: null,
      overageHours: 0,
    };
  }

  const primaryClock = runningClocks[runningClocks.length - 1];
  const startedTime = new Date(primaryClock.startedAt).getTime();
  const pausedMs = (primaryClock.pausedMinutes || 0) * 60000;
  const elapsedMs = Math.max(0, now.getTime() - startedTime - pausedMs);
  const hoursInStep = Math.floor(elapsedMs / 3600000);
  const slaHours = primaryClock.hours;

  const overdueClocks = runningClocks.filter((c) => now.getTime() > new Date(c.dueAt).getTime());
  const isOverdue = overdueClocks.length > 0;

  if (!isOverdue) {
    return {
      hoursInStep,
      slaHours,
      isOverdue: false,
      overdueOwner: null,
      overageHours: 0,
    };
  }

  // Sort by overage descending
  overdueClocks.sort((a, b) => {
    const overageA = now.getTime() - new Date(a.dueAt).getTime();
    const overageB = now.getTime() - new Date(b.dueAt).getTime();
    return overageB - overageA;
  });

  const worst = overdueClocks[0];
  const overageHours = Math.floor((now.getTime() - new Date(worst.dueAt).getTime()) / 3600000);

  return {
    hoursInStep,
    slaHours,
    isOverdue: true,
    overdueOwner: worst.ownerDept,
    overageHours,
  };
}
