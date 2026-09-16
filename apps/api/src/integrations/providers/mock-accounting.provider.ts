import { Injectable, Logger } from '@nestjs/common';
import {
  IAccountingProvider,
  PayoutBatchPayload,
} from '../interfaces/accounting.interface';

@Injectable()
export class MockAccountingProvider implements IAccountingProvider {
  private readonly logger = new Logger(MockAccountingProvider.name);

  async submitPayoutBatch(payload: PayoutBatchPayload): Promise<{
    externalRef: string;
    submittedAt: Date;
    status: 'SUBMITTED' | 'QUEUED';
  }> {
    const externalRef = `ERP_PAY_${payload.batchId.slice(-6).toUpperCase()}_${Date.now()}`;
    const totalBaht = (payload.totalAmountSatang / 100).toFixed(2);

    this.logger.log(
      `[MOCK ACCOUNTING] Payout batch submitted: batchId=${payload.batchId}, lines=${payload.linesCount}, total=฿${totalBaht}, externalRef=${externalRef}`
    );

    return {
      externalRef,
      submittedAt: new Date(),
      status: 'SUBMITTED',
    };
  }
}
