# 06 — API Specification (REST, `/api/v1`)

## 0. Conventions
- JSON, camelCase; เงินใน response มีทั้ง `amountSatang` (int) — frontend format เป็นบาท
- Auth: `Authorization: Bearer <access>` หรือ httpOnly cookie; public ใช้ path token
- Error: `{ "error": { "code": "PHOTO_REQUIRED", "message": "ต้องถ่ายภาพก่อนยืนยัน", "details": {...} } }`
  - รหัสสำคัญ: `FORBIDDEN_ROLE`, `OUT_OF_SCOPE`, `INVALID_STAGE`, `VERSION_CONFLICT`(409), `PHOTO_REQUIRED`, `LOCATION_REQUIRED`, `BALANCE_OUTSTANDING`, `SHIPMENT_NOT_DISPATCHED`, `QUOTE_EXPIRED`, `NO_PROMOTION`, `VALIDATION_ERROR`
- List: `?page=1&pageSize=50&sort=openedAt:desc` → `{ items, total, page, pageSize }`
- Export: เพิ่ม `format=xlsx` ใน list endpoint → คืนไฟล์ (stream) ตาม filter เดียวกัน
- ทุก request/response schema = zod ใน `packages/shared/src/schemas` (single source of truth)

## 1. Auth & Me
| Method | Path | Body / Query | Response |
|--------|------|--------------|----------|
| POST | `/auth/login` | `{username, password}` | `{user, accessToken}` + refresh cookie |
| POST | `/auth/refresh` | cookie | `{accessToken}` |
| POST | `/auth/logout` | — | 204 |
| GET | `/me` | — | `{id, displayName, role, site, vendorCenter, menus: string[], canViewCost}` |

## 2. Master Data (Admin; GET บางตัวเปิดให้ทุก role ใช้ทำ dropdown)
| Resource | Endpoints | หมายเหตุ |
|----------|-----------|----------|
| Sites | `GET/POST /sites`, `PATCH/DELETE(archive) /sites/:id` | query `type=BRANCH\|DC` |
| District managers | `GET/POST/PATCH /district-managers` | |
| Brands | `GET/POST/PATCH /brands` | |
| Size categories + fees | `GET /size-categories` (รวม fee ปัจจุบัน), `POST /size-categories`, `PUT /fee-rates` `[{sizeCategoryId, operationFee, shippingFee3pl}]` | บันทึกแยกปุ่ม "ค่าดำเนินการ" / "ค่าขนส่ง" ได้ด้วย PATCH บางฟิลด์ |
| Vendors | `GET /vendors` (รวม centers, brands, sizes), `POST /vendors`, `PUT /vendors/:id` (ทั้งก้อนรวม centers — ตรงกับปุ่ม "บันทึก Vendor Portal"), `DELETE /vendors/:id` (archive) | |
| Branch-vendor routes | `GET /branch-vendor-routes`, `PUT /branch-vendor-routes` (replace all) | |
| SLA steps | `GET /sla-steps`, `PUT /sla-steps` (replace all, validate event names) | |
| Repair SKUs | `GET/PUT /repair-skus` | |
| Payout config | `GET/PUT /payout-config` | |
| Promotions | `GET /promotions?active=true`, `POST`, `PATCH /promotions/:id`, `DELETE` ; `GET /promotions/overlaps?...` | |
| Role permissions | `GET/PUT /rbac/menu-permissions` `{role, menuKey, allowed}[]` ; `GET/PUT /rbac/data-permissions` | |
| Dashboard config | `GET/PUT /dashboard-widgets` | |
| Users | `GET/POST/PATCH /users` | |
| Address | `GET /address/zip/:zip`, `GET /address/provinces`, `GET /address/districts?province=`, `GET /address/subdistricts?province=&district=` | public-safe |
| Settings | `GET/PUT /settings` | vatRate, quoteExpiryDays, charge3plReturnFee, tradeInCouponValidDays, vendorSlaThreshold |

