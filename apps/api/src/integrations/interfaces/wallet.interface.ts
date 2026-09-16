export interface IssueCouponParams {
  customerPhone: string;
  percent: number;
  tradeInNo: string;
  expiresInDays: number;
}

export interface IWalletCouponProvider {
  issueCoupon(params: IssueCouponParams): Promise<{
    walletRef: string;
    couponCode: string;
    expiresAt: Date;
  }>;

  getStatus(walletRef: string): Promise<{
    status: 'ISSUED' | 'USED' | 'EXPIRED';
    usedAt?: Date;
  }>;
}
