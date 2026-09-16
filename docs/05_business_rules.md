# 05 — Business Rules & Calculations

> ทุกฟังก์ชันในเอกสารนี้ต้อง implement เป็น pure function ใน `packages/shared/src/rules/*` พร้อม unit test ตามตัวอย่างที่ให้ไว้
> เงินคำนวณเป็น **สตางค์ (integer)**; ปัดเศษ = round half up

## 1. ค่าธรรมเนียมตอนเปิดงาน (`rules/fees.ts`) — จาก `cs.html`

### 1.1 คำนวณ
```ts
function calcIntakeFees(input: { jobType; hasWarranty: boolean; shippingMethod: 'STANDARD'|'EXPRESS'; feeRate: { operationFee; shippingFee3pl } }) {
  if (input.jobType === 'STOCK') return { operationFee: 0, shippingFee: 0, total: 0 };
  if (input.shippingMethod === 'EXPRESS')
    return { operationFee: feeRate.operationFee, shippingFee: feeRate.shippingFee3pl, total: sum };
  const operationFee = input.hasWarranty ? 0 : feeRate.operationFee;   // STANDARD
  return { operationFee, shippingFee: 0, total: operationFee };
}
```

| กรณี | ขนาดเล็ก (150/80) | ขนาดใหญ่ (300/250) |
|------|------------------|--------------------|
| มีประกัน + มาตรฐาน | 0 + 0 = **0** | **0** |
| ไม่มีประกัน + มาตรฐาน | 150 + 0 = **150** | **300** |
| มีประกัน + ส่งด่วน | 150 + 80 = **230** | **550** |
| ไม่มีประกัน + ส่งด่วน | **230** | **550** |

- ค่าธรรมเนียมเหล่านี้ถือว่า **รวม VAT แล้ว** (ราคาหน้าร้าน) 🔶
- ใช้ `FeeRate` ที่ `effectiveFrom <= openedAt` ล่าสุด แล้ว snapshot ลง `JobCharge`
- ช่องทางชำระตอนเปิดงาน: `PROMPTPAY_QR` (แสดง QR ให้ลูกค้าสแกน), `CARD_LINK` (gen link), `POS_RECEIPT` (กรอกเลขใบเสร็จ POS อ้างอิง)
- ถ้ายอด = 0 ไม่สร้าง Payment

### 1.2 กรณีไม่อนุมัติซ่อม
ค่าดำเนินการ + ค่าขนส่งที่จ่ายตอนเปิดงาน **ไม่คืน** — หน้า CS แสดง "ค่าใช้จ่ายที่ลูกค้าจะไม่ได้รับคืน" = ผลรวม intake payments; ถ้าเป็น 0 แสดง "กรณีนี้ไม่มีค่าใช้จ่ายที่เรียกเก็บไปตอนเปิดงาน (มีประกัน + ส่งแบบมาตรฐาน)"

### 1.3 กรณีอนุมัติซ่อม — ยอดสุทธิ
```
charges  = OPERATION_FEE + SHIPPING_FEE + REPAIR(quote.total)
credit   = OPERATION_FEE_CREDIT = −min(operationFeePaid, quote.total)
paid     = Σ Payment.status=PAID
balance  = Σcharges + credit − paid           // ยอดค้างชำระ
```
ตัวอย่าง (ขนาดใหญ่ ไม่มีประกัน ส่งด่วน, ใบเสนอราคารวม VAT ฿1,200):
charges = 300 + 250 + 1,200 = 1,750 ; credit = −300 ; paid (intake) = 550 → **balance = ฿900**
(หน้า CS แสดง: ค่าซ่อม ฿1,200 · ค่าดำเนินการ (หักเป็นส่วนลด) −฿300 · ค่าขนส่ง 3PL ชำระแล้ว · **ยอดคงเหลือ ฿900**)
> `cs.html` ตัวอย่างนับค่า 3PL ซ้ำ (฿1,150) — ถือเป็น 🔶 C3 ตั้งค่า `charge3plReturnFee=true` เพื่อเพิ่ม SHIPPING_FEE ขากลับอีกหนึ่งรายการได้

