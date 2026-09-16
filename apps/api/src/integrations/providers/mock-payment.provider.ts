import { Injectable, Logger } from '@nestjs/common';
import {
  IPaymentProvider,
  PromptPayQrResult,
  CardPaymentLinkResult,
} from '../interfaces/payment.interface';

@Injectable()
export class MockPaymentProvider implements IPaymentProvider {
  private readonly logger = new Logger(MockPaymentProvider.name);

  async createPromptPayQr(
    amountSatang: number,
    ref: string
  ): Promise<PromptPayQrResult> {
    const providerRef = `PP_MOCK_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const baht = (amountSatang / 100).toFixed(2);

    // Standard EMVCo mock payload format
    const qrPayload = `00020101021229370016A000000677010111011300668123456785802TH5303764540${baht.length.toString().padStart(2, '0')}${baht}6304MOCK`;

    this.logger.log(
      `[MOCK PAYMENT] Generated PromptPay QR: Ref=${ref}, Amount=฿${baht}, ProviderRef=${providerRef}`
    );

    return {
      providerRef,
      qrPayload,
      amountSatang,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
    };
  }

  async createCardPaymentLink(
    amountSatang: number,
    ref: string
  ): Promise<CardPaymentLinkResult> {
    const providerRef = `CARD_MOCK_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const paymentUrl = `http://localhost:3000/mock-payment-gateway?ref=${providerRef}&amount=${amountSatang}&orderRef=${ref}`;

    this.logger.log(
      `[MOCK PAYMENT] Generated Card Link: Ref=${ref}, AmountSatang=${amountSatang}, Link=${paymentUrl}`
    );

    return {
      providerRef,
      paymentUrl,
      amountSatang,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  }

  async verifyWebhook(
    payload: any,
    headers: Record<string, string>
  ): Promise<{
    isValid: boolean;
    providerRef: string;
    amountSatang: number;
    status: 'PAID' | 'FAILED';
  }> {
    this.logger.log(`[MOCK PAYMENT] Webhook received: ${JSON.stringify(payload)}`);
    return {
      isValid: true,
      providerRef: payload.providerRef || payload.ref,
      amountSatang: payload.amountSatang || payload.amount,
      status: payload.status === 'FAILED' ? 'FAILED' : 'PAID',
    };
  }
}
