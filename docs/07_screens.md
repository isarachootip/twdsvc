# 07 — Screen Specifications

> ทุกหน้าจอให้ดู layout/สไตล์จาก `prototypes/<file>.html` แล้ว implement ด้วย component กลาง (02 §6)
> ข้อมูลทั้งหมดมาจาก API (06) — **ห้าม hardcode mock data** แบบใน prototype
> คอลัมน์ในตารางทุกคิว sortable (คลิกหัวคอลัมน์ ▲▼) ตาม prototype

---

## §0 App Shell — `index.html`
- Route group `(staff)` layout: Sidebar 220px (logo, ชื่อ "Thaiwasadu Service Center", เมนูตาม `/me.menus`), Topbar แสดงชื่อเมนูปัจจุบัน + ชื่อผู้ใช้/สาขา + ปุ่มออกจากระบบ
- Prototype มี dropdown "กำลังดูในฐานะ" สำหรับ demo → ใน production **ไม่มี** (ยกเว้น env=dev ให้ Admin impersonate ได้)
- หน้าแรกหลัง login: Admin/Executive → `/exec`; CS → `/cs`; GR → `/gr`; DC → `/dc`; VD → `/vd`; S2 → `/s2`
- Mobile/tablet: sidebar ยุบเป็น drawer
- `/login`: username, password, ปุ่มเข้าสู่ระบบ (ใหม่ — ไม่มีใน prototype)
- Global: ช่อง "สแกน/ค้นหาเลขงาน" ใน topbar → เปิด Job detail (`/jobs/by-no/:jobNo`)

---

## §Exec Executive Dashboard — `/exec` — `executive_dashboard.html`
**Role:** ADMIN, EXECUTIVE · **API:** `GET /reports/executive?period=`
| ส่วน | รายละเอียด |
|------|-----------|
| Header (navy) | eyebrow "THAIWASADU SERVICE CENTER · EXECUTIVE REVIEW", select period (วันนี้/เดือนนี้/ไตรมาส/ปี YTD), ปุ่ม "ส่งออกรายงาน (PDF)" → `/documents/reports/executive` |
| Executive Summary | การ์ดขอบซ้ายสีทอง ข้อความจาก `summaryText` (ตัวเลขตัวหนา) |
| ผลประกอบการ | 4 KPI cell (Revenue, GP, GP Margin, Operating Cost) + delta ▲▼ สีเขียว/แดง; กราฟ bar revenue + line GP (12 bucket) |
| สุขภาพปฏิบัติการ | Doughnut backlog aging; ตัวชี้วัด: SLA compliance, TAT, อัตราอนุมัติ, backlog รวม |
| เครือข่าย | Horizontal bar รายได้สาขา + ตาราง (สาขา, รายได้, SLA%, อันดับ); Pie vendor concentration + legend + note ความเสี่ยง |
| CX | line chart CSAT×20 / approval% / trade-in%; 3 mini block |
| Attention items | list + badge สูง/ปานกลาง/ติดตาม |
| Print CSS | ซ่อน controls, A4 landscape |

## §Analytics Dashboard Overview — `/analytics` — `dashboard_analytics.html`
**Role:** ADMIN · **API:** `GET /reports/overview`
- Controls: สาขา (ทุกสาขา/รายสาขา), toggle รายสัปดาห์/รายเดือน/รายปี
- 4 KPI gradient card (ACTIVE JOBS, PENDING APPROVAL, SLA CRITICAL, GROSS PROFIT) + sparkline + trend text
- Operational Pipeline 5 วงกลม (INTAKE / WAITING APPROVAL / REPAIR IN-PROGRESS / QA & LOGISTICS / READY FOR PICKUP) + stacked bar %
- Finance chart (bar รายได้, bar ค่าใช้จ่าย, line กำไร)
- SLA Violation List (4 แถวแรก + "ดูทั้งหมด" → `/jobs?flag=OVERDUE_*`)
- ~~Stock Alert~~ → **"งานรออะไหล่"** (C12): Job, สินค้า, อะไหล่ที่รอ, รอมาแล้ว (วัน)
- GP Breakdown donut (Labor/Parts), Job Trend line (เข้า vs เสร็จ), VD Performance สรุป, VD Ranking table (sortable: จำนวนงาน, On-time %, SLA % bar, เกิน SLA เฉลี่ย)
- Quick Actions: รับเครื่องใหม่ → `/cs/new`; ค้นหางานซ่อม → `/jobs`; พิมพ์ใบเสนอราคา → `/vd`; รายงานจ่าย VD → `/reports/vd-payment`; รายงานประจำวัน → `/reports/jobs.xlsx?from=today`
- Widget ใดปิดใน admin หรือ role ไม่มี canViewCost → ไม่ render

