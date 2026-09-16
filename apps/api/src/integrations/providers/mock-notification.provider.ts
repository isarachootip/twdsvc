import { Injectable, Logger } from '@nestjs/common';
import { INotificationProvider } from '../interfaces/notification.interface';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MockNotificationProvider implements INotificationProvider {
  private readonly logger = new Logger(MockNotificationProvider.name);

  constructor(private readonly prisma: PrismaService) {}

  private async logNotification(
    channel: string,
    template: string,
    recipient: string,
    payload: any
  ) {
    const messageId = `msg_mock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.logger.log(
      `[MOCK NOTIFICATION] Channel=${channel} Template=${template} Recipient=${recipient}`
    );

    try {
      await this.prisma.notificationLog.create({
        data: {
          channel,
          template,
          recipient: recipient || 'UNKNOWN',
          status: 'DELIVERED',
        },
      });
    } catch (err: any) {
      this.logger.warn(`Failed to write NotificationLog: ${err.message}`);
    }

    return { success: true, messageId };
  }

  async sendJobOpened(payload: {
    recipientPhone?: string;
    lineUserId?: string;
    jobNo: string;
    customerName: string;
    productName: string;
    trackingUrl: string;
  }) {
    return this.logNotification(
      'LON_SMS',
      'JOB_OPENED',
      payload.recipientPhone || payload.lineUserId || 'UNKNOWN',
      payload
    );
  }

  async sendQuote(payload: {
    recipientPhone?: string;
    lineUserId?: string;
    jobNo: string;
    customerName: string;
    quoteNo: string;
    totalAmountSatang: number;
    quoteUrl: string;
  }) {
    return this.logNotification(
      'LON_SMS',
      'QUOTE_SENT',
      payload.recipientPhone || payload.lineUserId || 'UNKNOWN',
      payload
    );
  }

  async sendReadyForPickup(payload: {
    recipientPhone?: string;
    lineUserId?: string;
    jobNo: string;
    customerName: string;
    branchName: string;
    balanceSatang?: number;
    paymentUrl?: string;
  }) {
    return this.logNotification(
      'LON_SMS',
      'READY_FOR_PICKUP',
      payload.recipientPhone || payload.lineUserId || 'UNKNOWN',
      payload
    );
  }

  async sendCsatSurvey(payload: {
    recipientPhone?: string;
    lineUserId?: string;
    jobNo: string;
    customerName: string;
    surveyUrl: string;
  }) {
    return this.logNotification(
      'LON_SMS',
      'CSAT_SURVEY',
      payload.recipientPhone || payload.lineUserId || 'UNKNOWN',
      payload
    );
  }

  async sendSlaBreachAlert(payload: {
    jobNo: string;
    stepName: string;
    ownerDept: string;
    hoursInStep: number;
    slaHours: number;
  }) {
    return this.logNotification(
      'INTERNAL_ALERT',
      'SLA_BREACH',
      payload.ownerDept,
      payload
    );
  }
}