## 2. ใบเสนอราคา (`rules/quote.ts`) — จาก `vd.html`, `customer_quote.html`

### 2.1 โครงสร้าง
| Line | ที่มา | แก้ได้ |
|------|------|--------|
| `INSPECTION_FEE` ค่าเปิดเครื่อง | auto: `hasWarranty ? vendor.inspectionFeeCovered : vendor.inspectionFeeNotCovered` | ❌ |
| `PART` อะไหล่ | VD กรอก: description, price(ก่อน VAT), partWaitDays (รออะไหล่ วัน), partWarrantyDays | ✅ หลายบรรทัด |
| `LABOR` ค่าแรง | VD กรอก | ✅ |
| `OTHER` | VD กรอก | ✅ |
| repairDays | VD กรอก (≥1) | ✅ |
| repairWarrantyDays | `vendor.repairWarrantyDays` | ❌ |
| vendorNote | VD กรอก เช่น "ตรวจพบสายไฟชำรุดเพิ่มเติม" | ✅ |

### 2.2 คำนวณ
```ts
subtotal = Σ line.price
vat      = roundHalfUp(subtotal * vatRate)      // vatRate = SystemSetting 0.07
total    = subtotal + vat
estimatedDays = repairDays + max(partWaitDays ?? 0)
```
ตัวอย่าง `customer_quote.html`: ค่าเปิดเครื่อง 300 + แผงควบคุมความร้อน 450 + สายไฟ 150 → subtotal 900, VAT 63, **total 963**, ซ่อม 3 วัน, รับประกัน 30 วัน

### 2.3 กติกา
- total = 0 → auto approve (decision `AUTO_APPROVED`), ไม่ส่ง LON ขออนุมัติ
- quote token หมดอายุ `quoteExpiryDays` (default 7) → event `QUOTE_EXPIRED` + แจ้ง CS ให้โทรติดตาม (ไม่ auto reject) 🔶
- แก้ไขได้ระหว่าง `WAITING_APPROVAL` → version ใหม่, ของเดิม `SUPERSEDED`
- เอกสารใบเสนอราคาแสดงหัว "ศูนย์บริการซ่อมไทวัสดุ / Thaiwasadu Service Center" + ที่อยู่สาขาที่เปิดงาน (ไม่ใช่ที่อยู่ VD) + เลข QT, เลขงาน, ลูกค้า, สินค้า, รายการ, subtotal/VAT/total, ระยะเวลาซ่อม, รับประกัน

## 3. การเลือกศูนย์ซ่อมและช่องทาง (`rules/routing.ts`) — จาก `admin.html` (Vendor Portal + จับคู่สาขา)

```ts
function resolveRouting(job: { branchId; brandId; sizeCategoryId; shippingMethod; hasWarranty; allowNonAuthorizedVendor }, master) {
  const eligible = (c: VendorCenter) =>
       c.vendor.brands.includes(job.brandId)
    && c.vendor.sizes.includes(job.sizeCategoryId)
    && (c.vendor.isBrandAuthorized || job.allowNonAuthorizedVendor)
    && !c.archivedAt;

  // 1) route ของสาขา (อาจมีหลายแถว — เรียงตามลำดับที่ admin จัด)
  for (const r of master.routes.filter(r => r.branchId === job.branchId)) {
    if (eligible(r.primaryCenter)) return build(r.primaryCenter, r.standardChannel);
    if (r.backupCenter && eligible(r.backupCenter)) return build(r.backupCenter, r.standardChannel);
  }
  // 2) fallback: ศูนย์ย่อยที่ zoneSite = สาขานี้
  const zone = master.centers.find(c => c.zoneSiteId === job.branchId && eligible(c));
  if (zone) return build(zone, zone.method === 'DC' ? 'DC' : 'DSD');
  // 3) ไม่พบ → PENDING_VENDOR_ASSIGNMENT
  return null;

  function build(center, standardChannel) {
    const channel = job.shippingMethod === 'EXPRESS' ? 'TPL' : standardChannel;
    assertCompatible(center.method, channel);   // DSD center รับ DC ไม่ได้, DC center รับ DSD ไม่ได้, DC_DSD ได้ทั้งคู่, TPL ได้ทุก method
    return { vendorCenterId: center.id, channel };
  }
}
```
- Admin หน้า "จับคู่สาขา-VD": เลือกสาขา → แสดงผู้จัดการเขตอัตโนมัติ → เลือกศูนย์ย่อยอันดับ 1 / สำรอง / standardChannel
- GP% และ SLA ของศูนย์ย่อย: ใช้ override ถ้ามี มิฉะนั้นใช้ค่า VD หลัก (placeholder "ค่าเริ่มต้น: 18%")