## 3. Jobs
### 3.1 Create (CS)
`POST /jobs` 
```json
{
  "type": "CUSTOMER",
  "customer": { "name": "สมชาย ใจดี", "phone": "0812345671", "zipcode": "10260", "province": "กรุงเทพมหานคร", "district": "บางนา", "subdistrict": "บางนาใต้", "street": "99/1 ถ.บางนา-ตราด" },
  "taxInvoice": null,
  "item": { "sku": null, "productName": "สว่านไฟฟ้า", "brandId": "brd_bosch", "defect": "สตาร์ทไม่ติด" },
  "hasWarranty": false,
  "allowNonAuthorizedVendor": false,
  "sizeCategoryId": "size_large",
  "shippingMethod": "EXPRESS",
  "defectNotes": "รอยขีดข่วนด้านข้าง",
  "intakeAttachmentIds": ["att_1","att_2"],
  "intakePayment": { "method": "PROMPTPAY_QR" }      // หรือ { "method": "POS_RECEIPT", "posReceiptNo": "R-123" }
}
```
Response `201`: `{ job, fees: {operationFee, shippingFee, total}, payment: {id, method, qrPayload?, paymentUrl?, status}, trackingUrl }`

`POST /jobs/preview-fees` — body บางส่วน → `{operationFee, shippingFee, total}` (ใช้แสดงสดบนฟอร์ม)
`POST /jobs/:id/intake-payment/resend` — สร้าง QR/link ใหม่
`POST /stock-jobs` (S2) — `{vendorCenterId, vdContactName, channel: "DC"|"DSD", items:[{sku, productName, qty, holdStockNo, defect}]}` → `{job, stickerPdfUrl}`

### 3.2 Query
| Method | Path | Query | ใช้ที่ |
|--------|------|-------|-------|
| GET | `/jobs` | `branchId, channel, stage[], type, q (jobNo/ชื่อ/เบอร์), openedFrom, openedTo, flag=OVERDUE_GR\|OVERDUE_VD\|OVERDUE_TRANSPORT\|OVERDUE_CS\|UNPAID, sort` | งานซ่อมทั้งหมด |
| GET | `/jobs/kpis` | filter เดียวกับ `/jobs` (ยกเว้น flag) | KPI cards |
| GET | `/jobs/:id` | — | detail: job, customer (masked ตาม role), items, timeline(steps+events), sla clocks, charges, payments, balance, quotes, shipments, attachments(signed url), tradeIn |
| GET | `/jobs/by-no/:jobNo` | — | สแกน QR |
| GET | `/queues/:role/:queueKey` | `dateFrom, dateTo, branchId, channel, sort` | GR/DC/VD/CS คิว (ดู 04 §4) — response แต่ละแถว: `{job summary, hoursInStep, slaHours, overdue, shipment, currentLocation, allowedActions[]}` |
| GET | `/queues/:role/summary` | — | `{tabs:[{key,count,overdueCount}], overdueTotal, overdueList:[{jobNo, place, product, stageLabel, tabKey, overHours}]}` |

`queueKey`:
- GR: `receive`, `pack`, `handoff`, `return`, `deliver-cs`
- DC: `pickup`, `receive-location`, `handoff-vd`, `return-from-vd`, `dispatch-branch`
- VD: `receive`, `quote`, `approval`, `repair`, `return`
- CS: `ready-for-pickup`, `waiting-approval`, `open-today`
- ADMIN: `pending-vendor-assignment`

### 3.3 Actions (JobEngine)
`POST /jobs/:id/actions/:action` — header `Idempotency-Key` (optional)
```json
{ "version": 7, "attachmentIds": ["att_9"], "locationCode": "A-05-02", "note": "", "data": { } }
```
Response `200`: `{ job (ใหม่), event, sideEffects: { labelPdfUrl?, driverLinkUrl?, trackingNo?, quoteUrl? } }`

