import { Injectable, Logger } from '@nestjs/common';
import {
  IThirdPartyLogisticsProvider,
  BookShipmentParams,
  BookShipmentResult,
} from '../interfaces/tpl.interface';

@Injectable()
export class MockThirdPartyLogisticsProvider
  implements IThirdPartyLogisticsProvider
{
  private readonly logger = new Logger(MockThirdPartyLogisticsProvider.name);

  async book(params: BookShipmentParams): Promise<BookShipmentResult> {
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    const trackingNo = `MOCK-3PL-${randomSeq}`;
    const estDelivery = new Date();
    estDelivery.setDate(estDelivery.getDate() + (params.parcelSize === 'LARGE' ? 3 : 2));

    this.logger.log(
      `[MOCK 3PL] Booked shipment: ref=${params.referenceNo}, trackingNo=${trackingNo}, parcelSize=${params.parcelSize}`
    );

    return {
      trackingNo,
      carrierName: 'Flash Express (MOCK)',
      labelPdfUrl: `http://localhost:3000/mock-labels/${trackingNo}.pdf`,
      estimatedDeliveryDate: estDelivery,
    };
  }

  async cancel(trackingNo: string): Promise<{ success: boolean }> {
    this.logger.log(`[MOCK 3PL] Cancelled shipment: trackingNo=${trackingNo}`);
    return { success: true };
  }

  async verifyWebhook(
    payload: any,
    headers: Record<string, string>
  ): Promise<{
    isValid: boolean;
    trackingNo: string;
    status: 'PICKED_UP' | 'DELIVERED' | 'FAILED';
    eventTime: Date;
    note?: string;
  }> {
    this.logger.log(`[MOCK 3PL] Webhook: ${JSON.stringify(payload)}`);
    return {
      isValid: true,
      trackingNo: payload.trackingNo || payload.tracking_no,
      status: payload.status || 'DELIVERED',
      eventTime: payload.eventTime ? new Date(payload.eventTime) : new Date(),
      note: payload.note,
    };
  }
}
