import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MockNotificationProvider } from './providers/mock-notification.provider';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { MockPosProvider } from './providers/mock-pos.provider';
import { MockThirdPartyLogisticsProvider } from './providers/mock-tpl.provider';
import { MockWalletCouponProvider } from './providers/mock-wallet.provider';
import { MockAccountingProvider } from './providers/mock-accounting.provider';
import { DatabaseAddressProvider } from './providers/database-address.provider';
import { MinioStorageProvider } from './providers/minio-storage.provider';
import { AttachmentsService } from './attachments/attachments.service';
import { AttachmentsController } from './attachments/attachments.controller';
import { AddressController } from './address/address.controller';
import { OutboxService } from './outbox/outbox.service';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [AttachmentsController, AddressController],
  providers: [
    {
      provide: 'NOTIFICATION_PROVIDER',
      useClass: MockNotificationProvider,
    },
    {
      provide: 'PAYMENT_PROVIDER',
      useClass: MockPaymentProvider,
    },
    {
      provide: 'POS_PROVIDER',
      useClass: MockPosProvider,
    },
    {
      provide: 'TPL_PROVIDER',
      useClass: MockThirdPartyLogisticsProvider,
    },
    {
      provide: 'WALLET_PROVIDER',
      useClass: MockWalletCouponProvider,
    },
    {
      provide: 'ACCOUNTING_PROVIDER',
      useClass: MockAccountingProvider,
    },
    {
      provide: 'ADDRESS_PROVIDER',
      useClass: DatabaseAddressProvider,
    },
    {
      provide: 'STORAGE_PROVIDER',
      useClass: MinioStorageProvider,
    },
    AttachmentsService,
    OutboxService,
    MockNotificationProvider,
    MockPaymentProvider,
    MockPosProvider,
    MockThirdPartyLogisticsProvider,
    MockWalletCouponProvider,
    MockAccountingProvider,
    DatabaseAddressProvider,
    MinioStorageProvider,
  ],
  exports: [
    'NOTIFICATION_PROVIDER',
    'PAYMENT_PROVIDER',
    'POS_PROVIDER',
    'TPL_PROVIDER',
    'WALLET_PROVIDER',
    'ACCOUNTING_PROVIDER',
    'ADDRESS_PROVIDER',
    'STORAGE_PROVIDER',
    AttachmentsService,
    OutboxService,
  ],
})
export class IntegrationsModule {}