## §Jobs งานซ่อมทั้งหมด — `/jobs` — `dashboard.html`
**Role:** ทุก role (ข้อมูลตาม scope) · **API:** `GET /jobs`, `/jobs/kpis`, `/jobs/:id`
- Toprow: title + hint "กดที่ตัวเลขเพื่อดูเฉพาะรายการเร่งด่วน…", date range (default: ต้นเดือน–วันนี้), "Export เป็น Excel"
- KPI cards 6 ใบ (05 §4.5) — คลิกเพื่อ filter (active = ขอบแดง)
- Filter bar: สาขา, ช่องทาง (DSD/DC/3PL), สถานะ (ป้าย stage), ค้นหา (เลขงาน/ชื่อ/เบอร์), "✕ ล้างตัวกรองรายการเร่งด่วน"
- Table: เลขที่ใบแจ้งซ่อม (+วันที่เปิด, แดงถ้าเกิน) · ลูกค้า · สินค้า (+แบรนด์) · สาขา · ช่องทาง · สถานะ badge · ส่วนงานที่รับผิดชอบ · อยู่ใน step นี้มา (ชม. / SLA) · หมายเหตุ ("เกิน SLA (GR)", "ค้างชำระ")
- **Job Detail modal/drawer** (คลิกแถว) 2 คอลัมน์:
  - ซ้าย "อัปเดตสถานะแต่ละขั้นตอน": list SlaStep ที่ใช้กับ job (เรียง seq) — dot เขียว=เสร็จ (เวลาเสร็จ + ผู้ทำ), เหลือง=กำลังทำ (x ชม. จาก SLA y), แดง=เกิน, เทา=รอ; ด้านล่างแสดง event log เต็ม + ภาพ thumbnail ต่อ event
  - ขวา "รายละเอียดใบแจ้งซ่อม": ลูกค้า, เบอร์, ที่อยู่, SKU, สินค้า, แบรนด์, อาการ, ประกัน, ขนาด, วิธีจัดส่ง, สาขา, วันที่เปิด, สถานะ, ศูนย์ซ่อม, ค่าดำเนินการ, ค่าขนส่ง, รวมวันเปิดงาน, วิธีชำระ, ยอดค้างชำระ; ปุ่ม "↗ ดูใบเสนอราคาจาก VD" (มีเมื่อมี quote) หรือข้อความ "ยังไม่ถึงขั้นตอนเสนอราคา"
  - Quote modal: เลข QT, VD badge, รายการ, รวม, รับประกัน, หมายเหตุ VD
  - Admin actions (ถ้ามีสิทธิ์): กำหนด/เปลี่ยน VD, ยกเลิกงาน

