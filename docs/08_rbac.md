# 08 — RBAC, Data Scope & Security

## 1. Roles
| Role | ผูก scope กับ | คำอธิบาย |
|------|---------------|---------|
| `ADMIN` | ทั้งระบบ | ตั้งค่า, รายงาน, ทำจ่าย, แก้ปัญหางาน (break-glass) |
| `EXECUTIVE` | ทั้งระบบ (อ่านอย่างเดียว) | dashboard ผู้บริหาร |
| `CS` | `siteId` (สาขา) | เปิดงาน, รับชำระ, ปิดงาน, Trade-in |
| `GR` | `siteId` (สาขา) | คิว GR |
| `DC` | `siteId` (คลัง DC) | คิว DC |
| `VD` | `vendorCenterId` | คิว VD ของศูนย์ย่อยตัวเอง |
| `S2` | `siteId` (สาขา) | งานสต็อกสาขา |

## 2. Menu Matrix (default seed ของ `RoleMenuPermission`)
✓ = ใช้งานได้, 👁 = ดูอย่างเดียว, — = ไม่เห็น

| menuKey | เมนู | ADMIN | EXECUTIVE | CS | GR | DC | VD | S2 |
|---------|------|:-----:|:---------:|:--:|:--:|:--:|:--:|:--:|
| `exec` | Executive Dashboard | ✓ | ✓ | — | — | — | — | — |
| `analytics` | Dashboard Overview | ✓ | ✓ | — | — | — | — | — |
| `jobs` | งานซ่อมทั้งหมด | ✓ | 👁 | ✓ | ✓ | ✓ | ✓ | ✓ |
| `cs` | เปิดใบแจ้งซ่อม / คิว CS | 👁 | — | ✓ | — | — | — | — |
| `gr` | GR | 👁 | — | — | ✓ | — | — | — |
| `dc` | DC | 👁 | — | — | — | ✓ | — | — |
| `vd` | ช่าง (VD) | 👁 | — | — | — | — | ✓ | — |
| `tradein` | Trade-in / คูปอง | 👁 | — | ✓ | — | — | — | — |
| `s2` | สต็อกสาขา (S2) | 👁 | — | — | — | — | — | ✓ |
| `vd_payment` | รายงานจ่ายเงิน VD | ✓ | 👁 | — | — | — | — | — |
| `admin` | ตั้งค่าระบบหลังบ้าน | ✓ | — | — | — | — | — | — |

Admin แก้ matrix ได้ที่ admin › สิทธิ์ผู้ใช้งาน ยกเว้น `admin` ของ ADMIN (ล็อกไว้กันล็อกตัวเอง)

## 3. Action Permissions
| Action | Roles |
|--------|-------|
| `open` (CUSTOMER), `record_intake_payment`, `record_repair_payment`, `cs_record_decision`, `cs_close` (CUSTOMER), Trade-in create | CS |
| `open` (STOCK), `cs_close` (STOCK) | S2 (+GR สำหรับปิด STOCK) |
| `gr_receive`, `gr_pack`, `gr_handoff`, `gr_receive_return`, `gr_deliver_cs` | GR |
| `dispatch_pickup` (legs DC_FLEET), `dc_receive_outbound`, `dc_handoff_vd`, `dc_receive_inbound`, `dc_dispatch_confirm` | DC |
| `dispatch_pickup` (legs VD_FLEET), `carrier_confirm_pickup`, `vd_receive`, `vd_submit_quote`, `vd_revise_quote`, `vd_start_repair`, `vd_pause_parts`, `vd_resume_parts`, `vd_finish_repair`, `vd_return_pack` | VD |
| `customer_approve`, `customer_reject` | CUSTOMER (token) |
| `assign_vendor`, `cancel` (ทุก stage ก่อนปิด) | ADMIN |
| `cancel` (CS_OPENED, PENDING_VENDOR_ASSIGNMENT) | CS |
| **Break-glass**: action ใดก็ได้ | ADMIN — ต้องมี `note` เหตุผล, บันทึก `actorRole=ADMIN_OVERRIDE`, แจ้งเตือนใน AuditLog |

## 4. Data Scope (บังคับใน repository layer ทุก query)
| Role | Jobs ที่เห็น |
|------|-------------|
| ADMIN / EXECUTIVE | ทั้งหมด |
| CS / GR / S2 | `job.branchId = user.siteId` |
| DC | job ที่มี Shipment leg `BRANCH_TO_DC` / `DC_TO_VD` / `VD_TO_DC` / `DC_TO_BRANCH` และสาขา/ศูนย์ปลายทางอยู่ใน route ที่ผ่าน DC ของผู้ใช้ (MVP: channel=DC ทั้งหมด ถ้ามี DC เดียวต่อภูมิภาค ให้ map `Site(DC)` ↔ สาขาผ่าน config `dcCoverage`) |
| VD | `job.vendorCenterId = user.vendorCenterId` |

## 5. PII / ข้อมูลอ่อนไหว
| ข้อมูล | ADMIN/EXEC | CS | GR | S2 | DC | VD |
|--------|:----------:|:--:|:--:|:--:|:--:|:--:|
| ชื่อลูกค้า | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| เบอร์โทร | ✓ | ✓ | mask | — | mask `xxx-xxx-5671` | mask |
| ที่อยู่ / ใบกำกับภาษี | ✓ | ✓ | — | — | — | — |
| ยอดเงินลูกค้า | ✓ | ✓ | — | — | — | quote ของตัวเอง |
| GP% / ต้นทุน / กำไร | ตาม `canViewCost` (default ADMIN, EXECUTIVE = true) | — | — | — | — | GP% ของตัวเอง (read) |

Masking ทำฝั่ง API serializer (ไม่ส่งข้อมูลเต็มไป frontend)

## 6. Public Token Security
- token = 32 bytes random (base64url) เก็บใน `PublicToken`; ไม่ใช้ jobNo ใน URL
- อายุ: TRACKING 90 วัน, QUOTE `quoteExpiryDays`, PAYMENT 7 วัน, DRIVER 48 ชม., CSAT 14 วัน
- QUOTE approve/reject ใช้ครั้งเดียว (`usedAt`)
- Rate limit 30 req/นาที/IP สำหรับ `/public/*`
- หน้า public ไม่แสดงชื่อพนักงาน/ภาพภายใน

## 7. Auth
- Password: bcrypt cost 12, นโยบาย ≥10 ตัวอักษร
- Lock 15 นาทีหลังผิด 5 ครั้ง
- Session: access JWT 15 นาที, refresh rotate 7 วัน (เก็บ hash ใน DB เพื่อ revoke)
- ปิดผู้ใช้ (`active=false`) → revoke refresh ทันที
- เตรียม interface สำหรับ SSO (Azure AD / Google Workspace) ใน phase ถัดไป