## 4. SLA Engine (`rules/sla.ts`) — รวมจาก `admin.html`, `dashboard.html`, `gr.html`, `dc.html`, `vd.html`

### 4.1 SlaStep เริ่มต้น (seed)

| seq | code | ชื่อ (UI) | start event | stop event | condition | ชม. | owner |
|----|------|-----------|-------------|-----------|-----------|-----|-------|
| 1 | `CS_HANDOVER` | CS เปิดใบแจ้งซ่อม → ส่งมอบ GR | JOB_OPENED | GR_RECEIVED | | 24 | CS |
| 2 | `GR_PACK` | GR Pack สินค้าลงกล่อง | GR_RECEIVED | GR_PACKED | | 4 | GR |
| 3 | `CARRIER_PICKUP_BRANCH` | DC/VD/3PL เข้ารับสินค้าที่สาขา | GR_PACKED | OUTBOUND_HANDED_OFF | | 24 | CARRIER |
| 4 | `GR_HANDOFF` | GR ส่งมอบให้ DC/VD/3PL | SHIPMENT_DISPATCHED (ขาแรก) | OUTBOUND_HANDED_OFF | | 4 | GR |
| 5 | `DC_RECEIVE_LOCATION` | DC รับเข้า Location | OUTBOUND_HANDED_OFF | DC_RECEIVED_OUTBOUND | channel=DC | 4 | DC |
| 6 | `VD_PICKUP_AT_DC` | VD เข้ารับสินค้าที่ DC | DC_RECEIVED_OUTBOUND | DC_HANDED_OFF_VD | channel=DC | 24 | VD |
| 7 | `VD_RECEIVE` | สินค้าถึงศูนย์ VD | OUTBOUND_HANDED_OFF\|DC_HANDED_OFF_VD | VD_RECEIVED | (DC: เริ่มที่ DC_HANDED_OFF_VD) | 24 | CARRIER |
| 8 | `VD_QUOTE` | VD ประเมิน/เสนอราคา | VD_RECEIVED | QUOTE_SENT\|REPAIR_STARTED | | 48 | VD |
| 9 | `CUSTOMER_APPROVAL` | รอลูกค้าอนุมัติ | QUOTE_SENT\|QUOTE_REVISED | CUSTOMER_APPROVED\|CUSTOMER_REJECTED | type=CUSTOMER | 48 | CUSTOMER |
| 10 | `VD_REPAIR` | VD ระยะเวลาซ่อม (ไม่รวมรออะไหล่) | CUSTOMER_APPROVED\|REPAIR_STARTED | REPAIR_FINISHED | pausable | 168* | VD |
| 11 | `VD_RETURN_PACK` | VD Pack ส่งคืน 3PL/DC/สาขา | REPAIR_FINISHED\|CUSTOMER_REJECTED | RETURN_PACKED | | 24 | VD |
| 12 | `DC_RETURN_RECEIVE` | DC รับคืนจาก VD | RETURN_PACKED | DC_RECEIVED_INBOUND | channel=DC | 24 | DC |
| 13 | `DC_DISPATCH_BRANCH` | DC ส่งคืนกลับสาขา | DC_RECEIVED_INBOUND | DC_DISPATCHED_TO_BRANCH | channel=DC | 24 | DC |
| 14 | `GR_RETURN_RECEIVE` | สินค้าคืนถึงสาขา (GR รับคืน) | RETURN_PACKED (≠DC) \| DC_DISPATCHED_TO_BRANCH | GR_RETURN_RECEIVED | | 24 | CARRIER |
| 15 | `GR_DELIVER_CS` | GR ส่งมอบ CS | GR_RETURN_RECEIVED | DELIVERED_TO_CS | | 4 | GR |
| 16 | `CUSTOMER_PICKUP` | ลูกค้าเข้ารับสินค้า / ปิดงาน | DELIVERED_TO_CS | JOB_CLOSED | | 168 | CS |

