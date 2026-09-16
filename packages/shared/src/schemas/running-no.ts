import { z } from 'zod';

export const RunningNoPrefixSchema = z.enum(['JB', 'STK', 'TI', 'QT']);

export const RunningNoSchema = z.string().regex(
  /^(JB|STK|TI|QT)-\d{4}-\d{5}$/,
  'รูปแบบเลขรหัสไม่ถูกต้อง (ตัวอย่าง: JB-2609-08231)'
);
