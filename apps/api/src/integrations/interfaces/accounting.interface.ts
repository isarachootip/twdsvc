export interface PayoutBatchPayload {
  batchId: string;
  cycleDate: Date;
  totalAmountSatang: number;
  linesCount: number;
}

export interface IAccountingProvider {
  submitPayoutBatch(payload: PayoutBatchPayload): Promise<{
    externalRef: string;
    submittedAt: Date;
    status: 'SUBMITTED' | 'QUEUED';
  }>;
}
