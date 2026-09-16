import { Injectable, Logger } from '@nestjs/common';
import { IPosProvider } from '../interfaces/pos.interface';

@Injectable()
export class MockPosProvider implements IPosProvider {
  private readonly logger = new Logger(MockPosProvider.name);

  async verifyReceipt(
    posReceiptNo: string,
    amountSatang: number
  ): Promise<{
    isValid: boolean;
    receiptDate?: Date;
    branchCode?: string;
    message?: string;
  }> {
    this.logger.log(
      `[MOCK POS] Validating receiptNo=${posReceiptNo}, amountSatang=${amountSatang}`
    );

    const trimmed = posReceiptNo.trim();
    if (!trimmed) {
      return { isValid: false, message: 'กรุณากรอกเลขที่ใบเสร็จ POS' };
    }

    // Accepts common POS receipt formats: e.g. R-12345, POS-0001-098231, INV-26090123
    const isValidFormat =
      /^(R-\d+|POS-\d{4,5}-\d+|INV-\d+|[A-Z0-9]{6,20})$/i.test(trimmed);

    if (!isValidFormat) {
      return {
        isValid: false,
        message: 'รูปแบบเลขที่ใบเสร็จไม่ถูกต้อง (ตัวอย่าง: R-12345 หรือ POS-00001-12345)',
      };
    }

    return {
      isValid: true,
      receiptDate: new Date(),
      branchCode: '00001',
      message: 'ใบเสร็จถูกต้องและตรวจผ่านระบบ POS',
    };
  }
}