\* `VD_REPAIR.hours = (center.repairSlaDaysOverride ?? vendor.defaultRepairSlaDays) × 24`
Admin หน้า SLA แสดงทุกขั้นเรียงตาม seq, แก้ชั่วโมง/วันได้ (รับ input "24 ชม." หรือ "2 วัน" → แปลงเป็นชั่วโมง), เพิ่ม/ปิดขั้นได้

### 4.2 Owner resolve
`CARRIER` → channel `DC`→**DC** (ยกเว้น step 7 เมื่อ channel=DC → **VD** เพราะ VD ขนเองจาก DC), `DSD`→**VD**, `TPL`→**TPL**

### 4.3 Clock lifecycle
```ts
onEvent(job, event):
  for step of activeSteps(job.type):
    if matches(step.stopEvent, event) && clock(step).status in [RUNNING,PAUSED]: stop(clock, event.createdAt)
    if matches(step.startEvent, event) && condition(step, job) && !clockExists(step): start(step, event.createdAt)
  // QUOTE_REVISED: stop + restart CUSTOMER_APPROVAL (delete old clock → new one)
start: dueAt = startedAt + hours
pause (REPAIR_PAUSED):  pausedAt = now, status=PAUSED
resume (REPAIR_RESUMED): pausedMinutes += now − pausedAt; dueAt += (now − pausedAt); status=RUNNING
stop: stoppedAt = at; breached = at > dueAt
cron ทุก 5 นาที: RUNNING && now > dueAt && !breached → breached=true, breachedAt, event SLA_BREACHED, notify owner dept
```

### 4.4 Job-level values (ใช้ในทุกคิว/dashboard)
```ts
runningClocks = clocks.filter(status in RUNNING|PAUSED)
hoursInStep   = floor((now − primaryClock.startedAt − pausedMinutes)/60)    // primaryClock = clock ของคิวที่กำลังดู หรือ clock ที่เริ่มล่าสุด
slaHours      = primaryClock.hours
isOverdue     = runningClocks.some(c => now > c.dueAt)
overdueOwner  = runningClocks.filter(overdue).sortBy(overage desc)[0].ownerDept
overageHours  = now − dueAt
```
UI: `SlaTag` แสดง "`{hoursInStep}` ชม." บรรทัดล่าง "SLA `{slaHours}` ชม. — เกิน" สีแดงเมื่อเกิน; เลขงานเป็นสีแดง

### 4.5 KPI บน "งานซ่อมทั้งหมด" (`dashboard.html`)
| KPI | Filter |
|-----|--------|
| งานทั้งหมด | ทุก job ตาม filter วันที่เปิด |
| เกิน SLA ฝั่ง GR | isOverdue && overdueOwner=GR |
| เกิน SLA ฝั่ง VD | overdueOwner=VD |
| เกิน SLA ฝั่งขนส่ง (DC/3PL) | overdueOwner ∈ {DC, TPL} |
| เกิน SLA ฝั่ง CS/ลูกค้า | overdueOwner ∈ {CS, CUSTOMER} |
| ยอดค้างชำระ | type=CUSTOMER && decision∈{APPROVED} && balance>0 && stage ∉ CLOSED/CANCELLED |

กด KPI = filter ตาราง, แสดงปุ่ม "✕ ล้างตัวกรองรายการเร่งด่วน"

