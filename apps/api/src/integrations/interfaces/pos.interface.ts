export interface IPosProvider {
  verifyReceipt(
    posReceiptNo: string,
    amountSatang: number
  ): Promise<{
    isValid: boolean;
    receiptDate?: Date;
    branchCode?: string;
    message?: string;
  }>;
}