| action | `data` เฉพาะ |
|--------|-------------|
| `assign_vendor` | `{vendorCenterId, channel, overrideReason?}` |
| `record_intake_payment` | `{paymentId}` หรือ `{method:"POS_RECEIPT", posReceiptNo}` |
| `gr_receive` / `gr_receive_return` / `dc_receive_outbound` | ต้องมี `locationCode` |
| `gr_pack` | `locationCode` (ใหม่) |
| `dispatch_pickup` | `{shipmentId, method:"PRINT"\|"LINK"}` |
| `gr_handoff` / `carrier_confirm_pickup` / `dc_handoff_vd` / `dc_dispatch_confirm` / `vd_receive` | — |
| `vd_submit_quote` / `vd_revise_quote` | `{lines:[{type, description, priceSatang, partWaitDays?, partWarrantyDays?}], repairDays, vendorNote?}` (INSPECTION_FEE line ระบบใส่เอง) |
| `cs_record_decision` | `{decision:"APPROVED"\|"REJECTED", reason}` |
| `vd_pause_parts` / `vd_resume_parts` | `{reason}` |
| `vd_return_pack` | — |
| `record_repair_payment` | `{method, posReceiptNo?}` → คืน `{payment}` (QR/link) |
| `cs_close` | — |
| `cancel` | `{reason}` |

`GET /jobs/:id/allowed-actions` → `[{action, enabled, disabledReason}]` (frontend ใช้ enable/disable ปุ่ม)

### 3.4 Attachments
- `POST /attachments/presign` `{kind, mimeType, jobId?}` → `{attachmentId, uploadUrl, headers}`
- `POST /attachments/:id/complete` → 204 (ตรวจว่ามีไฟล์ใน S3)
- `GET /attachments/:id/url` → signed URL 10 นาที

### 3.5 Documents (PDF)
| Path | เอกสาร |
|------|--------|
| `GET /documents/jobs/:id/intake-slip` | ใบแจ้งซ่อม + QR + วิธีจัดส่ง |
| `GET /documents/jobs/:id/box-label?direction=OUTBOUND\|INBOUND` | ใบปะหน้ากล่อง (QR, เลขงาน, สินค้า, VD ปลายทาง / สาขาปลายทาง, ช่องทาง) |
| `GET /documents/shipments/:id/driver-sheet` | เอกสารคนรถ |
| `GET /documents/quotes/:id` | ใบเสนอราคา |
| `GET /documents/stock-jobs/:id/stickers` | สติ๊กเกอร์ 2×2" บน A4 |
| `GET /documents/reports/executive?period=` | Executive report PDF |

## 4. Trade-in
| Method | Path | Body/Query |
|--------|------|-----------|
| GET | `/tradeins` | `q, type, status, page` |
| GET | `/tradeins/kpis` | → `{issued, used, conversionPct}` |
| GET | `/tradeins/eligible-jobs` | job ประเภท 2 ที่เข้าเงื่อนไข (05 §6.2) |
| POST | `/tradeins/preview-promotion` | `{type, sizeCategoryId, subDept?}` → `{promotion \| null, percent}` |
| POST | `/tradeins` | T1: `{type:"TYPE1_WALK_IN", customerName, customerPhone, sku?, productName, brandName?, defect?, sizeCategoryId, attachmentIds[]}` ; T2: `{type:"TYPE2_BACKOFFICE", jobId}` → `{tradeIn}` |
| POST | `/tradeins/:id/retry` | ส่ง Wallet ใหม่ |

## 5. Payments & Payouts
| Method | Path | หมายเหตุ |
|--------|------|---------|
| GET | `/jobs/:id/balance` | `{charges[], payments[], balanceSatang}` |
| GET | `/payouts/cycles` | รายการรอบ (จาก config + batch ที่มี) |
| GET | `/payouts/report` | `cycleDate, from, to, view=VD\|BRANCH, q` → `{kpis, groups:[{key, label, jobCount, repairTotal, gpPct?, gpAmount?, netTotal, status}]}` (gp fields เฉพาะ canViewCost) |
| GET | `/payouts/report/groups/:key` | รายการใบงานในกลุ่ม |
| POST | `/payouts/batches` | `{cycleDate, view, groupKeys[]}` → สร้าง + SENT |
| PATCH | `/payouts/batches/:id` | `{status:"PAID", externalRef}` |
| GET/POST | `/vendor-deductions` | `{vendorId, jobId?, amountSatang, reason}` |