## 5. Running Number (`rules/running-no.ts`)
- รูปแบบ `{PREFIX}-{YY}{MM}-{SEQ}`; PREFIX: `JB` (5 หลัก), `STK` (5), `TI` (5), `QT` (5); YYMM ตามเวลา Asia/Bangkok, ปี ค.ศ.
- สร้างใน transaction: `INSERT ... ON CONFLICT (prefix,yymm) DO UPDATE SET lastSeq = lastSeq+1 RETURNING lastSeq`
- ห้าม reuse แม้ job ถูกยกเลิก

## 6. Trade-in & Promotion (`rules/promo.ts`) — จาก `tradein.html`, `admin.html`

### 6.1 เลือกโปร
```ts
function bestPromotion(promos, { type, sizeCategoryId, subDept, date /* Bangkok date */ }) {
  const m = promos.filter(p => p.status === 'ACTIVE' && p.tradeInType === type && p.sizeCategoryId === sizeCategoryId
      && (p.subDept == null || p.subDept === subDept) && p.startDate <= date && date <= p.endDate);
  m.sort((a, b) => Number(b.percent) - Number(a.percent) || b.createdAt.getTime() - a.createdAt.getTime());
  return m[0] ?? null;
}
```
**Test จาก seed (วันที่ 2026-09-12):** T2+LARGE → "โปรลูกค้าเก่า" 15% (เท่ากับโปรปีใหม่ แต่สร้างล่าสุด) ; T1+SMALL → "โปรทั่วไป" 10% ; T1+LARGE → "โปรทั่วไปใหญ่" 8% ; T2+SMALL → null

### 6.2 กติกา
| กติกา | รายละเอียด |
|-------|-----------|
| สิทธิ์ | CS (สาขาตัวเอง) |
| ประเภท 1 หน้างาน | ไม่ผูก job; บังคับ ชื่อ, เบอร์, ชื่อสินค้า, ขนาด; SKU/แบรนด์/อาการ ไม่บังคับ; ภาพ ≤4 |
| ประเภท 2 หลังบ้าน | เลือกจาก job ที่ `type=CUSTOMER`, `decision=REJECTED`, stage ∈ {`READY_FOR_PICKUP`, `CLOSED_NOT_REPAIRED`}, ยังไม่มี TradeIn → auto-fill ลูกค้า/สินค้า/แบรนด์/ขนาด (read-only) |
| ไม่มีโปรตรงเงื่อนไข | แสดง "ไม่มีโปรโมชั่นที่ Active ตรงกับเงื่อนไขนี้" และ **ปิดปุ่มสร้าง** 🔶 (prototype ยอมให้สร้าง 0%) |
| ออกคูปอง | `WalletCouponProvider.issueCoupon(phone, percent, tradeInNo, expiry=+tradeInCouponValidDays(30))` → `walletRef`; ล้มเหลว → status FAILED + ปุ่ม "ลองส่งใหม่" |
| สถานะ | ISSUED (ยังไม่ใช้) → USED (sync จาก Wallet) / EXPIRED |
| Admin | ตั้งโปร: ชื่อ, ประเภท, ขนาด, subDept, %, ช่วงวันที่ (date picker); แสดง warning ถ้าช่วงเวลาซ้อนกับโปรเงื่อนไขเดียวกัน (ระบบจะเลือก % สูงสุด / เท่ากันใช้ล่าสุด) |
| KPI | คูปองที่ออกทั้งหมด, ใช้แล้ว, Conversion = used/issued |

## 7. จ่ายเงิน VD (`rules/payout.ts`) — จาก `report_vd_payment.html`, `admin.html`

