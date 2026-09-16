# SVCM — Thaiwasadu Service Center Management
## ชุดเอกสารออกแบบระบบ (System Design Pack) สำหรับให้ AI Agent พัฒนาต่อ

> เอกสารชุดนี้ถอดความจากหน้าจอต้นแบบ (HTML prototype) 13 ไฟล์ในโฟลเดอร์ `prototypes/`
> แล้วร้อยเรียงเป็น flow เดียวกันทั้งระบบ พร้อมกำหนด data model, state machine, business rule, API, หน้าจอ และแผนพัฒนา
> **Prototype = แหล่งอ้างอิงด้าน UI/UX เท่านั้น** ข้อมูลในนั้นเป็น mock และมีบางจุดขัดกันเอง — ให้ยึดเอกสารชุดนี้เป็นหลัก

---

## ลำดับการอ่าน (สำหรับ AI Agent)

| # | ไฟล์ | อ่านเมื่อ | เนื้อหา |
|---|------|----------|---------|
| 0 | [`AGENTS.md`](AGENTS.md) | **ก่อนเริ่มเขียนโค้ดทุกครั้ง** | กติกา/convention ที่ agent ต้องทำตาม |
| 1 | [`01_overview.md`](01_overview.md) | เริ่มโปรเจกต์ | บริบทธุรกิจ, ผู้ใช้, flow ครบวงจร, แผนผังหน้าจอ, จุดขัดแย้งใน prototype + คำถามค้าง |
| 2 | [`02_architecture.md`](02_architecture.md) | ตั้งโปรเจกต์ | Tech stack, โครงสร้าง monorepo, integration adapters, NFR |
| 3 | [`03_data_model.md`](03_data_model.md) | ทำ DB / backend | Entity ทั้งหมด + Prisma schema |
| 4 | [`04_workflow_state_machine.md`](04_workflow_state_machine.md) | ทำ Job engine | Stage, transition, action, เงื่อนไข (photo/location), channel DC/DSD/3PL |
| 5 | [`05_business_rules.md`](05_business_rules.md) | ทำ logic คำนวณ | ค่าธรรมเนียม, ใบเสนอราคา/VAT, SLA, เลือก VD, โปร Trade-in, จ่ายเงิน VD, KPI |
| 6 | [`06_api.md`](06_api.md) | ทำ API | REST endpoints, payload, webhook |
| 7 | [`07_screens.md`](07_screens.md) | ทำ Frontend | Route, สิทธิ์, component, data, action ต่อหน้าจอ (map กับ prototype) |
| 8 | [`08_rbac.md`](08_rbac.md) | ทำ Auth/สิทธิ์ | Role, menu matrix, data scope, สิทธิ์เห็นต้นทุน |
| 9 | [`09_implementation_plan.md`](09_implementation_plan.md) | วางงาน | Phase, task, acceptance criteria, E2E test scenarios |

## ▶ เริ่มพัฒนาทีละ Step
ไปที่ [`steps/README.md`](steps/README.md) — 30 step (00–29) แต่ละ step มี Prompt คัดลอกไปวางใน AI Agent + ตารางตรวจผล + คำสั่ง commit/tag

## อภิธานศัพท์ (Glossary)

| คำ | ความหมาย |
|----|----------|
| **CS** | Customer Service หน้าสาขา — เปิดใบแจ้งซ่อม รับ/คืนสินค้าลูกค้า |
| **GR** | Goods Receiving ของสาขา — รับของจาก CS, Pack, ส่งมอบขนส่ง, รับของคืน |
| **DC** | Distribution Center (คลังกลาง) — รถ DC รับจากสาขา พักสินค้า ส่งต่อ VD และขากลับ |
| **VD** | Vendor / ศูนย์บริการซ่อม (ช่าง) มี **VD หลัก** (บริษัท) และ **ศูนย์บริการย่อย** (VendorCenter) |
| **S2** | ผู้ใช้ฝั่งสต็อกสาขา — ส่งซ่อมสินค้าสต็อก (ไม่มีลูกค้า ไม่มีการเงิน) |
| **DSD** | Direct Store Delivery — VD ส่งรถมารับ/ส่งที่สาขาเอง |
| **3PL** | ขนส่งภายนอก (เช่น Kerry) — ใช้เมื่อลูกค้าเลือก "ส่งด่วน" |
| **LON** | ช่องทางแจ้งเตือนลูกค้าผ่าน LINE (LINE OA ของไทวัสดุ) — ส่ง tracking / ใบเสนอราคา |
| **ค่าดำเนินการ** | ค่าธรรมเนียมที่เก็บตอนเปิดงาน (ห้ามใช้คำว่า "มัดจำ") ถ้าลูกค้าอนุมัติซ่อมจะนำไปหักเป็นส่วนลด |
| **GP%** | ส่วนแบ่งที่ไทวัสดุหักจากค่าซ่อมก่อนจ่าย VD |
| **Trade-in** | คูปองส่วนลดซื้อสินค้าใหม่ส่งเข้า Wallet แอปไทวัสดุ (ประเภท 1 หน้างาน / ประเภท 2 หลังบ้าน) |
| **Location** | รหัสช่องเก็บสินค้าในสาขา/DC เช่น `A-05-02` |
| **SLA** | เวลามาตรฐานของแต่ละขั้นตอน ใช้ตัดสินงาน "เกิน SLA" และระบุส่วนงานรับผิดชอบ |

## แผนที่ prototype → เอกสาร

| Prototype | บทบาท | อธิบายใน |
|-----------|-------|----------|
| `index.html` | App shell + เมนูตาม role | 07 §0, 08 |
| `cs.html` | CS เปิดใบแจ้งซ่อม + ปิดงาน | 04, 05 §1, 07 §CS |
| `gr.html` | GR 5 คิว | 04, 07 §GR |
| `dc.html` | DC 5 คิว | 04, 07 §DC |
| `vd.html` | VD 5 คิว + ฟอร์มเสนอราคา + LON preview | 04, 05 §2, 07 §VD |
| `customer_quote.html` | หน้าลูกค้า อนุมัติ/ไม่อนุมัติ + ชำระเงิน (mobile) | 05 §2-3, 07 §Public |
| `s2.html` | งานซ่อมสต็อกสาขา + สติ๊กเกอร์ 2×2 นิ้ว | 04 §5, 07 §S2 |
| `tradein.html` | ออกคูปอง Trade-in | 05 §6, 07 §Trade-in |
| `dashboard.html` | งานซ่อมทั้งหมด + SLA KPI + timeline | 05 §4, 07 §Jobs |
| `dashboard_analytics.html` | Dashboard Overview (ops) | 05 §8, 07 §Analytics |
| `executive_dashboard.html` | Executive Dashboard | 05 §8, 07 §Exec |
| `report_vd_payment.html` | รายงานจ่ายเงิน VD | 05 §7, 07 §Reports |
| `admin.html` | ตั้งค่าหลังบ้าน 10 หมวด | 03, 05, 07 §Admin |
