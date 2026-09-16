# 09 — Implementation Plan (สำหรับ AI Agent)

> ทำทีละ Phase; จบแต่ละ task ต้องผ่าน **Definition of Done**: lint + typecheck + unit test + (ถ้ามี UI) Playwright smoke + อัปเดตเอกสารถ้าตัดสินใจเปลี่ยน

## Phase 0 — Foundation (สัปดาห์ 1)
| # | Task | Acceptance criteria |
|---|------|---------------------|
| 0.1 | Scaffold monorepo ตาม 02 §2 (pnpm, turbo, apps/web, apps/api, packages/shared, db, config) + docker-compose (postgres, redis, minio) | `pnpm dev` รัน web :3000, api :4000; `pnpm test` ผ่าน |
| 0.2 | Prisma schema 03 §3 + migration + seed 03 §4 | `pnpm db:seed` สร้างข้อมูลครบ; ER ตรงเอกสาร |
| 0.3 | Tailwind preset design tokens + shadcn + component กลาง (02 §6) + Storybook/ladle (optional) | หน้า `/dev/components` แสดงทุก component |
| 0.4 | Auth (login/refresh/logout/me) + RBAC guard + data scope helper + menu จาก DB | user แต่ละ role เห็นเมนูตาม 08 §2; เข้า URL ที่ไม่มีสิทธิ์ได้ 403 |
| 0.5 | App shell (§0) + login page | ตาม `index.html` |
| 0.6 | Integration adapters interface + mock providers | สลับ provider ด้วย env ได้ |

## Phase 1 — Master Data & Rules (สัปดาห์ 2)
| # | Task | Acceptance |
|---|------|-----------|
| 1.1 | `packages/shared/rules`: fees, quote, routing, sla, promo, payout, running-no + unit tests ตามตัวอย่างใน 05 | coverage ≥ 95% ในโฟลเดอร์ rules |
| 1.2 | Admin API + UI หมวด 1–11 | CRUD ครบ, validation 05 §9, AuditLog ทุกการแก้ |
| 1.3 | Thai address seed + endpoints + `AddressFields` | พิมพ์ 10260 → กรุงเทพฯ/บางนา |

## Phase 2 — Job Engine + Intake + GR (สัปดาห์ 3–4)
| # | Task | Acceptance |
|---|------|-----------|
| 2.1 | JobEngine (04 §3) + JobEvent + optimistic lock + outbox + SlaEngine (05 §4) | unit test: ทุก transition ถูก/ผิด stage, precondition error codes |
| 2.2 | Attachments presign/complete + `PhotoCaptureButton` | อัปโหลดจาก tablet กล้องได้ |
| 2.3 | CS-1 เปิดใบแจ้งซ่อม + fee preview + intake payment (mock QR/link/POS) + routing + LON mock + ใบแจ้งซ่อม PDF | สร้างงาน 4 กรณีตารางค่าธรรมเนียมได้ถูกยอด; หา VD ไม่เจอ → PENDING_VENDOR_ASSIGNMENT |
| 2.4 | Queue API generic (06 §3.2) + GR screen 5 tabs + overdue banner/modal + KPI | ครบตาม 07 §GR |
| 2.5 | `/jobs` list + KPI + filter + detail timeline + Excel export | ตาม 07 §Jobs |
| 2.6 | Admin คิวรอกำหนดศูนย์ซ่อม | assign แล้วงานเข้าคิว GR |

## Phase 3 — Transport + VD + Customer (สัปดาห์ 5–6)
| # | Task | Acceptance |
|---|------|-----------|
| 3.1 | Shipment legs (04 §4) + dispatch (print driver sheet / driver link page `/d/:token`) | |
| 3.2 | DC screen 5 tabs | |
| 3.3 | 3PL adapter mock: book on pack, webhook simulate (dev button) | |
| 3.4 | VD screen 5 tabs + Quote full-screen + quote PDF + LON preview | |
| 3.5 | Public `/q/:token` (approve/reject + payment mock) + `/t/:token` | |
| 3.6 | Return flow ทั้ง 3 channel + GR return tabs | |

