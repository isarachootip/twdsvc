-- =====================================================================
-- Status Code Migration: Legacy codes -> New 3-digit standard codes
-- Request Repair System | SRS v2.1 | 2026-07-17
--
-- มาตรฐานใหม่: หลักร้อย = เฟส (0 ยกเลิก, 1 รับเข้า, 2 DC Path, 3 Vendor Path)
--              หลักสิบ  = ขั้นตอน (เพิ่มทีละ 10)
--              หลักหน่วย = 0 ปกติ | 5 ทางเลือกคู่ขนาน | 9 ปิดงาน
--
-- คำเตือน: 1) สำรองฐานข้อมูลก่อนรัน  2) หยุดระบบชั่วคราวระหว่าง migrate
--          3) ปรับชื่อตาราง/คอลัมน์ให้ตรงกับ schema จริงก่อนใช้งาน
--          4) โค้ดฝั่งแอป (rollback map, roleActionMap, canHandle,
--             quotation mode ranges) ต้อง deploy เวอร์ชันรหัสใหม่พร้อมกัน
-- =====================================================================

BEGIN;

-- 1) ตาราง mapping
CREATE TABLE IF NOT EXISTS status_code_map (
    legacy_code  VARCHAR(10) PRIMARY KEY,
    new_code     VARCHAR(3)  NOT NULL UNIQUE,
    status_name  VARCHAR(255),
    path         VARCHAR(10)
);

INSERT INTO status_code_map (legacy_code, new_code, status_name, path) VALUES
 ('0',   '000', 'ใบแจ้งซ่อมถูกยกเลิก',                          'ALL'),
 ('10',  '100', 'เปิดใบแจ้งซ่อม / ส่งซ่อม',                      'ALL'),
 ('11',  '110', 'GR รับสินค้าซ่อมจาก CS',                        'ALL'),
 ('20',  '200', 'GR เปิด log DC',                                'DC'),
 ('201', '210', 'รอ DC มารับสินค้า',                             'DC'),
 ('21',  '220', 'DC รับสินค้าจากสาขาแล้ว',                       'DC'),
 ('22',  '230', 'DC รอ Vendor มารับสินค้า',                      'DC'),
 ('23',  '240', 'รอ Vendor ตีราคา',                              'DC'),
 ('232', '250', 'ขออนุมัติราคาจากลูกค้า',                        'DC'),
 ('233', '260', 'แจ้งผลการอนุมัติ',                              'DC'),
 ('234', '270', 'รอ Vendor ส่งคืนสินค้า (ไม่อนุมัติซ่อม)',        'DC'),
 ('235', '275', 'รอ Vendor ส่งคืนสินค้าซ่อมเสร็จ',               'DC'),
 ('2360','280', 'DC รับสินค้าคืนจาก Vendor แล้ว',                'DC'),
 ('2361','285', 'GR รับสินค้าคืนจาก DC แล้ว',                    'DC'),
 ('236', '290', 'CS รับสินค้าคืนแล้ว / รอลูกค้ารับสินค้าคืน',    'DC'),
 ('237', '299', 'ลูกค้ารับสินค้าแล้ว (ปิดงาน)',                  'DC'),
 ('30',  '300', 'รอ Vendor มารับสินค้า',                         'VENDOR'),
 ('31',  '310', 'รอ Vendor ตีราคา',                              'VENDOR'),
 ('32',  '320', 'ขออนุมัติราคาจากลูกค้า',                        'VENDOR'),
 ('33',  '330', 'แจ้งผลการอนุมัติ',                              'VENDOR'),
 ('34',  '340', 'รอ Vendor ส่งคืนสินค้า (ไม่อนุมัติซ่อม)',        'VENDOR'),
 ('35',  '345', 'รอ Vendor ส่งคืนสินค้าซ่อมเสร็จ',               'VENDOR'),
 ('360', '350', 'Vendor คืนผ่าน DC แทนสาขา (DC รอส่งเข้าสาขา)',  'VENDOR'),
 ('361', '360', 'GR รับสินค้าคืนจาก Vendor / DC แล้ว',           'VENDOR'),
 ('36',  '390', 'CS รับสินค้าคืนแล้ว / รอลูกค้ารับสินค้าคืน',    'VENDOR'),
 ('37',  '399', 'ลูกค้ารับสินค้าแล้ว (ปิดงาน)',                  'VENDOR');

-- 2) เพิ่มคอลัมน์ legacy_code ใน status_info เพื่อเก็บร่องรอย (ครั้งเดียว)
ALTER TABLE status_info ADD COLUMN IF NOT EXISTS legacy_code VARCHAR(10);

-- 3) Update ตารางหลัก
--    !! สำคัญ: ตาราง 360/361 สลับกัน (legacy 360 -> 350, legacy 361 -> 360)
--    การ update ผ่าน JOIN กับ mapping table ในคำสั่งเดียวจึงปลอดภัยกว่า
--    การรัน UPDATE ทีละค่า (ไม่เกิดการ update ซ้ำสองรอบ)

-- 3.1 repair_ticket.status และ reject_from_status
UPDATE repair_ticket t
SET    status = m.new_code
FROM   status_code_map m
WHERE  t.status = m.legacy_code;

UPDATE repair_ticket t
SET    reject_from_status = m.new_code
FROM   status_code_map m
WHERE  t.reject_from_status = m.legacy_code;

-- 3.2 transaction_log.step_no
UPDATE transaction_log l
SET    step_no = m.new_code
FROM   status_code_map m
WHERE  l.step_no = m.legacy_code;

-- 3.3 attachment.step_no
UPDATE attachment a
SET    step_no = m.new_code
FROM   status_code_map m
WHERE  a.step_no = m.legacy_code;

-- 3.4 status_info (SLA config)
UPDATE status_info s
SET    legacy_code = s.status_code,
       status_code = m.new_code
FROM   status_code_map m
WHERE  s.status_code = m.legacy_code;

-- 4) ตรวจสอบผล: ต้องเป็น 0 แถวทุกคำสั่ง (ไม่มีรหัสเก่าตกค้าง)
-- SELECT count(*) FROM repair_ticket   WHERE status  IN (SELECT legacy_code FROM status_code_map WHERE legacy_code <> new_code);
-- SELECT count(*) FROM transaction_log WHERE step_no IN (SELECT legacy_code FROM status_code_map WHERE legacy_code <> new_code);
-- SELECT count(*) FROM attachment      WHERE step_no IN (SELECT legacy_code FROM status_code_map WHERE legacy_code <> new_code);

COMMIT;

-- =====================================================================
-- อ้างอิงสำหรับแก้โค้ดฝั่งแอป (deploy พร้อมกัน):
--   Rollback map ใหม่:
--     200→110, 210→200, 220→210, 230→220, 240→230, 250→240, 260→250,
--     270→260, 275→270, 280→275, 290→275, 299→290,
--     310→300, 320→310, 330→320, 340→330, 345→340, 390→345, 399→390
--   roleActionMap ใหม่:
--     CS: 100, 240, 250, 260, 285, 290, 310, 320, 330, 360, 390
--     GR: 110, 200, 210, 280, 300, 340, 345, 350
--     DC: 220, 230, 270, 275
--   Path selection: DC = update เป็น 200, Vendor = update เป็น 300
--   Quotation mode: DC = สถานะ 250–275, VEN = สถานะ 320–345
--   Notify result: อนุมัติ → 275/345, ไม่อนุมัติ → 270/340
--   DC reject: rollback จาก 210/220/230 + reject_flg='Y'
--   Special case: status 220 + reject_flg='Y' → งานของ GR
-- =====================================================================