| กติกา | ค่าเริ่มต้น |
|-------|-------------|
| งานที่นำเข้ารอบ | `type=CUSTOMER`, `CLOSED_REPAIRED`, `closedAt ∈ (รอบก่อน, รอบนี้]`, ยังไม่อยู่ใน batch ที่ SENT 🔶 งานไม่อนุมัติที่มีค่าเปิดเครื่อง — ยังไม่จ่าย |
| ฐานค่าซ่อม `repairAmount` | `approvedQuote.subtotal` (ก่อน VAT) 🔶 |
| GP% | snapshot ตอนปิดงาน: `center.gpPctOverride ?? vendor.defaultGpPct` |
| `gpAmount` | `roundHalfUp(repairAmount × gpPct / 100)` |
| หักเพิ่ม | `VendorDeduction` ของ VD ที่ยังไม่ถูกใช้ (ผูก job หรือระดับ VD) |
| `net` | `repairAmount − gpAmount − deductions` |
| รอบ | `PayoutCycleConfig`: ทุกวันที่กำหนดของเดือน (เช่น 5, 20) / ทุก 15 วัน / ทุกสัปดาห์ |
| มุมมอง | By VD (group by Vendor หลัก) / By สาขา (group by branch); ค้นหา: รหัส VD, ชื่อ VD, แบรนด์, เลขงาน, เบอร์, ชื่อลูกค้า |
| คอลัมน์ GP | toggle "แสดง % GP และมูลค่า GP" — แสดงได้เฉพาะ role ที่ `canViewCost` ; %GP เฉลี่ยของกลุ่ม = Σgp/Σrepair |
| ส่งไปทำจ่าย | ติ๊กกลุ่มที่ยังมีรายการรอจ่าย (กลุ่มที่จ่ายครบแล้ว disable) → batch SENT → `AccountingProvider.submitPayoutBatch` → lines SENT; ต่อมา PAID เมื่อบัญชียืนยัน |
| KPI | จำนวน VD/สาขาในรอบ, จำนวนใบงาน, ยอดสุทธิรวม, ใบงานที่ส่งจ่ายแล้ว x/y |
| Export | Excel ระดับใบงาน: VD/สาขา, เลขงาน, ลูกค้า, สินค้า, วันที่ปิดงาน, ยอดค่าซ่อม, GP%, ยอดสุทธิ, สถานะ |

## 8. นิยาม KPI สำหรับ Dashboard

### 8.1 การเงิน
| Metric | นิยาม |
|--------|-------|
| Revenue (ex-VAT) | รับรู้ ณ `JOB_CLOSED`: Σ(OPERATION_FEE + SHIPPING_FEE + OPERATION_FEE_CREDIT) / (1+vat) + approvedQuote.subtotal ของ job ที่ปิดในงวด |
| Cost (ต้นทุนดำเนินงาน) | Σ VD payout net (คำนวณตาม §7 แม้ยังไม่จ่าย) + Σ Shipment.cost (3PL) ของ job ที่ปิดในงวด |
| Gross Profit | Revenue − Cost ; GP Margin = GP / Revenue |
| GP Breakdown | แบ่ง GP ตามสัดส่วน subtotal ของ line type: `LABOR+INSPECTION_FEE` = ค่าแรง, `PART` = ค่าอะไหล่ |
| Δ เทียบงวดก่อน | งวดก่อนความยาวเท่ากัน; Operating Cost ลดลง = ดี |

### 8.2 ปฏิบัติการ
| Metric | นิยาม |
|--------|-------|
| Active Jobs (งานที่เข้ามา) | job ที่ openedAt ในงวด |
| Pending Approval | ปัจจุบัน stage=WAITING_APPROVAL |
| SLA Critical | ปัจจุบัน isOverdue |
| SLA Compliance % | job ที่ปิดในงวดและไม่มี clock breached / job ที่ปิดในงวด |
| Turnaround Time (วัน) | avg(closedAt − openedAt) ของ job ปิดในงวด |
| อัตราอนุมัติซ่อม | APPROVED / (APPROVED + REJECTED) ตาม decidedAt ในงวด (ไม่รวม AUTO) |
| Backlog aging | job ที่ยังไม่ปิด แบ่งตามอายุ openedAt: 0–7, 8–14, 15–30, >30 วัน |
| Operational pipeline | จำนวน job ปัจจุบันตาม pipeline group (04 §1) + % |
| Job trend | จำนวนเปิด vs ปิด ต่อ bucket |
| SLA Violation list | clock ที่ breached & RUNNING เรียงตาม overage (Job, ลูกค้า, สาขา/VD, เกินกำหนด "x วัน y ชม.") |
| งานรออะไหล่ (แทน Stock Alert) | job REPAIRING ที่ clock VD_REPAIR = PAUSED หรือ quote line partWaitDays>0 |