## 6. Reports / Dashboards
| Method | Path | Query | Response |
|--------|------|-------|----------|
| GET | `/reports/overview` | `period=weekly\|monthly\|yearly, branchId?` | `{kpis, pipeline, finance:{labels, revenue, cost, profit}, jobTrend, slaViolations, waitingParts, gpBreakdown, vdSummary, vdRanking}` |
| GET | `/reports/executive` | `period=daily\|month\|quarter\|year` | `{summaryText, financial:{revenue, gp, margin, cost, prior...}, trend, ops:{sla, tat, approvalRate, backlog}, branches, vdConcentration, cx:{csat, approvalRate, tradeinConv, trend}, attentionItems}` |
| GET | `/reports/jobs.xlsx` | filter แบบ `/jobs` | Excel |
| GET | `/reports/dc.xlsx`, `/reports/vd.xlsx` | `from, to` | Excel หลาย sheet ตามแท็บ |

## 7. Public (token)
| Method | Path | ใช้ใน |
|--------|------|------|
| GET | `/public/track/:token` | tracking: `{jobNo, productName, branchName, stageLabel, timeline:[{label, at}], balance?}` (ไม่มีข้อมูลพนักงาน) |
| GET | `/public/quotes/:token` | `{jobNo, product, vendorName, vendorCode, lines, subtotal, vat, total, repairDays, repairWarrantyDays, status, expiresAt}` + log `QUOTE_VIEWED` |
| POST | `/public/quotes/:token/approve` | `{payNow: boolean, method?: "PROMPTPAY_QR"\|"CARD_LINK"}` → `{payment?}` |
| POST | `/public/quotes/:token/reject` | → `{message}` |
| GET | `/public/pay/:token` | ยอดค้าง + สร้าง QR/link |
| GET | `/public/driver/:token` | `{jobNo, from, to, product, contact}` |
| POST | `/public/driver/:token/confirm-pickup` | `{attachmentIds}` (DSD) |
| POST | `/public/csat/:token` | `{score 1..5, comment?}` |
| POST | `/public/attachments/presign` | สำหรับ driver token |

> ⚠️ ห้ามรับข้อมูลบัตรเครดิตเข้าระบบเราเอง — หน้า "ชำระผ่านบัตร" ใน prototype ต้องเปลี่ยนเป็น redirect ไป hosted payment page ของ gateway

## 8. Webhooks (inbound)
| Path | จาก | ทำอะไร |
|------|-----|--------|
| `POST /webhooks/payment` | Payment gateway | verify signature → Payment PAID/FAILED (idempotent ด้วย providerRef) → event `PAYMENT_RECEIVED` |
| `POST /webhooks/3pl` | 3PL | `{trackingNo, status: PICKED_UP\|DELIVERED\|FAILED, at}` → JobEngine `tpl.picked_up` / `tpl.delivered` |
| `POST /webhooks/wallet` | Wallet app | `{walletRef, status: USED\|EXPIRED, at}` → TradeIn status |
| `POST /webhooks/line` | LINE | (optional) ผูก lineUserId กับเบอร์ |

## 9. Outbound jobs (worker topics)
`notify.job_opened`, `notify.quote_sent`, `notify.ready_for_pickup`, `notify.csat`, `notify.sla_breached`, `tpl.book`, `tpl.cancel`, `wallet.issue`, `wallet.sync`, `payout.submit`, `sla.scan` (cron 5 นาที), `quote.expire` (cron ชั่วโมง), `report.snapshot` (cron รายวัน 01:00)