## §CS
### CS-1 เปิดใบแจ้งซ่อม — `/cs/new` — `cs.html` (ส่วนซ้าย + การ์ดขวาบน)
**Role:** CS · **API:** `POST /jobs/preview-fees`, `POST /jobs`, `/address/*`, `/attachments/presign`
Layout 2 คอลัมน์ (1.5fr : 1fr); Topbar แสดงเลขงานหลังบันทึก + badge สถานะ
| การ์ด | Fields / พฤติกรรม |
|-------|-------------------|
| ข้อมูลลูกค้า | ชื่อ-นามสกุล*, เบอร์* (พิมพ์เบอร์ → ค้นหาลูกค้าเดิม เสนอ auto-fill), รหัสไปรษณีย์ (5 หลัก → fill จังหวัด/เขต/แขวง options), จังหวัด→เขต→แขวง cascade (เลือกเขต → fill zip), ที่อยู่; checkbox "ใช้ที่อยู่นี้ในการออกใบกำกับภาษี" (ติ๊กออก → modal ใบกำกับภาษี: ชื่อ/บริษัท, เลขผู้เสียภาษี 13 หลัก, ที่อยู่รูปแบบเดียวกัน; บันทึก → แสดง "ออกใบกำกับภาษีในนาม: …"; ยกเลิก → ติ๊กกลับ) |
| สินค้าและการรับประกัน | SKU (ไม่บังคับ), ชื่อสินค้า*, แบรนด์* (dropdown จาก Brand), อาการเสีย*; RadioCards ประกัน (มี/ไม่มี) → ไม่มี: checkbox "อนุญาตส่งซ่อมช่างนอกได้"; RadioCards ขนาด (จาก SizeCategory); RadioCards วิธีจัดส่ง "มาตรฐาน (รอ VD/DC เข้ารับตามรอบ)" / "ส่งด่วน (3PL)" |
| ภาพถ่ายและตำหนิ | 4 ช่อง photo (กล้อง/อัปโหลด), textarea ระบุตำหนิ |
| ค่าใช้จ่าย ณ วันเปิดงาน (ขวา) | ค่าดำเนินการ, ค่าขนส่ง 3PL, รวม — อัปเดตสดเมื่อเปลี่ยนประกัน/ขนาด/วิธีจัดส่ง; note "กรณีลูกค้าอนุมัติซ่อม ค่าดำเนินการจะนำมาเป็นส่วนลดค่าซ่อมสินค้า" |
| วิธีชำระ (ขวา) | RadioCards QR Payment / Link ตัดบัตรเครดิต / เลขที่ใบเสร็จ POS → แสดงปุ่ม "แสดง QR ให้ลูกค้าสแกน" (modal QR + สถานะรอชำระ realtime polling) / "Gen link ตัดบัตรเครดิต ↗" (copy + ส่ง LON) / input เลขใบเสร็จ; ซ่อนทั้งการ์ดเมื่อยอด = 0 |
| Actions (ขวา) | "บันทึก + ส่งข้อมูลแจ้งซ่อมให้ลูกค้าทาง LON" (primary), "พิมพ์ใบแจ้งซ่อม" (หลังบันทึก) |
| Routing result | หลังบันทึก แสดง "ศูนย์ซ่อม: VD-0088-1 บ.ช่างเจริญ · ช่องทาง DC" หรือ warning "ยังไม่พบศูนย์ซ่อมที่รองรับ — ส่งให้ Admin กำหนด" |

### CS-2 คิวงาน CS — `/cs` (ใหม่ แทนการ์ด "จำลอง" ใน `cs.html`)
**Role:** CS · **API:** `GET /queues/CS/*`
- Tabs: **พร้อมรับที่สาขา** (READY_FOR_PICKUP) · รอลูกค้าอนุมัติ (ติดตาม/บันทึกผลแทนลูกค้า, แสดง quote หมดอายุ) · เปิดวันนี้ (ยังรอชำระค่าดำเนินการ)
- คลิกงานใน "พร้อมรับที่สาขา" → **Pickup panel** (ส่วนขวาล่างของ `cs.html`):
  - **อนุมัติซ่อม**: ค่าดำเนินการ (หักเป็นส่วนลด) −฿x · ค่าซ่อม (ตามใบเสนอราคา VD) · ค่าขนส่ง 3PL (ชำระแล้ว) · ยอดสุทธิที่ลูกค้าต้องชำระ; badge สถานะชำระ ("ค้างชำระ ฿x" amber / "ชำระเงินสำเร็จ" green); ลิงก์ "↗ ดูใบเสนอราคาฉบับเต็มจาก VD"; ปุ่ม "รับชำระ" (QR/link/POS); ปุ่ม "ลูกค้ารับสินค้าแล้ว — ปิดงาน" (disabled จนยอดค้าง = 0)
  - **ไม่อนุมัติซ่อม**: ค่าใช้จ่ายที่ลูกค้าจะไม่ได้รับคืน + รายละเอียด; คำถาม Trade-in; ปุ่ม "ต้องการ Trade-in ↗" → `/tradein?type=2&jobId=` (กลับมาแล้วแสดงผลคูปอง); ปุ่ม "รับสินค้ากลับอย่างเดียว"; ปุ่ม "ลูกค้ารับสินค้าแล้ว — ปิดงาน" (แสดงหลังเลือกข้อใดข้อหนึ่ง)