### 8.3 เครือข่าย / VD / ลูกค้า
| Metric | นิยาม |
|--------|-------|
| Branch ranking | revenue และ SLA% ต่อสาขา; อันดับ 1 = "Top performer", อันดับสุดท้าย = "ต้องติดตาม" |
| VD Performance | ต่อ Vendor: จำนวนงาน (ปิดในงวด), On-time % (VD_REPAIR ไม่ breached), อยู่ใน SLA % (clock owner=VD ไม่ breached / ทั้งหมด), เกิน SLA เฉลี่ย (วัน) ของ clock ที่ breached |
| Vendor Concentration | สัดส่วนจำนวน job (เปิดในงวด) ต่อ Vendor: top 3 + "อื่นๆ (n ศูนย์)"; top3 > 60% → ข้อความ "ความเสี่ยงสูง ควรพิจารณาขยายเครือข่าย VD" |
| CSAT | avg(score) ของแบบประเมินในงวด (เต็ม 5) |
| Trade-in Conversion | TradeIn TYPE2 ที่ USED / job CLOSED_NOT_REPAIRED ในงวด |

### 8.4 Executive Summary & Attention Items (rule-based, ไม่ใช้ LLM)
Template: `รายได้รวมอยู่ที่ {revenue} เติบโต {Δ%} จากงวดก่อน โดยมีอัตรากำไรขั้นต้น {margin}% SLA Compliance โดยรวม {sla}% {ดีขึ้น|ลดลง}จากงวดก่อน สาขา {topRevenueBranch} ทำรายได้สูงสุด ขณะที่ {lowestSlaBranch} มี SLA ต่ำที่สุดและควรติดตาม VD 3 อันดับแรกรับงานรวม {top3}% ...`

| Attention rule | ระดับ |
|----------------|-------|
| Vendor SLA% < `vendorSlaThreshold`(85) ติดต่อกัน 3 เดือน | สูง (แดง) |
| Payout ที่ SENT/รอจ่าย อายุ > 30 วัน รวมยอด | ปานกลาง |
| สาขา SLA% ต่ำสุด < 85 | ปานกลาง |
| งานรออะไหล่ในเดือนนี้ (จำนวน + มูลค่า quote) | ติดตาม |

### 8.5 ช่วงเวลา
- Dashboard Overview: รายสัปดาห์ (7 วันล่าสุด, bucket วัน) / รายเดือน (ม.ค.–เดือนปัจจุบัน, bucket เดือน) / รายปี (3 ปีล่าสุด)
- Executive: วันนี้ / เดือนนี้ / ไตรมาสนี้ / ปีนี้ (YTD); trend 12 bucket ล่าสุด; แสดงปี พ.ศ. ใน label
- สิทธิ์: widget ที่มี revenue/cost/GP ซ่อนเมื่อ `canViewCost=false`; widget ปิด/เปิดตาม `DashboardWidgetConfig`

## 9. Validation
| Field | Rule |
|-------|------|
| เบอร์โทร | `^0\d{8,9}$` (เก็บไม่มีขีด, แสดง `08x-xxx-xxxx`) |
| เลขผู้เสียภาษี | 13 หลัก + checksum |
| รหัสไปรษณีย์ | 5 หลัก → lookup จังหวัด/เขต/แขวง; เลือกจังหวัด→เขต→แขวง แล้ว fill zip อัตโนมัติ |
| ภาพ intake / trade-in | 0–4 ภาพ, jpg/png/heic ≤10MB |
| Location | ไม่ว่าง, uppercase, soft pattern `^[A-Z]-\d{2}-\d{2}$` (เตือน ไม่บล็อก) |
| ราคา | ≥ 0, ทศนิยม 2 ตำแหน่ง |
| GP%, โปร % | 0–100 |
| โปร | startDate ≤ endDate |
| SLA | hours > 0 |
| S2 | ≥1 บรรทัดที่มี SKU หรือชื่อสินค้า; qty ≥ 1; VD, ผู้รับเรื่อง บังคับ |