## Phase 4 — Close, Trade-in, S2, Finance (สัปดาห์ 7–8)
| # | Task | Acceptance |
|---|------|-----------|
| 4.1 | CS-2 คิว + Pickup panel + balance + close + `/pay/:token` + CSAT `/s/:token` | ปิดงานไม่ได้ถ้ามียอดค้าง |
| 4.2 | Trade-in API + UI + Wallet mock + sync | promo tests 05 §6.1 ผ่าน |
| 4.3 | S2 stock job + sticker PDF + VD stock flow | |
| 4.4 | Payout report + batch + deductions + Excel | |

## Phase 5 — Dashboards & Hardening (สัปดาห์ 9–10)
| # | Task | Acceptance |
|---|------|-----------|
| 5.1 | Reporting queries/materialized views + `/reports/overview` + Analytics UI | ตัวเลขตรงกับ SQL ตรวจมือบน seed |
| 5.2 | `/reports/executive` + Exec UI + PDF | |
| 5.3 | Real integrations (LINE, payment, 3PL, wallet) ตาม spec ของผู้ให้บริการ | ผ่าน sandbox |
| 5.4 | Security review (08), rate limit, PDPA masking, load test 50k jobs | |
| 5.5 | Resolve 🔶 items ใน 01 §6 กับเจ้าของระบบ | อัปเดตเอกสาร |

## E2E Test Scenarios (Playwright) — ต้องมีอย่างน้อย
| ID | Scenario | Expected |
|----|----------|----------|
| E2E-01 | CUSTOMER / ไม่มีประกัน / ใหญ่ / มาตรฐาน / channel DC / อนุมัติ / จ่ายตอนรับของ | ค่าดำเนินการ 300 → ผ่าน GR→DC→VD→quote 1,284 (subtotal 1,200) → approve → repair → return DC → GR → CS balance 984 → รับชำระ → CLOSED_REPAIRED; payout line net = 1,200 − 18% = 984.00 |
| E2E-02 | CUSTOMER / มีประกัน / เล็ก / ส่งด่วน (3PL) / ไม่อนุมัติ / Trade-in ประเภท 2 | intake 230; 3PL book ตอน pack; webhook delivered → VD_INSPECTING; reject → auto-book 3PL ขาคืน; GR รับคืน → CS → Trade-in (ถ้ามีโปร SMALL T2) → CLOSED_NOT_REPAIRED |
| E2E-03 | CUSTOMER / DSD / อนุมัติพร้อมจ่าย QR ทันที | VD dispatch link → driver page ถ่ายภาพ → VD receive → quote → ลูกค้าจ่าย → balance 0 → CS ปิดได้ทันที |
| E2E-04 | มีประกัน quote total 0 | auto approve → REPAIRING ไม่ส่ง LON ขออนุมัติ |
| E2E-05 | SLA breach GR_PACK | เลื่อนเวลา (fake clock) 5 ชม. → งานแสดงแดงใน GR, KPI "เกิน SLA ฝั่ง GR" = 1, banner count 1 |
| E2E-06 | Pause รออะไหล่ | pause 48 ชม. → dueAt เลื่อน 48 ชม. ไม่ breach |
| E2E-07 | STOCK job S2 2 SKU (qty 2 + 1) | สติ๊กเกอร์ 3 ดวง; VD ไม่มีปุ่มเสนอราคา; ปิดงานโดย S2 |
| E2E-08 | Trade-in ประเภท 1 tie-break | T2/LARGE ได้ "โปรลูกค้าเก่า" 15%; T1/SMALL ได้ 10% |
| E2E-09 | Scope | GR สาขารังสิตไม่เห็นงานบางนา; VD-0091 ไม่เห็นงาน VD-0088 (API 404) |
| E2E-10 | Concurrency | 2 แท็บกด `gr_receive` พร้อมกัน → หนึ่งสำเร็จ อีกอัน 409 |
| E2E-11 | Payout | เลือก By VD 2 กลุ่ม → ส่งไปทำจ่าย → สถานะจ่ายแล้ว, checkbox disabled, KPI x/y อัปเดต |
| E2E-12 | ไม่มีสิทธิ์ต้นทุน | CS เปิด `/reports/vd-payment` → 403; Admin ปิด canViewCost ของ EXECUTIVE → widget GP หายจาก exec |

> ตัวเลข E2E-01: quote lines = ค่าเปิดเครื่อง 300 + อะไหล่ 900 = subtotal 1,200, VAT 84 → total 1,284 ; balance = 1,284 − 300 (credit) = **984**
