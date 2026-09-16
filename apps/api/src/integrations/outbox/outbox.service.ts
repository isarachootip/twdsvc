import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { INotificationProvider } from '../interfaces/notification.interface';
import { IThirdPartyLogisticsProvider } from '../interfaces/tpl.interface';
import { IWalletCouponProvider } from '../interfaces/wallet.interface';
import { IAccountingProvider } from '../interfaces/accounting.interface';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('NOTIFICATION_PROVIDER')
    private readonly notificationProvider: INotificationProvider,
    @Inject('TPL_PROVIDER')
    private readonly tplProvider: IThirdPartyLogisticsProvider,
    @Inject('WALLET_PROVIDER')
    private readonly walletProvider: IWalletCouponProvider,
    @Inject('ACCOUNTING_PROVIDER')
    private readonly accountingProvider: IAccountingProvider
  ) {}

  async enqueue(topic: string, payload: any): Promise<any> {
    return this.prisma.outboxMessage.create({
      data: {
        topic,
        payload,
      },
    });
  }

  async processNextBatch(limit: number = 20): Promise<number> {
    const pendingMessages = await this.prisma.outboxMessage.findMany({
      where: {
        processedAt: null,
        attempts: { lt: 3 },
      },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });

    let processedCount = 0;

    for (const msg of pendingMessages) {
      const payload: any = msg.payload;
      let success = false;

      try {
        switch (msg.topic) {
          case 'notify.job_opened':
            await this.notificationProvider.sendJobOpened(payload);
            success = true;
            break;

          case 'notify.quote_sent':
            await this.notificationProvider.sendQuote(payload);
            success = true;
            break;

          case 'notify.ready_for_pickup':
            await this.notificationProvider.sendReadyForPickup(payload);
            success = true;
            break;

          case 'notify.csat':
            await this.notificationProvider.sendCsatSurvey(payload);
            success = true;
            break;

          case 'notify.sla_breached':
            await this.notificationProvider.sendSlaBreachAlert(payload);
            success = true;
            break;

          case 'tpl.book':
            await this.tplProvider.book(payload);
            success = true;
            break;

          case 'tpl.cancel':
            await this.tplProvider.cancel(payload.trackingNo);
            success = true;
            break;

          case 'wallet.issue':
            await this.walletProvider.issueCoupon(payload);
            success = true;
            break;

          case 'payout.submit':
            await this.accountingProvider.submitPayoutBatch(payload);
            success = true;
            break;

          default:
            this.logger.warn(`Unknown outbox topic: ${msg.topic}`);
            success = true; // Mark done so it doesn't loop infinitely
            break;
        }
      } catch (err: any) {
        this.logger.error(
          `Failed processing outbox message id=${msg.id} topic=${msg.topic}: ${err.message}`
        );
        success = false;
      }

      if (success) {
        await this.prisma.outboxMessage.update({
          where: { id: msg.id },
          data: {
            processedAt: new Date(),
            attempts: msg.attempts + 1,
          },
        });
        processedCount++;
      } else {
        await this.prisma.outboxMessage.update({
          where: { id: msg.id },
          data: {
            attempts: msg.attempts + 1,
          },
        });
      }
    }

    return processedCount;
  }
}
