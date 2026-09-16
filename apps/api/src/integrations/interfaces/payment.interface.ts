export interface PromptPayQrResult {
  providerRef: string;
  qrPayload: string;
  amountSatang: number;
  expiresAt: Date;
}

export interface CardPaymentLinkResult {
  providerRef: string;
  paymentUrl: string;
  amountSatang: number;
  expiresAt: Date;
}

export interface IPaymentProvider {
  createPromptPayQr(
    amountSatang: number,
    ref: string
  ): Promise<PromptPayQrResult>;

  createCardPaymentLink(
    amountSatang: number,
    ref: string
  ): Promise<CardPaymentLinkResult>;

  verifyWebhook(
    payload: any,
    headers: Record<string, string>
  ): Promise<{
    isValid: boolean;
    providerRef: string;
    amountSatang: number;
    status: 'PAID' | 'FAILED';
  }>;
}
