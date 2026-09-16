import { Injectable, Logger } from '@nestjs/common';
import {
  IWalletCouponProvider,
  IssueCouponParams,
} from '../interfaces/wallet.interface';

@Injectable()
export class MockWalletCouponProvider implements IWalletCouponProvider {
  private readonly logger = new Logger(MockWalletCouponProvider.name);

  async issueCoupon(params: IssueCouponParams): Promise<{
    walletRef: string;
    couponCode: string;
    expiresAt: Date;
  }> {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const walletRef = `WLT_${Date.now()}_${randomCode}`;
    const couponCode = `TWD-${params.percent}PCT-${randomCode}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + params.expiresInDays);

    this.logger.log(
      `[MOCK WALLET] Issued coupon: phone=${params.customerPhone}, discount=${params.percent}%, couponCode=${couponCode}, walletRef=${walletRef}`
    );

    return {
      walletRef,
      couponCode,
      expiresAt,
    };
  }

  async getStatus(walletRef: string): Promise<{
    status: 'ISSUED' | 'USED' | 'EXPIRED';
    usedAt?: Date;
  }> {
    this.logger.log(`[MOCK WALLET] Checking coupon status for walletRef=${walletRef}`);
    return {
      status: 'ISSUED',
    };
  }
}