## §GR — `/gr` — `gr.html`
**Role:** GR (สาขาตัวเอง) · **API:** `GET /queues/GR/summary`, `/queues/GR/:key`, actions
Header: title "ส่วนงาน GR", sub "รับสินค้าจาก CS → Pack และพิมพ์ใบปะหน้า → ส่งมอบขนส่ง → รับของซ่อมคืน → ส่งมอบ CS"
- `OverdueSummaryBanner`: จำนวนเกิน SLA ทั้งหมด → modal ตาราง (เลขงาน, ลูกค้า, สินค้า, ขั้นตอนที่ค้าง, เกิน x ชม., ปุ่ม "ไปดำเนินการ" → เปลี่ยนแท็บ)
- KPI 5 ใบ (count + "เกิน SLA: n งาน") คลิก = เปลี่ยนแท็บ; Tabs พร้อม count
- ช่องสแกน QR/เลขงาน ด้านบนตาราง: สแกนแล้ว highlight แถว + โฟกัสปุ่ม action

| Tab | คอลัมน์ | Action cell |
|-----|---------|-------------|
| รับจาก CS | เลขงาน, ลูกค้า, สินค้า, สาขา, รอมาแล้ว(SLA) , 📷, Location input | "ยืนยันรับสินค้า" (disabled จนมีภาพ+Location; ถ้ายังไม่ชำระค่าดำเนินการ แสดง "รอชำระค่าดำเนินการ") → `gr_receive` |
| Pack สินค้า | เลขงาน, ลูกค้า, สินค้า, ช่องทาง badge, เวลาที่ค้าง, Location เดิม, Location ใหม่ input, 📷 | "Pack เสร็จ + พิมพ์ใบปะหน้า" → `gr_pack` → PrintPreviewModal ใบปะหน้า (ขาไป) |
| ส่งมอบขนส่ง | 3 section สีตาม channel: **DC (ฝากส่ง)** น้ำเงิน / **DSD (VD เข้ารับที่สาขา)** teal / **3PL (ขนส่งภายนอก)** coral + badge "n งานรอส่งมอบ"; คอลัมน์: เลขงาน, ลูกค้า, สินค้า, ปลายทาง VD, เวลาที่ค้าง, สถานะรถ (รอจัดรถ / แจ้งคนรถแล้ว / Booked #tracking), 📷 | "สแกนยืนยันส่งมอบ" (disabled จนรถถูก dispatch + มีภาพ) → `gr_handoff` |
| รับคืนจาก VD/DC/3PL | เลขงาน, ลูกค้า, สินค้า, ช่องทางที่ส่งคืนมา, เวลาที่ค้าง, 📷, Location | "ยืนยันรับคืน" → `gr_receive_return` |
| รอส่งมอบ CS | เลขงาน, ลูกค้า, สินค้า, Location, เวลาที่ค้าง, 📷 | "ส่งมอบให้ CS" → `gr_deliver_cs` |
แถวที่ทำเสร็จในรอบนี้แสดงจางพร้อม badge เขียวจน refresh (optimistic UI)

## §DC — `/dc` — `dc.html`
**Role:** DC · Header sub: "เข้ารับจากสาขา → รับเข้า Location → ส่งมอบให้ VD → รับคืนจาก VD → ส่งคืนกลับสาขา" + date range + Export Excel (หลาย sheet)
Overdue banner + KPI 5 ใบ + Tabs เหมือน GR
| Tab | คอลัมน์ | Action |
|-----|---------|--------|
| เข้ารับจากสาขา | filter สาขา; เลขงาน, สาขา, ลูกค้า, สินค้า, รอมาแล้ว | ยังไม่ dispatch: "Print เอกสารให้คนรถ" / "ส่ง Link ให้คนรถ" → `dispatch_pickup`; dispatch แล้ว: badge "แจ้งคนรถแล้ว — รอ GR ส่งมอบ" |
| รับเข้า Location | เลขงาน, สาขาต้นทาง, ลูกค้า, สินค้า, เวลาที่ค้าง, Location input | "ยืนยันรับเข้า Location" → `dc_receive_outbound` |
| ส่งมอบให้ VD | เลขงาน, ลูกค้า, สินค้า, VD ที่มารับ, สถานะรถ VD, เวลาที่ค้าง, 📷 | "ยืนยันส่งมอบ + Clear Location" → `dc_handoff_vd` |
| รับคืนจาก VD | เลขงาน, ลูกค้า, สินค้า, VD ที่ส่งคืนมา, เวลาที่ค้าง, 📷 | "ยืนยันรับคืนจาก VD" → `dc_receive_inbound` |
| ส่งคืนกลับสาขา | เลขงาน, สาขาปลายทาง, ลูกค้า, สินค้า, เวลาที่ค้าง | Print/Link คนรถ → `dispatch_pickup`; แล้ว "ยืนยัน: จัดส่งออกจาก DC แล้ว" → `dc_dispatch_confirm` → badge "ส่งคืนกลับสาขาแล้ว — รอ GR รับที่สาขา" |

## §VD — `/vd` — `vd.html`
**Role:** VD (ศูนย์ย่อยตัวเอง) · Topbar: "ช่าง (VD-0088 บ.ช่างเจริญ)" · sub: "รับงาน → ประเมิน/เสนอราคา → รอลูกค้าอนุมัติ → กำลังซ่อม → Pack และส่งคืน" · date range + Export
Overdue banner + KPI 5 + Tabs
| Tab | รายละเอียด |
|-----|-----------|
| งานรอรับ | filter: ทั้งหมด / เข้ารับที่ DC / เข้ารับที่สาขา / รอ 3PL มาส่ง; ช่อง "Scan QR หรือคีย์เลขใบแจ้งซ่อม เพื่อยืนยันส่งมอบช่าง แล้วกด Enter" → `vd_receive`; คอลัมน์: เลขงาน(+วันที่), ลูกค้า, สินค้า, สาขาที่รับ, ประเภทรับเข้า, ประกัน, รอมาแล้ว, Action ตามสถานะ: **รอ 3PL** → badge "รอ 3PL นำส่งถึงศูนย์บริการ" (dev: ปุ่มจำลอง webhook); **ยังไม่ส่งรถ** → "Print เอกสารไปรับงาน" / "Gen Link" (แสดง URL + ปุ่มคัดลอก) → `dispatch_pickup`; **ส่งรถแล้ว (DSD)** → badge "ส่งรถเข้ารับ" + 📷 "ถ่ายภาพยืนยันรับสินค้า" + "ยืนยัน: ขนส่งรับสินค้าแล้ว" → `carrier_confirm_pickup`; **ระหว่างขนส่ง** → badge "ขนส่ง VD รับแล้ว" + "ส่งมอบช่าง (ถึงศูนย์บริการ VD)" → `vd_receive` |
| ประเมิน/เสนอราคา | ตาราง: เลขงาน, ลูกค้า, สินค้า, ประกัน, รอมาแล้ว, "ประเมิน + เสนอราคา" (STOCK: "เริ่มซ่อม") → **Quote full-screen page** `/vd/jobs/:id/quote` |
| รอลูกค้าอนุมัติ | เลขงาน, ลูกค้า, สินค้า, ยอดเสนอราคา, รอมาแล้ว, "ดูหน้า LON ลูกค้า" (preview ข้อความ LINE), "แก้ไขใบเสนอราคา" |
| กำลังซ่อม | เลขงาน, ลูกค้า, สินค้า, ระยะเวลาซ่อม (วัน), เวลาที่ใช้ไป(SLA), "รออะไหล่"/"ซ่อมต่อ" toggle, "ซ่อมเสร็จ" |
| Pack และส่งคืน | เลขงาน, ลูกค้า, สินค้า, ช่องทางส่งคืน (DC / 3PL / สาขา (ผ่าน GR)), เวลาที่ค้าง; DC/DSD: 📷 + "Pack เสร็จ + พิมพ์ใบปะหน้า (ส่งให้ DC)" / "Pack เสร็จ + ส่งมอบให้ GR"; 3PL: "Confirm ซ่อมเสร็จ พร้อมส่งคืน (Auto Book 3PL)" → print modal ใบปะหน้าขาคืน |

**Quote full-screen** (`#quote-fullscreen`): header "← กลับ", "ประเมิน + เสนอราคา — JB-…", สินค้า
- การ์ด 1: สถานะประกัน (read-only), ค่าดำเนินการ/ค่าเปิดเครื่อง (auto, read-only)
- การ์ด 2: รายการอะไหล่ (แถว: รายการ, ราคา, รออะไหล่ (วัน), รับประกัน (วัน), ✕) + "+ เพิ่มบรรทัดอะไหล่"; เพิ่ม "+ เพิ่มค่าแรง"
- การ์ด 3: ระยะเวลาซ่อมรวมโดยประมาณ (วัน)*, รับประกันงานซ่อม (read-only), หมายเหตุถึงลูกค้า
- Sidebar sticky: รวมก่อน VAT, VAT 7%, รวมทั้งสิ้น, "ส่งใบเสนอราคา"
- หลังส่ง → modal เอกสารใบเสนอราคา (05 §2.3) → "ส่งให้ลูกค้าทาง LON" → modal preview ข้อความ LINE (ส่วน "จำลองลูกค้ากด" แสดงเฉพาะ env dev)

## §TradeIn — `/tradein` — `tradein.html`
**Role:** CS · **API:** 06 §4
- KPI 3 ใบ: คูปองที่ออกทั้งหมด, ใช้แล้ว, Conversion %
- "เลือกประเภท Trade-in": 2 การ์ด (ประเภท 1 หน้างาน / ประเภท 2 หลังบ้าน) — รองรับ query `?type=2&jobId=` จากหน้า CS
- ฟอร์มประเภท 1: ชื่อ*, เบอร์*, SKU, ชื่อสินค้า*, แบรนด์, อาการ, ขนาด* (onChange → preview โปร), ภาพ 4 ช่อง, note สีฟ้า "ระบบเลือกโปร "…" ให้อัตโนมัติ — ส่วนลด x% (ประเภท 1, สินค้าเล็ก)", ปุ่ม "สร้างคูปอง ส่งเข้า Wallet ลูกค้า"
- ฟอร์มประเภท 2: รายการ job ที่เข้าเงื่อนไข (การ์ดเลือกได้) → fields read-only + preview โปร + ปุ่มสร้าง
- สำเร็จ → toast "สร้างคูปอง TI-… สำเร็จ — ส่วนลด x% เข้า Wallet ตามเบอร์ …"
- ประวัติ: ค้นหา (เลข TI/ชื่อ/เบอร์); คอลัมน์: เลขที่ Trade-in, ประเภท, ลูกค้า, เบอร์, สินค้า, ส่วนลด, สถานะ (ยังไม่ใช้/ใช้แล้ว/ส่งไม่สำเร็จ), วันที่ออก

## §S2 — `/s2` — `s2.html`
**Role:** S2 · Topbar badge "สิทธิ์: S2"
- sub: "ไม่ต้องกรอกข้อมูลลูกค้า ไม่มีการเสนอราคาเก็บเงิน มีเฉพาะช่องทาง DC และ VD"
- ส่วนที่ 1 ข้อมูล VD ปลายทาง: **เลือกศูนย์ซ่อม** (combobox ค้นหารหัส/ชื่อ → fill รหัส+ชื่อ), ผู้รับเรื่อง (เจ้าหน้าที่ VD ที่ยินยอมให้ส่งซ่อม)*
- ส่วนที่ 2 รายการสินค้า: grid แถว (SKU, ชื่อสินค้า, จำนวน, เลขที่ Hold stock, อาการเสีย, ✕) + "+ เพิ่ม SKU"; RadioCards วิธีจัดส่ง DC / VD (DSD) (disable ตัวเลือกที่ศูนย์ไม่รองรับ); note ข้ามขั้นตอนการเงิน; ปุ่ม "เปิดใบแจ้งซ่อมสต็อกสาขา"
- สำเร็จ → Print modal สติ๊กเกอร์ (toolbar: "ใบแปะสินค้า ขนาด 2×2 นิ้ว — พิมพ์ลงกระดาษ A4 แล้วตัดไปติดที่ตัวสินค้า", Print, ปิด) — `@media print` แสดงเฉพาะแผ่น A4
- ตาราง "งานสต็อกสาขาที่เปิดไว้": ค้นหา (เลขงาน/SKU/VD), คอลัมน์ sortable: เลขที่งาน, รหัส VD, ชื่อ VD, ช่องทาง, สถานะ, วันที่เปิด, รายการสินค้า (SKU ×qty); ปุ่ม "พิมพ์สติ๊กเกอร์ซ้ำ", "ปิดงาน" (เมื่อ READY_FOR_PICKUP)

## §Reports รายงานจ่ายเงิน VD — `/reports/vd-payment` — `report_vd_payment.html`
**Role:** ADMIN · **API:** 06 §5
- Filter card: รอบจ่าย (select), ตั้งแต่/ถึงวันที่, ค้นหา, "Export เป็น Excel"; tabs By VD / By สาขา; checkbox "แสดงคอลัมน์ % GP และมูลค่า GP (บาท)" (ซ่อนถ้าไม่มี canViewCost)
- KPI 4 ใบ (05 §7)
- ตาราง: ☐ (select all) · VD/สาขา · จำนวนใบงาน · ยอดค่าซ่อมรวม · [% GP เฉลี่ย · มูลค่า GP] · ยอดสุทธิหัก GP · สถานะ (รอจ่าย/จ่ายแล้ว) · "ดูรายละเอียด ↗" (modal: เลขงาน, ลูกค้า, สินค้า, วันที่ปิดงาน, ยอดค่าซ่อม, หัก GP%, ยอดสุทธิ)
- Sticky footer: "เลือกแล้ว n รายการ — รวม ฿x" + "ส่งไปทำจ่าย" (confirm dialog แทน `alert`)
- เพิ่ม: ปุ่ม "+ รายการหักเงิน VD" (C15)

## §Admin ตั้งค่าระบบหลังบ้าน — `/admin/:section` — `admin.html`
**Role:** ADMIN · Sidebar ย่อย 10 หมวดมีเลขลำดับ · ทุกหมวดมีปุ่ม "บันทึก…" + toast "บันทึกแล้ว ✓" · ลบแถว = ✕ (confirm ถ้ามีการอ้างอิง)
| # | Section | UI | API |
|---|---------|----|-----|
| 1 | Vendor Portal | การ์ดต่อ VD หลัก: รหัส, ชื่อบริษัท, GP% เริ่มต้น, SLA ซ่อมเริ่มต้น (วัน), ค่าเปิดเครื่อง (มี/ไม่มีประกัน), รับประกันงานซ่อม (วัน), เป็นศูนย์แบรนด์; แบรนด์ที่รับผิดชอบ (multi tags + select เพิ่ม), ขนาดที่รับผิดชอบ (multi); ตารางศูนย์ย่อย: รหัส, โซน (สาขา/คลัง), ที่อยู่, โทร, วิธีรับ-ส่ง (DSD/DC/DC+DSD), GP% override (placeholder ค่าเริ่มต้น), SLA override; "+ เพิ่มศูนย์ย่อย", "ลบ VD หลักนี้ ✕", "+ เพิ่ม VD หลัก", "บันทึก Vendor Portal" | `/vendors` |
| 2 | ค่าดำเนินการ / ค่าขนส่ง | 2 การ์ด: ตาราง ประเภทสินค้า–ค่าดำเนินการ, ประเภทสินค้า–ค่าขนส่ง 3PL; "+ เพิ่มประเภท" (สร้าง SizeCategory) | `/size-categories`, `/fee-rates` |
| 3 | สาขาไทวัสดุ | ตาราง: ชื่อสาขา/คลัง, ประเภท (สาขา/DC), ผู้จัดการเขต (disabled ถ้า DC) + hint เรื่อง District | `/sites`, `/district-managers` |
| 4 | จับคู่สาขา-VD | ตาราง: สาขา (select) → ผู้จัดการเขต auto, ศูนย์ VD อันดับ 1 (combobox), สำรอง, ช่องทางมาตรฐาน | `/branch-vendor-routes` |
| 5 | SLA | ตาราง: #, ขั้นตอน, เริ่มนับเมื่อ, หยุดเมื่อ, SLA ("24 ชม."/"2 วัน"), เจ้าของ, เปิด/ปิด; "+ เพิ่มขั้นตอน" (เลือก event จาก dropdown) | `/sla-steps` |
| 6 | สิทธิ์ผู้ใช้งาน | Matrix เมนู × role (Admin, Executive, CS, GR, DC, VD, S2) toggle + จัดการผู้ใช้ (tab ย่อย) | `/rbac/menu-permissions`, `/users` |
| 7 | SKU ค่าซ่อม | ตาราง SKU, รายละเอียด, ประเภทรายการเงิน | `/repair-skus` |
| 8 | รอบจ่ายเงิน Vendor | รูปแบบรอบ, วันที่ในเดือน, วันเริ่มรอบถัดไป; note วิธีคำนวณ | `/payout-config` |
| 9 | Trade-in / คูปอง | ตาราง: ชื่อโปร, ประเภท, ขนาด, sub_dept, ส่วนลด %, เริ่ม, สิ้นสุด (date), สถานะ (Active/ร่าง/ปิด); note กติกาโปรซ้อน | `/promotions` |
| 10 | Dashboard | toggle widget + select เพิ่มรายงาน (ปริมาณงานตามสาขา, สัดส่วนอนุมัติ, Vendor Scorecard, DC Scorecard, ยอด Trade-in, งานตามช่องทาง, กำไรขาดทุนต่องาน); สิทธิ์เห็นต้นทุนต่อ role; Export Excel ตามช่วงวันที่ | `/dashboard-widgets`, `/rbac/data-permissions` |
| 11 | ตั้งค่าทั่วไป (ใหม่) | VAT, อายุลิงก์ใบเสนอราคา, คิดค่า 3PL ขากลับ, อายุคูปอง, เกณฑ์ SLA VD | `/settings` |
| 12 | รอกำหนดศูนย์ซ่อม (ใหม่) | คิว job `PENDING_VENDOR_ASSIGNMENT` + ปุ่มกำหนด | `/queues/ADMIN/pending-vendor-assignment` |

## §Public (mobile-first, max-width 440px, header แดง "ศูนย์บริการซ่อมไทวัสดุ / Thaiwasadu Service Center")
| Route | Prototype | เนื้อหา |
|-------|-----------|---------|
| `/q/:token` | `customer_quote.html` | การ์ดข้อมูล (เลขงาน, สินค้า, ศูนย์บริการ), รายการค่าใช้จ่าย, รวมก่อน VAT, VAT, total box, ระยะเวลาซ่อม/รับประกัน; ปุ่ม "อนุมัติซ่อม" → เลือกวิธีชำระ (QR PromptPay / บัตรเครดิต → **redirect hosted page** / "ชำระภายหลังที่สาขา") → QR view ("ฉันชำระเงินแล้ว" = poll สถานะ ไม่ใช่ mark paid เอง) → ผลลัพธ์ ✓; ปุ่ม "ไม่อนุมัติซ่อม" → confirm → ผลลัพธ์ ✕ พร้อมข้อความ; หมดอายุ/ตัดสินใจแล้ว → หน้าสถานะ |
| `/t/:token` | (ใหม่) | สถานะปัจจุบัน + timeline ย่อ (รับเรื่อง, ส่งซ่อม, ประเมินราคา, ซ่อม, ส่งคืน, พร้อมรับ) + ลิงก์ไปใบเสนอราคา/ชำระเงินถ้ามี |
| `/pay/:token` | (ใหม่) | ยอดค้าง + QR/บัตร |
| `/d/:token` | (ใหม่) | งานคนรถ: จุดรับ→จุดส่ง, เลขงาน, สินค้า, ผู้ติดต่อ; DSD: ถ่ายภาพยืนยันรับสินค้า |
| `/s/:token` | (ใหม่) | ดาว 1–5 + ความคิดเห็น |

## ข้อความ/สถานะว่าง (ใช้ซ้ำ)
- ตารางว่าง: "ไม่มีงานในคิวนี้" / "ไม่พบรายการที่ตรงกับตัวกรอง" / "ไม่มีงานเกิน SLA ในขณะนี้"
- ปุ่ม disabled ต้องมี tooltip บอกเหตุผล (จาก `allowed-actions.disabledReason`)
- แทน `alert()` ทั้งหมดใน prototype ด้วย toast / dialog
