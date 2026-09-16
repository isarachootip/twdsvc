export interface BookShipmentParams {
  fromAddress: string;
  fromPhone: string;
  toAddress: string;
  toPhone: string;
  parcelSize: 'SMALL' | 'LARGE';
  referenceNo: string;
  declaredValueSatang?: number;
}

export interface BookShipmentResult {
  trackingNo: string;
  carrierName: string;
  labelPdfUrl?: string;
  estimatedDeliveryDate?: Date;
}

export interface IThirdPartyLogisticsProvider {
  book(params: BookShipmentParams): Promise<BookShipmentResult>;
  cancel(trackingNo: string): Promise<{ success: boolean }>;
  verifyWebhook(
    payload: any,
    headers: Record<string, string>
  ): Promise<{
    isValid: boolean;
    trackingNo: string;
    status: 'PICKED_UP' | 'DELIVERED' | 'FAILED';
    eventTime: Date;
    note?: string;
  }>;
}
