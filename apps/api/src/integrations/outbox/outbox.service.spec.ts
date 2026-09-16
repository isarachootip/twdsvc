import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OutboxService } from './outbox.service';

describe('OutboxService & Outbound Worker (02_architecture.md §5)', () => {
  let outboxService: OutboxService;
  let mockPrisma: any;
  let mockNotification: any;
  let mockTpl: any;
  let mockWallet: any;
  let mockAccounting: any;

  beforeEach(() => {
    mockPrisma = {
      outboxMessage: {
        create: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
    };

    mockNotification = {
      sendJobOpened: vi.fn().mockResolvedValue({ success: true }),
      sendQuote: vi.fn().mockResolvedValue({ success: true }),
      sendReadyForPickup: vi.fn().mockResolvedValue({ success: true }),
      sendCsatSurvey: vi.fn().mockResolvedValue({ success: true }),
      sendSlaBreachAlert: vi.fn().mockResolvedValue({ success: true }),
    };

    mockTpl = {
      book: vi.fn().mockResolvedValue({ trackingNo: 'MOCK-12345' }),
      cancel: vi.fn().mockResolvedValue({ success: true }),
    };

    mockWallet = {
      issueCoupon: vi.fn().mockResolvedValue({ walletRef: 'WLT-123' }),
    };

    mockAccounting = {
      submitPayoutBatch: vi.fn().mockResolvedValue({ externalRef: 'ACC-123' }),
    };

    outboxService = new OutboxService(
      mockPrisma,
      mockNotification,
      mockTpl,
      mockWallet,
      mockAccounting
    );
  });

  it('should enqueue outbox message', async () => {
    mockPrisma.outboxMessage.create.mockResolvedValue({
      id: 'msg_1',
      topic: 'notify.job_opened',
      payload: { jobNo: 'JB-2609-0001' },
      attempts: 0,
    });

    const result = await outboxService.enqueue('notify.job_opened', {
      jobNo: 'JB-2609-0001',
    });

    expect(result.id).toBe('msg_1');
    expect(mockPrisma.outboxMessage.create).toHaveBeenCalledWith({
      data: {
        topic: 'notify.job_opened',
        payload: { jobNo: 'JB-2609-0001' },
      },
    });
  });

  it('should process pending outbox messages and update processedAt on success', async () => {
    const mockMessages = [
      {
        id: 'msg_1',
        topic: 'notify.job_opened',
        payload: { jobNo: 'JB-2609-0001' },
        attempts: 0,
      },
      {
        id: 'msg_2',
        topic: 'tpl.book',
        payload: { referenceNo: 'JB-2609-0002' },
        attempts: 0,
      },
      {
        id: 'msg_3',
        topic: 'wallet.issue',
        payload: { tradeInNo: 'TI-2609-0001' },
        attempts: 0,
      },
    ];

    mockPrisma.outboxMessage.findMany.mockResolvedValue(mockMessages);

    const count = await outboxService.processNextBatch(10);

    expect(count).toBe(3);
    expect(mockNotification.sendJobOpened).toHaveBeenCalled();
    expect(mockTpl.book).toHaveBeenCalled();
    expect(mockWallet.issueCoupon).toHaveBeenCalled();

    expect(mockPrisma.outboxMessage.update).toHaveBeenCalledTimes(3);
    expect(mockPrisma.outboxMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'msg_1' },
        data: expect.objectContaining({
          processedAt: expect.any(Date),
          attempts: 1,
        }),
      })
    );
  });

  it('should handle failure by incrementing attempts without setting processedAt', async () => {
    mockNotification.sendJobOpened.mockRejectedValue(new Error('Network error'));

    mockPrisma.outboxMessage.findMany.mockResolvedValue([
      {
        id: 'msg_failed',
        topic: 'notify.job_opened',
        payload: { jobNo: 'JB-2609-0001' },
        attempts: 1,
      },
    ]);

    const count = await outboxService.processNextBatch(10);

    expect(count).toBe(0);
    expect(mockPrisma.outboxMessage.update).toHaveBeenCalledWith({
      where: { id: 'msg_failed' },
      data: { attempts: 2 },
    });
  });
});
