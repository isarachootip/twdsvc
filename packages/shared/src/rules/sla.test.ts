import { describe, it, expect } from 'vitest';
import {
  parseSlaInput,
  resolveOwner,
  computeDueAt,
  planClockOps,
  jobSlaView,
  SlaStepDefinition,
  SlaClockState,
  SlaJobContext,
} from './sla';

describe('SLA Rules (docs/05_business_rules.md §4)', () => {
  describe('parseSlaInput', () => {
    it('should parse days and hours into total hours', () => {
      expect(parseSlaInput('2 วัน')).toBe(48);
      expect(parseSlaInput('3 days')).toBe(72);
      expect(parseSlaInput('24 ชม.')).toBe(24);
      expect(parseSlaInput('4 hours')).toBe(4);
      expect(parseSlaInput(168)).toBe(168);
    });
  });

  describe('resolveOwner (§4.2)', () => {
    it('should resolve CARRIER owner according to channel and step', () => {
      // Normal step with channel DC -> DC fleet
      expect(resolveOwner('CARRIER', 'DC', 'GR_HANDOFF')).toBe('DC');

      // Step 7 (VD_RECEIVE) with channel DC -> VD picks up from DC, so VD is owner
      expect(resolveOwner('CARRIER', 'DC', 'VD_RECEIVE')).toBe('VD');

      // Channel DSD -> VD fleet
      expect(resolveOwner('CARRIER', 'DSD', 'CARRIER_PICKUP_BRANCH')).toBe('VD');

      // Channel TPL -> 3PL
      expect(resolveOwner('CARRIER', 'TPL', 'CARRIER_PICKUP_BRANCH')).toBe('TPL');

      // Non-CARRIER owner -> unchanged
      expect(resolveOwner('CS', 'DC', 'CS_HANDOVER')).toBe('CS');
      expect(resolveOwner('GR', 'DC', 'GR_PACK')).toBe('GR');
      expect(resolveOwner('VD', 'DC', 'VD_QUOTE')).toBe('VD');
    });
  });

  describe('planClockOps (§4.3)', () => {
    const sampleSteps: SlaStepDefinition[] = [
      {
        id: 's_cs',
        code: 'CS_HANDOVER',
        seq: 1,
        name: 'CS เปิดใบแจ้งซ่อม → ส่งมอบ GR',
        startEvent: 'JOB_OPENED',
        stopEvent: 'GR_RECEIVED',
        hours: 24,
        ownerDept: 'CS',
      },
      {
        id: 's_quote',
        code: 'CUSTOMER_APPROVAL',
        seq: 9,
        name: 'รอลูกค้าอนุมัติ',
        startEvent: 'QUOTE_SENT|QUOTE_REVISED',
        stopEvent: 'CUSTOMER_APPROVED|CUSTOMER_REJECTED',
        hours: 48,
        ownerDept: 'CUSTOMER',
        condition: 'type=CUSTOMER',
      },
      {
        id: 's_repair',
        code: 'VD_REPAIR',
        seq: 10,
        name: 'VD ระยะเวลาซ่อม',
        startEvent: 'CUSTOMER_APPROVED|REPAIR_STARTED',
        stopEvent: 'REPAIR_FINISHED',
        hours: 168,
        ownerDept: 'VD',
        pausable: true,
      },
    ];

    const jobContext: SlaJobContext = {
      id: 'job_01',
      type: 'CUSTOMER',
      channel: 'DC',
      repairSlaDays: 5, // Override to 5 days (120 hours) instead of default 168
    };

    it('should start clock when startEvent triggers', () => {
      const startedAt = new Date('2026-09-16T08:00:00.000Z');
      const ops = planClockOps(
        sampleSteps,
        jobContext,
        { type: 'JOB_OPENED', createdAt: startedAt },
        []
      );

      expect(ops).toHaveLength(1);
      expect(ops[0].op).toBe('START');
      if (ops[0].op === 'START') {
        expect(ops[0].stepCode).toBe('CS_HANDOVER');
        expect(ops[0].hours).toBe(24);
        expect(ops[0].dueAt).toEqual(new Date('2026-09-17T08:00:00.000Z'));
      }
    });

    it('should use vendor repairSlaDays override when starting VD_REPAIR', () => {
      const startedAt = new Date('2026-09-16T08:00:00.000Z');
      const ops = planClockOps(
        sampleSteps,
        jobContext,
        { type: 'CUSTOMER_APPROVED', createdAt: startedAt },
        []
      );

      const startOp = ops.find((o) => o.op === 'START' && o.stepCode === 'VD_REPAIR');
      expect(startOp).toBeDefined();
      if (startOp && startOp.op === 'START') {
        expect(startOp.hours).toBe(120); // 5 days * 24 = 120 hrs
        expect(startOp.dueAt).toEqual(new Date('2026-09-21T08:00:00.000Z'));
      }
    });

    it('should handle PAUSE and RESUME extending dueAt on waiting for parts', () => {
      const startedAt = new Date('2026-09-16T08:00:00.000Z');
      const initialDueAt = computeDueAt(startedAt, 120);

      const repairClock: SlaClockState = {
        slaStepId: 's_repair',
        stepCode: 'VD_REPAIR',
        hours: 120,
        ownerDept: 'VD',
        status: 'RUNNING',
        startedAt,
        dueAt: initialDueAt,
      };

      // 1) Pause for parts
      const pausedAt = new Date('2026-09-17T08:00:00.000Z');
      const pauseOps = planClockOps(
        sampleSteps,
        jobContext,
        { type: 'REPAIR_PAUSED', createdAt: pausedAt },
        [repairClock]
      );

      expect(pauseOps).toHaveLength(1);
      expect(pauseOps[0].op).toBe('PAUSE');

      // 2) Resume 48 hours later (2 days paused)
      const pausedClock: SlaClockState = {
        ...repairClock,
        status: 'PAUSED',
        pausedAt,
      };

      const resumedAt = new Date('2026-09-19T08:00:00.000Z'); // 48 hrs later
      const resumeOps = planClockOps(
        sampleSteps,
        jobContext,
        { type: 'REPAIR_RESUMED', createdAt: resumedAt },
        [pausedClock]
      );

      expect(resumeOps).toHaveLength(1);
      expect(resumeOps[0].op).toBe('RESUME');
      if (resumeOps[0].op === 'RESUME') {
        expect(resumeOps[0].pausedMinutes).toBe(2880); // 48 * 60
        // New dueAt should be extended by exactly 48 hours
        expect(resumeOps[0].dueAt).toEqual(new Date('2026-09-23T08:00:00.000Z'));
      }
    });

    it('should RESTART CUSTOMER_APPROVAL clock when QUOTE_REVISED triggers', () => {
      const revisedAt = new Date('2026-09-18T10:00:00.000Z');
      const oldClock: SlaClockState = {
        slaStepId: 's_quote',
        stepCode: 'CUSTOMER_APPROVAL',
        hours: 48,
        ownerDept: 'CUSTOMER',
        status: 'RUNNING',
        startedAt: new Date('2026-09-16T10:00:00.000Z'),
        dueAt: new Date('2026-09-18T10:00:00.000Z'),
      };

      const ops = planClockOps(
        sampleSteps,
        jobContext,
        { type: 'QUOTE_REVISED', createdAt: revisedAt },
        [oldClock]
      );

      const restartOp = ops.find((o) => o.op === 'RESTART');
      expect(restartOp).toBeDefined();
      if (restartOp && restartOp.op === 'RESTART') {
        expect(restartOp.startedAt).toEqual(revisedAt);
        expect(restartOp.dueAt).toEqual(new Date('2026-09-20T10:00:00.000Z'));
      }
    });
  });

  describe('jobSlaView (§4.4)', () => {
    it('should compute hoursInStep and overdue status correctly', () => {
      const now = new Date('2026-09-18T12:00:00.000Z');
      const clocks: SlaClockState[] = [
        {
          slaStepId: 's_quote',
          stepCode: 'CUSTOMER_APPROVAL',
          hours: 48,
          ownerDept: 'CUSTOMER',
          status: 'RUNNING',
          startedAt: new Date('2026-09-16T08:00:00.000Z'), // 52 hours ago
          dueAt: new Date('2026-09-18T08:00:00.000Z'), // Due 4 hours ago -> overdue!
        },
      ];

      const view = jobSlaView(clocks, now);
      expect(view.hoursInStep).toBe(52);
      expect(view.slaHours).toBe(48);
      expect(view.isOverdue).toBe(true);
      expect(view.overdueOwner).toBe('CUSTOMER');
      expect(view.overageHours).toBe(4);
    });
  });
});
